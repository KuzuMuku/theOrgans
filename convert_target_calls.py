#!/usr/bin/env python3
"""Convert the mechanical kubejs_target_call executions to the target_strike executor.

One-shot, like resolve_hooks.py: rewrites the pack JSON in place, then this script is
kept only as a record. Each convertible callback maps to a gate (chance / mark
requirement) plus an ordered ops[] list, faithfully reproducing the old JS target
handler. Callbacks that spend resources, introspect event type/amount, scan nearby
entities, or touch iron-spell are NOT here — they stay kubejs_target_call for step 7.

The executor keeps the execution's existing point_type/point_id/consume_points/
max_consume (the request-point gate) and custom_display_key; this script only swaps
the type to `target_strike` and injects `config.chance` / `config.require_mark` /
`config.require_no_mark` / `config.ops`.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "organs" / "data"

# callback -> {gate:{chance?,require_mark?,require_no_mark?}, ops:[...], gate_condition?:cond}
# mark/effect ids use the per-biome namespace the pack already carries (rewritten from kubejs:).
# gate_condition, if present, is added to the enclosing effect's conditions[] (online gates).
def ns_mark(ns, path):
    return f"{ns}:{path}"


TABLE = {
    # --- pure mark ---
    "vanillaDesert_apply_mark": {"ops": [{"op": "mark", "mark": "vanilladesert:vanillaDesert_mark"}]},
    "vanillaSnow_melee_mark": {"ops": [{"op": "mark", "mark": "vanillasnow:vanillaSnow_mark"}]},
    "mekanismT1_calibration_mark": {"gate": {"chance": 0.15},
                                     "ops": [{"op": "mark", "mark": "mekanismt1:mekanismT1_mark"}]},
    "vanillaSculk_melee_mark": {"gate": {"chance": 0.25},
                                 "ops": [{"op": "mark", "mark": "vanillasculk:vanillaSculk_mark"},
                                         {"op": "effect", "effect": "minecraft:darkness", "duration_ticks": 80, "amplifier": 0}]},
    # --- mark + effect ---
    "vanillaOcean_mark_and_slow": {"ops": [{"op": "mark", "mark": "vanillaocean:vanillaOcean_mark"},
                                            {"op": "effect", "effect": "minecraft:movement_slowdown", "duration_ticks": 60, "amplifier": 0}]},
    # --- mark + fire ---
    "vanillaNether_blazefire_arm_strike": {"ops": [{"op": "mark", "mark": "vanillanether:vanillaNether_mark"},
                                                    {"op": "fire", "seconds": 2}]},
    # --- fire only ---
    "vanillaNether_spiritflame_lung_ignite": {"ops": [{"op": "fire", "seconds": 2}]},
    # --- fire + knockback ---
    "vanillaNether_inferno_shoulderplate_burst": {"ops": [{"op": "fire", "seconds": 3},
                                                           {"op": "knockback", "strength": 0.45}]},
    # --- knockback only ---
    "vanillaOcean_push_target": {"ops": [{"op": "knockback", "strength": 3.0}]},
    # --- damage only ---
    "vanillaSnow_freezebreak_guard_retal": {"ops": [{"op": "damage", "amount": 2.0}]},
    # --- damage scaled + online gate ---
    "mekanismT2_plasma_strike": {
        "gate_condition": {"type": "point", "point": "runtime:mekanismt2:mek_t2_plasma_window", "op": "gt", "value": 0},
        "ops": [{"op": "damage", "amount": "3 + organ_count('mekanismt2:fission_plasma_chamber','mekanismt2:plasma_state_wiring')"}]},
    "mekanismT2_protocol_strike": {
        "gate_condition": {"type": "point", "point": "runtime:mekanismt2:mek_t2_protocol_window", "op": "gt", "value": 0},
        "ops": [{"op": "damage", "amount": "2 + organ_count('mekanismt2:quantum_mecha_protocol')"},
                {"op": "effect", "effect": "minecraft:glowing", "duration_ticks": 80, "amplifier": 0}]},
    # --- conditional-on-mark effect chains ---
    "vanillaJungle_stranglevine_snare": {
        "ops": [{"op": "mark", "mark": "vanillajungle:vanillaJungle_mark"},
                {"op": "effect", "effect": "minecraft:weakness", "duration_ticks": 60, "amplifier": 0, "require_mark": "vanillajungle:vanillaJungle_mark"}]},
    "vanillaDesert_drysand_mark_consume": {
        "gate": {"require_mark": "vanilladesert:vanillaDesert_mark"},
        "ops": [{"op": "effect", "effect": "minecraft:glowing", "duration_ticks": 100, "amplifier": 0},
                {"op": "effect", "effect": "minecraft:weakness", "duration_ticks": 40, "amplifier": 0}]},
    "vanillaSnow_ranged_mark": {
        "gate": {"require_mark": "vanillasnow:vanillaSnow_mark"},
        "ops": [{"op": "effect", "effect": "minecraft:glowing", "duration_ticks": 80, "amplifier": 0},
                {"op": "effect", "effect": "minecraft:movement_slowdown", "duration_ticks": 60, "amplifier": 1}]},
}


def callback_of(execution):
    cfg = execution.get("config")
    if isinstance(cfg, dict) and cfg.get("callback"):
        return cfg["callback"]
    return execution.get("callback")


def convert_execution(execution):
    """Return (new_execution, gate_condition|None) or (execution, None) if not convertible."""
    if execution.get("type") != "kubejs_target_call":
        return execution, None
    cb = callback_of(execution)

    # common_apply_target_mark_effect is data-parameterized: stamp a mark equal to the
    # execution's own point_id, then optionally apply its effect. Build ops from fields.
    if cb == "common_apply_target_mark_effect":
        ops = [{"op": "mark", "mark": execution.get("point_id")}]
        if execution.get("effect"):
            eff = {"op": "effect", "effect": execution["effect"]}
            if execution.get("duration_ticks") is not None:
                eff["duration_ticks"] = execution["duration_ticks"]
            if execution.get("amplifier") is not None:
                eff["amplifier"] = execution["amplifier"]
            ops.append(eff)
        new = {"type": "target_strike", "config": {"ops": ops}}
        for k in ("point_type", "point_id", "consume_points", "max_consume", "custom_display_key"):
            if k in execution:
                new[k] = execution[k]
        return new, None

    spec = TABLE.get(cb)
    if spec is None:
        return execution, None
    new = {
        "type": "target_strike",
        "config": {"ops": [dict(op) for op in spec["ops"]]},
    }
    gate = spec.get("gate", {})
    for k in ("chance", "require_mark", "require_no_mark"):
        if k in gate:
            new["config"][k] = gate[k]
    for k in ("point_type", "point_id", "consume_points", "max_consume", "custom_display_key"):
        if k in execution:
            new[k] = execution[k]
    return new, spec.get("gate_condition")


def process_effect(effect, stats):
    new_execs = []
    gate_conds = []
    for x in effect.get("executions", []):
        new_x, gate = convert_execution(x)
        if new_x is not x:
            stats["converted"] += 1
        new_execs.append(new_x)
        if gate is not None:
            gate_conds.append(gate)
    effect["executions"] = new_execs
    if gate_conds:
        conds = effect.get("conditions", [])
        # append online gate(s); dedupe against existing identical entries
        for g in gate_conds:
            if g not in conds:
                conds.append(g)
        effect["conditions"] = conds
    return effect


def main(argv):
    dry_run = "--dry-run" in argv
    stats = {"converted": 0}
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
    print(f"[target_calls] converted {stats['converted']} kubejs_target_call -> target_strike "
          f"across {changed_files} files" + (" (dry-run)" if dry_run else ""))


if __name__ == "__main__":
    main(sys.argv[1:])

