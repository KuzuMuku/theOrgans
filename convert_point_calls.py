#!/usr/bin/env python3
"""Convert the mechanical self-side kubejs_call executions to builtin executors.

Pass 2.5 of the regeneration pipeline (run via regenerate.bash, AFTER
convert_target_calls.py and BEFORE resolve_hooks.py): rewrites the pack JSON in
place. Idempotent — a re-run finds no matching kubejs_call left and is a no-op.

Each convertible callback is a self-side point action that (optionally) spends a
resource counter and then runs ONE vanilla effect (heal / apply a mob effect /
repair / grant items). The engine already models all of these as PointExecutors
(heal, apply_mob_effect, repair_item, grant_items, ...), and the execution's
existing point_type/point_id/consume_points/max_consume binding reproduces the
trigger-point gate 1:1.

The one thing the single-binding execution model can NOT express is the SECONDARY
resource cost (the old `spendResource(player, n)` on the biome resonance pool).
We fold that cost into EVERY triggering event's `consume_points[]`: the event that
adds the trigger runtime point also consumes `n` from the resonance counter, so the
spend happens on exactly the same per-invocation cadence as before — with no engine
change. We also ensure the block gates on that counter (`point ... gte n`), because
the executor's trigger point is independent of the cost consume, so without the gate a
0-resource trigger would run the effect for free. (Blocks that already gated on the
resource — e.g. resonance>=25 — are left as-is.) The cost-fold is only refused for an
eventless block (nothing would drive the executor anyway).

The legacy `custom_display_key` (message.organkubejs.*) is DROPPED: the builtin
executors are data-driven, so OrganEffectDisplayBuilder renders them from their own
fields, and keeping the mask would hide that (and render as a raw key on neoforge,
where organKubejs lang is absent). Mirrors the 45f62cb / convert_target_calls policy.

Callbacks that ADD to a (potentially capacity-clamped) counter, need an organ_set
cost split, roll real loot tables, or otherwise restructure the block are NOT here
yet — they stay kubejs_call for the forge fallback and are tracked as follow-up.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "organs" / "data"

# callback -> {exec: {type + executor fields}, cost: {type,id,amount,source} | None}
# `exec` replaces the execution's `type` and merges its fields; the point binding
# (point_type/point_id/consume_points/max_consume) is preserved from the original.
# `cost`, if present, is appended to EVERY triggering event's consume_points (so the
# spend happens on each invocation, matching the old per-trigger spendResource); and a
# `point <counter> gte <amount>` gate is added to the block if it does not already gate
# on that counter — without it a 0-resource trigger would still run the executor for
# free (the executor's trigger point is independent of the cost consume).
TABLE = {
    # vanillaSnow — resonance>=25 gate (already a declarative `point` condition on the
    # block); spends 2 resonance; heals 0.5 heart.
    "vanillaSnow_frostseal_heal": {
        "exec": {"type": "heal", "amount": 1.0},
        "cost": {"type": "counter", "id": "vanillasnow:vanillaSnow_resonance",
                 "amount": 2, "source": "vanillaSnow_system"},
    },
    # vanillaSnow — resonance>=20 gate; spends 2 resonance; Resistance 80t amp0.
    "vanillaSnow_freezebreak_guard_self": {
        "exec": {"type": "apply_mob_effect", "effect": "minecraft:resistance",
                 "duration_ticks": 80, "amplifier": 0},
        "cost": {"type": "counter", "id": "vanillasnow:vanillaSnow_resonance",
                 "amount": 2, "source": "vanillaSnow_system"},
    },
    # vanillaNether — no spend; roll one weighted item from ASH_SPLEEN_LOOT.
    # grant_items skips unregistered items itself, so modded (alexsmobs) entries that
    # are absent are safely dropped (matches the old itemExists filter).
    "vanillaNether_grant_ash_spleen_loot": {
        "exec": {"type": "grant_items", "rolls": 1, "unique": False, "drop_if_full": True,
                 "items": [
                     {"item": "minecraft:blaze_powder", "count": 1, "weight": 6},
                     {"item": "minecraft:blaze_rod", "count": 1, "weight": 3},
                     {"item": "minecraft:ghast_tear", "count": 1, "weight": 2},
                     {"item": "minecraft:magma_cream", "count": 1, "weight": 4},
                     {"item": "minecraft:wither_skeleton_skull", "count": 1, "weight": 1},
                     {"item": "alexsmobs:blood_sac", "count": 1, "weight": 5},
                     {"item": "alexsmobs:mosquito_proboscis", "count": 1, "weight": 3},
                     {"item": "alexsmobs:hemolymph_sac", "count": 1, "weight": 4},
                     {"item": "alexsmobs:warped_muscle", "count": 1, "weight": 3},
                 ]},
    },
    # vanillaDesert — no spend; roll one weighted item from HUNT_LOOT (iceandfire).
    "vanillaDesert_grant_hunt_loot": {
        "exec": {"type": "grant_items", "rolls": 1, "unique": False, "drop_if_full": True,
                 "items": [
                     {"item": "iceandfire:deathworm_chitin_red", "count": 1, "weight": 6},
                     {"item": "iceandfire:deathworm_chitin_yellow", "count": 1, "weight": 6},
                     {"item": "iceandfire:deathworm_chitin_white", "count": 1, "weight": 6},
                     {"item": "iceandfire:deathworm_egg", "count": 1, "weight": 3},
                     {"item": "iceandfire:deathworm_tounge", "count": 1, "weight": 1},
                     {"item": "iceandfire:myrmex_desert_chitin", "count": 1, "weight": 6},
                     {"item": "iceandfire:myrmex_desert_resin", "count": 1, "weight": 4},
                     {"item": "iceandfire:myrmex_desert_egg", "count": 1, "weight": 2},
                     {"item": "iceandfire:myrmex_stinger", "count": 1, "weight": 1},
                 ]},
    },
    # vanillaSwamp — spends 2 resonance; rolls BONUS_LOOT twice. Block has NO resonance
    # gate, so the converter adds `point counter:...resonance gte 2`.
    "vanillaSwamp_spend_bonus_loot": {
        "exec": {"type": "grant_items", "rolls": 2, "unique": False, "drop_if_full": True,
                 "items": [
                     {"item": "minecraft:slime_ball", "count": 2, "weight": 3},
                     {"item": "minecraft:lily_pad", "count": 1, "weight": 2},
                     {"item": "minecraft:spider_eye", "count": 1, "weight": 1},
                 ]},
        "cost": {"type": "counter", "id": "vanillaswamp:vanillaSwamp_resonance",
                 "amount": 2, "source": "vanillaSwamp_system"},
    },
    # vanillaSnow — frostseal_suppress: shorten the active Slowness (cold debuff) by 20t.
    # No spend, no extra gate (JS shortenColdDebuffs only touches MOVEMENT_SLOWDOWN).
    "vanillaSnow_frostseal_suppress": {
        "exec": {"type": "shorten_effect", "effect": "minecraft:slowness", "amount": 20},
    },
    # vanillaSnow — deposition_conduit: spend 2 resonance, grant Resistance 60t, shorten the
    # cold Slowness by 20t. Block already gates resonance>=40 (> cost), so no new gate added.
    "vanillaSnow_deposition_conduit": {
        "exec": [
            {"type": "apply_mob_effect", "effect": "minecraft:resistance", "duration_ticks": 60, "amplifier": 0},
            {"type": "shorten_effect", "effect": "minecraft:slowness", "amount": 20},
        ],
        "cost": {"type": "counter", "id": "vanillasnow:vanillaSnow_resonance",
                 "amount": 2, "source": "vanillaSnow_system"},
    },
    # vanillaSculk — ancient_step_quiet: when resonance>0, open a quiet window whose length
    # scales with resonance (min(180, max(60, floor(resonance*2)))). The resonance>0 guard
    # becomes a block gate; the window value/length is written by the set_runtime executor.
    "vanillaSculk_ancient_step_quiet": {
        "exec": {"type": "set_runtime",
                 "window": "runtime:vanillasculk:vanillaSculk_quiet_window", "value": 1,
                 "duration_ticks": "min(180, max(60, floor(point('counter:vanillasculk:vanillaSculk_resonance') * 2)))"},
        "gate_conditions": [{"type": "point", "point": "counter:vanillasculk:vanillaSculk_resonance",
                             "op": "gt", "value": 0}],
    },
}

BINDING_KEYS = ("point_type", "point_id", "source", "consume_points", "max_consume")


def callback_of(execution):
    cfg = execution.get("config")
    if isinstance(cfg, dict) and cfg.get("callback"):
        return cfg["callback"]
    return execution.get("callback")


def build_execution(execution, spec):
    """Return the retyped execution(s), carrying over the original point binding.

    ``spec['exec']`` may be a single executor dict or a list of them (one kubejs_call
    that fanned out to several builtin executors, e.g. apply_mob_effect + shorten_effect).
    Each emitted execution keeps the original trigger-point binding so they all fire off
    the same request point."""
    execs = spec["exec"]
    if isinstance(execs, dict):
        execs = [execs]
    out = []
    for e in execs:
        new = dict(e)
        for k in BINDING_KEYS:
            if k in execution:
                new[k] = execution[k]
        out.append(new)
    return out


def _add_gate_conditions(effect, conditions, stats):
    """Add block-level gate conditions (deduped against existing identical entries)."""
    conds = effect.get("conditions", [])
    for g in conditions:
        if g not in conds:
            conds.append(dict(g))
            stats["gates_added"] += 1
    effect["conditions"] = conds


def fold_cost(effect, cost, stats):
    """Append `cost` to EVERY triggering event's consume_points, and ensure the block
    gates on the cost counter so a 0-resource trigger can't run the executor for free.

    Charging each event is correct because only the event that actually fires adds the
    trigger point (and thus runs the executor), so the resource is spent once per real
    invocation — exactly the old per-call spendResource. Returns True if the block has
    at least one event (so the executor is actually driven), else False (refused: the
    execution is left as kubejs_call rather than silently never charging).
    """
    events = effect.get("events", [])
    if not events:
        stats["cost_refused"] += 1
        return False
    for ev in events:
        consume = ev.get("consume_points")
        if not isinstance(consume, list):
            consume = []
        if cost not in consume:
            consume.append(dict(cost))
        ev["consume_points"] = consume
    _ensure_cost_gate(effect, cost, stats)
    return True


def _ensure_cost_gate(effect, cost, stats):
    """Add `point counter:<id> gte <amount>` to the block unless it already gates on
    that counter (idempotent; a stronger existing gate like gte 25 is left untouched)."""
    point_key = f"{cost['type']}:{cost['id']}"
    conds = effect.get("conditions", [])
    for c in conds:
        if isinstance(c, dict) and c.get("type") == "point" and c.get("point") == point_key:
            return
    conds.append({"type": "point", "point": point_key, "op": "gte", "value": cost["amount"]})
    effect["conditions"] = conds
    stats["gates_added"] += 1


def process_effect(effect, stats):
    new_execs = []
    for x in effect.get("executions", []):
        if x.get("type") != "kubejs_call":
            new_execs.append(x)
            continue
        spec = TABLE.get(callback_of(x))
        if spec is None:
            new_execs.append(x)
            continue
        cost = spec.get("cost")
        if cost is not None and not fold_cost(effect, cost, stats):
            # could not safely attach the cost — leave as kubejs_call fallback
            new_execs.append(x)
            continue
        if spec.get("gate_conditions"):
            _add_gate_conditions(effect, spec["gate_conditions"], stats)
        new_execs.extend(build_execution(x, spec))
        stats["converted"] += 1
    effect["executions"] = new_execs
    return effect


def main(argv):
    dry_run = "--dry-run" in argv
    stats = {"converted": 0, "cost_refused": 0, "gates_added": 0}
    changed_files = 0
    for f in sorted(DATA.glob("*-pack/data/*/organapi/organs/*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        before = json.dumps(data, ensure_ascii=False, sort_keys=True)
        for effect in data.get("effects", []):
            process_effect(effect, stats)
        after = json.dumps(data, ensure_ascii=False, sort_keys=True)
        if before != after:
            changed_files += 1
            if not dry_run:
                f.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[point_calls] converted {stats['converted']} kubejs_call -> builtin executor "
          f"across {changed_files} files"
          + (f"; +{stats['gates_added']} cost gates" if stats["gates_added"] else "")
          + (f"; {stats['cost_refused']} cost-folds refused (eventless block)" if stats["cost_refused"] else "")
          + (" (dry-run)" if dry_run else ""))


if __name__ == "__main__":
    main(sys.argv[1:])
