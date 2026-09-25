#!/usr/bin/env python3
"""Second-pass hook resolver (migration step 6/7 boundary, one-shot).

The first conversion (convert_to_packs.py) marked every predicate it could not
express declaratively as ``kubejs_hook``. Since then organEffects gained four new
capabilities (all_of/any_of/not combinators, nearby_block + structure conditions,
the formula evaluator, and target executors). This script re-examines the legacy
KubeJS predicate bodies and, where one of those capabilities now covers a hook,
rewrites the ``kubejs_hook`` condition in the already-emitted pack JSON to the
declarative form — in place.

It resolves two hook families:

1. **point wrappers** — predicates that (directly or through a one-line helper)
   reduce to ``getRuntimePoint/getShieldPoint/getCounter(...) OP N``. These become
   ``point`` conditions (or ``not`` of one for the ``!`` negations).
2. **zone checks** — the Nether/ocean/mek "is<X>Zone" helpers, which are
   biome-keyword OR nearby-block OR nearby-structure disjunctions. These become an
   ``any_of`` of ``biome_category`` / ``nearby_block`` / ``structure`` sub-conditions.

Everything it cannot resolve is left as ``kubejs_hook`` for step 7's KubeJS fallback.
This is intentionally a throwaway: run once, commit the resulting pack edits, and
from here on organ content is edited directly, not regenerated.

Usage: python3 resolve_hooks.py [--dry-run]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ORGANS = ROOT / "organs"
DATA_OUT = ORGANS / "data"
MIGRATION = ROOT / "migration"
SERVER_SCRIPTS = sorted((ORGANS).glob("*/kubejs/server_scripts/*.js"))
COMMON_JS = ORGANS / "common" / "kubejs" / "server_scripts" / "00_organ_common.js"

ZONE_BLOCK_RADIUS = 5
ZONE_STRUCT_RADIUS_CHUNKS = 10


# ---------- JS extraction helpers ----------

def _braced_body(src, start):
    depth = 1
    k = start
    while k < len(src) and depth > 0:
        if src[k] == '{':
            depth += 1
        elif src[k] == '}':
            depth -= 1
        k += 1
    return src[start:k - 1]


def object_literal(src, var):
    m = re.search(r'\b' + var + r'\s*=\s*\{', src)
    if not m:
        return {}
    body = _braced_body(src, m.end())
    return {mm.group(1): mm.group(2) for mm in re.finditer(r'([A-Za-z_]\w*)\s*:\s*[\'"]([^\'"]+)[\'"]', body)}


def functions_of(src):
    fs = {}
    for m in re.finditer(r'function\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{', src):
        fs[m.group(1)] = _braced_body(src, m.end())
    return fs


def strip_arrow(body):
    b = body.strip()
    m = re.match(r'^\w+\s*=>\s*\{(.*)\}$', b, re.S)
    if m:
        return re.sub(r'\s+', ' ', m.group(1)).strip()
    m = re.match(r'^\w+\s*=>\s*(.*)$', b, re.S)
    if m:
        return re.sub(r'\s+', ' ', m.group(1)).strip()
    return re.sub(r'\s+', ' ', b).strip()


def load_biomes():
    biomes = {}
    for f in SERVER_SCRIPTS:
        parts = f.parts
        biome = parts[parts.index("organs") + 1]
        src = f.read_text(encoding="utf-8")
        d = biomes.setdefault(biome, {"const": {}, "RESOURCE": {}, "AUX": {}, "funcs": {}, "preds": {}})
        d["RESOURCE"].update(object_literal(src, "RESOURCE"))
        d["AUX"].update(object_literal(src, "AUX"))
        for m in re.finditer(r'(?:let|const|var)\s+([A-Za-z_]\w*)\s*=\s*[\'"]([^\'"]+)[\'"]', src):
            d["const"].setdefault(m.group(1), m.group(2))
        d["funcs"].update(functions_of(src))
        for m in re.finditer(r"OrganKubejsEvents\.predicate\(\s*'([^']*)'\s*,", src):
            j = m.end()
            pd = 1
            buf = []
            while j < len(src) and pd > 0:
                c = src[j]
                if c == '(':
                    pd += 1
                elif c == ')':
                    pd -= 1
                if pd > 0:
                    buf.append(c)
                j += 1
            d["preds"][m.group(1)] = strip_arrow(''.join(buf))
    return biomes


def resolve_symbol(biomes, biome, token):
    token = token.strip().strip("'\"")
    d = biomes[biome]
    if token.startswith("RESOURCE."):
        return d["RESOURCE"].get(token.split(".", 1)[1])
    if token.startswith("AUX."):
        return d["AUX"].get(token.split(".", 1)[1])
    if token in d["const"]:
        return d["const"][token]
    return token if ":" in token else None


# ---------- resolvers ----------

POINT_FNS = [("getRuntimePoint", "runtime"), ("getOepRuntime", "runtime"),
             ("getShieldPoint", "shield"), ("getCounter", "counter")]

# zone helper -> declarative components (biome_category keywords / nearby blocks / structures).
# Cross-refs are inlined; home_structures is dropped (biome/block cover it in practice).
ZONES = {
    "isFortressZone": {"blocks": ["minecraft:nether_bricks", "minecraft:red_nether_bricks",
                                    "minecraft:polished_blackstone_bricks", "minecraft:gold_block",
                                    "minecraft:nether_wart_block"],
                        "structures": ["minecraft:fortress"], "biome_kw": []},
    "isBastionZone": {"blocks": ["minecraft:gold_block", "minecraft:gilded_blackstone", "minecraft:blackstone"],
                       "structures": ["minecraft:bastion_remnant"], "biome_kw": []},
    "isBlacksmithZone": {"blocks": [], "structures": ["cataclysm:soul_black_smith"], "biome_kw": []},
    "isCrimsonZone": {"blocks": [], "structures": ["cataclysm:burning_arena", "cataclysm:soul_black_smith"],
                       "biome_kw": ["crimson", "warped"]},
    "isSoulZone": {"blocks": ["minecraft:soul_sand", "minecraft:soul_soil", "minecraft:soul_lantern",
                               "minecraft:soul_torch", "minecraft:nether_bricks", "minecraft:red_nether_bricks",
                               "minecraft:polished_blackstone_bricks", "minecraft:gold_block",
                               "minecraft:nether_wart_block"],
                    "structures": ["minecraft:fortress", "cataclysm:soul_black_smith"], "biome_kw": ["soul"]},
    "isAshvaleZone": {"blocks": [], "structures": ["cataclysm:burning_arena", "cataclysm:soul_black_smith"],
                       "biome_kw": ["ash", "soul"]},
    "isLavaZone": {"blocks": ["minecraft:lava", "minecraft:magma_block", "minecraft:basalt", "minecraft:blackstone"],
                    "structures": [], "biome_kw": []},
    "hotZone": {"blocks": ["minecraft:lava", "minecraft:magma_block", "minecraft:campfire", "minecraft:soul_campfire"],
                 "structures": [], "biome_kw": []},
}

ZONE_PREDICATE_FN = {
    "mekanismT1_hot_zone": "hotZone",
    "vanillaNether_ashvale_online": "isAshvaleZone",
    "vanillaNether_bastion_online": "isBastionZone",
    "vanillaNether_blacksmith_online": "isBlacksmithZone",
    "vanillaNether_crimson_online": "isCrimsonZone",
    "vanillaNether_fortress_online": "isFortressZone",
    "vanillaNether_lava_online": "isLavaZone",
    "vanillaNether_soul_online": "isSoulZone",
}


def as_point(expr, biomes, biome):
    for fn, pt in POINT_FNS:
        mm = re.fullmatch(fn + r"\((?:player|event\.player),\s*([^)]+?)\)\s*(>=|>)\s*(\d+)", expr.strip())
        if mm:
            key = resolve_symbol(biomes, biome, mm.group(1))
            if key:
                return {"type": "point", "point": pt + ":" + key,
                        "op": "gte" if mm.group(2) == ">=" else "gt", "value": int(mm.group(3))}
    return None


def resolve_point_wrapper(biomes, biome, name):
    body = biomes[biome]["preds"].get(name, "")
    funcs = dict(COMMON_FUNCS)
    funcs.update(biomes[biome]["funcs"])
    # form A: result(event, [!!event.player &&] [!]HELPER(event.player))
    m = re.fullmatch(r"(?:return\s+)?[\w.]*[Pp]redicateResult\(event,\s*(?:!!event\.player\s*&&\s*)?(!)?\s*"
                     r"([a-zA-Z_]\w*)\((?:event\.)?player\)\)", body)
    if m:
        neg = m.group(1) == "!"
        fb = re.sub(r'\s+', ' ', funcs.get(m.group(2), "")).strip()
        fm = re.fullmatch(r"return\s+(?:!!player\s*&&\s*)?(get\w+\(player,[^)]+\)\s*(?:>=|>)\s*\d+)", fb)
        if fm:
            point = as_point(fm.group(1), biomes, biome)
            if point:
                return {"type": "not", "conditions": [point]} if neg else point
        return None
    # form B: inline point comparison
    m = re.fullmatch(r"(?:return\s+)?[\w.]*[Pp]redicateResult\(event,\s*(?:!!event\.player\s*&&\s*)?"
                     r"(get\w+\(event\.player,[^)]+\)\s*(?:>=|>)\s*\d+)\)", body)
    if m:
        return as_point(m.group(1).replace("event.player", "player"), biomes, biome)
    return None


def resolve_zone(name):
    fn = ZONE_PREDICATE_FN.get(name)
    if not fn or fn not in ZONES:
        return None
    spec = ZONES[fn]
    subs = []
    for kw in spec["biome_kw"]:
        subs.append({"type": "biome_category", "value": kw})
    if spec["blocks"]:
        subs.append({"type": "nearby_block", "blocks": spec["blocks"], "radius": ZONE_BLOCK_RADIUS})
    for structure in spec["structures"]:
        subs.append({"type": "structure", "structure": structure, "radius_chunks": ZONE_STRUCT_RADIUS_CHUNKS})
    if not subs:
        return None
    if len(subs) == 1:
        return subs[0]
    return {"type": "any_of", "conditions": subs}


COMMON_FUNCS = {}


# ---------- pack rewrite ----------

def build_resolution_table(biomes):
    """callback name -> replacement condition dict (without custom_display_key)."""
    spec = json.loads((MIGRATION / "predicate_spec.json").read_text(encoding="utf-8"))
    table = {}
    for name, entry in spec.items():
        if entry.get("type") != "hook":
            continue
        biome = next((b for b in sorted(biomes, key=len, reverse=True) if name.startswith(b)), None)
        replacement = resolve_zone(name)
        if replacement is None and biome is not None:
            replacement = resolve_point_wrapper(biomes, biome, name)
        if replacement is not None:
            table[name] = replacement
    return table


def rewrite_condition(cond, table, stats):
    """Rewrite a single kubejs_hook condition if its callback is resolvable."""
    if not isinstance(cond, dict) or cond.get("type") != "kubejs_hook":
        return cond
    callback = cond.get("callback")
    replacement = table.get(callback)
    if replacement is None:
        stats["left"] += 1
        return cond
    out = json.loads(json.dumps(replacement))  # deep copy
    # resolved forms (point/any_of/not) are all data-driven, so the engine renders
    # them from their own fields — the old kubejs custom_display_key mask is dropped.
    stats["resolved"] += 1
    return out


def _attach_display(cond, key):
    # retained for compatibility; masks are no longer attached to resolved conditions
    cond["custom_display_key"] = key


def walk(node, table, stats):
    if isinstance(node, dict):
        new = {}
        for k, v in node.items():
            if k == "conditions" and isinstance(v, list):
                new[k] = [rewrite_condition(walk(c, table, stats), table, stats) for c in v]
            else:
                new[k] = walk(v, table, stats)
        return new
    if isinstance(node, list):
        return [walk(v, table, stats) for v in node]
    return node


def main(argv):
    dry_run = "--dry-run" in argv
    global COMMON_FUNCS
    COMMON_FUNCS = functions_of(COMMON_JS.read_text(encoding="utf-8"))
    biomes = load_biomes()
    table = build_resolution_table(biomes)

    print(f"[resolve] {len(table)} hook callbacks now resolvable "
          f"({sum(1 for v in table.values() if v['type'] == 'point')} point, "
          f"{sum(1 for v in table.values() if v['type'] in ('any_of', 'nearby_block', 'structure', 'biome_category'))} zone, "
          f"{sum(1 for v in table.values() if v['type'] == 'not')} negated-point)")

    stats = {"resolved": 0, "left": 0}
    files = sorted(DATA_OUT.glob("*-pack/data/*/organapi/organs/*.json"))
    changed_files = 0
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        before = json.dumps(data, ensure_ascii=False, sort_keys=True)
        data = walk(data, table, stats)
        after = json.dumps(data, ensure_ascii=False, sort_keys=True)
        if before != after:
            changed_files += 1
            if not dry_run:
                f.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"[resolve] rewrote {stats['resolved']} kubejs_hook conditions across {changed_files} files; "
          f"{stats['left']} hooks remain (step 7 KubeJS fallback)"
          + (" (dry-run)" if dry_run else ""))

    if not dry_run:
        (MIGRATION / "resolved_hooks.json").write_text(
            json.dumps(table, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])



