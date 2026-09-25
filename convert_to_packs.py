#!/usr/bin/env python3
"""theOrgans → custom-pack converter (migration step 6).

Reads the legacy KubeJS organ content under ``organs/<biome>/kubejs/`` and emits
the version-neutral custom-pack layout consumed by the migrated organAPI/organEffects
pack loader:

    organs/data/<ns>-pack/data/<ns>/organapi/organs/*.json     (organ + effects defs)
    organs/data/<ns>-pack/data/<ns>/point_config/*.json        (point display config)
    organs/resources/<ns>-pack/assets/<ns>/models/organ/*.json  (item models, renderer)
    organs/resources/<ns>-pack/assets/<ns>/textures/**          (textures)
    organs/resources/<ns>-pack/assets/<ns>/lang/*.json          (lang)

Namespace: per user decision, each biome uses its own lowercase name as the stable
namespace (``kubejs:x`` → ``<biome>:x``), decoupling content from KubeJS.

Predicate conversion: ``kubejs_predicate`` conditions whose callback matches a known
declarative pattern (point threshold / installed-organ-set / inventory item) are
rewritten to the new builtin ``point`` / ``organ_set`` / ``inventory`` conditions.
Everything else is marked ``kubejs_hook`` (a passthrough placeholder; the actual
fallback runtime is step 7) so the file still parses and its intent is recorded.

Usage:
    python3 convert_to_packs.py [biome ...]      # default: all biomes
    python3 convert_to_packs.py --dry-run vanillaNether
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ORGANS = ROOT / "organs"
DATA_OUT = ORGANS / "data"
RES_OUT = ORGANS / "resources"

# keys inside organ/effect JSON whose string values carry a "kubejs:" identifier.
# NOTE: `from_id` (derived-grant counter source) is deliberately NOT here — every
# from_id currently points at a counter written by the forge-only KubeJS hook via
# setLinkCounter('kubejs:...') (tide/wet/mire/rot/slime_line, *_resonance, barrier_line).
# The engine reads it as "<from_type>:<from_id>" and must match the hook's literal
# kubejs: key, so rewriting it to <ns>: would break the linkage. block_tag IS safe:
# we emit the matching <ns>: datapack tag file below, so it self-resolves.
NS_VALUE_KEYS = {"id", "item", "point_id", "skill_name", "point", "block_tag"}

MIGRATION = ROOT / "migration"
PRED_SPEC = json.loads((MIGRATION / "predicate_spec.json").read_text(encoding="utf-8"))
BIOME_JS = json.loads((MIGRATION / "biome_constants.json").read_text(encoding="utf-8"))
HOME_JS = json.loads((MIGRATION / "home_constants.json").read_text(encoding="utf-8"))
# per-biome block tags KubeJS registered at runtime via ServerEvents.tags('block');
# emitted as real datapack tag files under the biome namespace (kubejs:x -> <ns>:x)
BLOCK_TAGS = json.loads((MIGRATION / "block_tags.json").read_text(encoding="utf-8"))

# blocks scanned by the KubeJS hasSnowGround helper (radius 5)
SNOW_GROUND_BLOCKS = [
    "minecraft:snow_block", "minecraft:powder_snow", "minecraft:ice",
    "minecraft:packed_ice", "minecraft:blue_ice",
]

# accumulated fallback report (callbacks that could not be made declarative)
FALLBACKS = {}


def rewrite_ns(value, ns):
    """kubejs:foo -> <ns>:foo (only rewrites the kubejs namespace)."""
    if isinstance(value, str) and value.startswith("kubejs:"):
        return ns + ":" + value[len("kubejs:"):]
    return value


def rewrite_point_key(value, ns):
    """point keys look like '<type>:kubejs:foo' -> '<type>:<ns>:foo'."""
    if isinstance(value, str) and ":kubejs:" in value:
        return value.replace(":kubejs:", ":" + ns + ":", 1)
    return value


def resolve_organ_set(set_name, biome, ns):
    """Resolve a JS *_IDS set constant to a list of <ns>:organ ids."""
    ids = BIOME_JS.get(biome, {}).get("sets", {}).get(set_name)
    if not ids:
        return None
    return [rewrite_ns(i, ns) for i in ids]


def resolve_inventory_items(spec, biome, ns):
    consts = BIOME_JS.get(biome, {}).get("consts", {})
    aux = BIOME_JS.get(biome, {}).get("aux", {})
    if "const" in spec:
        raw = consts.get(spec["const"])
        return [rewrite_ns(raw, ns)] if raw else None
    if "aux" in spec:
        raw = aux.get(spec["aux"])
        return [rewrite_ns(raw, ns)] if raw else None
    return None


def build_home_condition(biome):
    """Declarative equivalent of the KubeJS homeMatch three-way OR.

    homeState.final = dimensionMatch || biomeMatch || structureMatch, plus the
    per-biome extraMatchFn (snow: snowing/snow-ground, wet: wet/raining).
    dimensionMatch only fires when the HOME literal set ``dimension_home: true``.
    KubeJS structure_radius is already in CHUNKS (passed straight to
    findNearestMapStructure as radiusChunks), matching the declarative ``structure``
    condition's ``radius_chunks`` 1:1 (engine clamps to 1..32).
    Returns None if no HOME data (caller falls back to hook).
    """
    h = HOME_JS.get(biome)
    if not h:
        return None
    branches = []
    if h.get("dimension_home"):
        for dim in h.get("dimensions", []):
            branches.append({"type": "dimid", "value_id": dim})
    for kw in h.get("biome_keywords", []):
        branches.append({"type": "biome_category", "value": kw})
    structs = h.get("structures", [])
    if structs:
        radius_chunks = max(1, min(32, h.get("structure_radius", 8)))
        branches.append({"type": "structure", "structures": list(structs),
                         "radius_chunks": radius_chunks})
    extra = h.get("extra")
    if extra == "wet":
        branches.append({"type": "environment_state", "state": "wet"})
        branches.append({"type": "environment_state", "state": "raining"})
    elif extra == "snow":
        branches.append({"type": "environment_state", "state": "raining"})
        branches.append({"type": "nearby_block", "blocks": list(SNOW_GROUND_BLOCKS),
                         "radius": 5, "vertical": 1, "value": 1})
    if not branches:
        return None
    return {"type": "any_of", "conditions": branches}


def is_opaque_type(t):
    """A component type the engine cannot describe from data alone.

    Only these keep a ``custom_display_key`` — kubejs_* hooks/calls and namespaced
    addon events/executions (``organironspell:*``, ``<biome>:*``). Every builtin
    data-driven type (point/organ_set/inventory/any_of, tick/mine/heal/...) renders
    itself, so it must NOT carry a mask.
    """
    return isinstance(t, str) and (t.startswith("kubejs") or ":" in t)


def convert_condition(cond, biome, ns):
    """kubejs_predicate -> declarative condition, or kubejs_hook passthrough.

    ``custom_display_key`` is preserved ONLY on the kubejs_hook fallback (an opaque
    callback with no data-driven name). Declarative results drop it so the engine
    shows the data-driven description.
    """
    if cond.get("type") != "kubejs_predicate":
        return deep_rewrite(cond, ns)
    callback = (cond.get("config") or {}).get("callback")
    if callback is None:
        callback = cond.get("callback") or "<unnamed>"
    display = cond.get("custom_display_key")

    def hook():
        out = {"type": "kubejs_hook", "callback": callback}
        if display:
            out["custom_display_key"] = display
        return out

    spec = PRED_SPEC.get(callback)
    if spec is None or spec.get("type") == "hook":
        FALLBACKS.setdefault(biome, set()).add(callback)
        return hook()

    kind = spec["type"]
    if kind == "home":
        home = build_home_condition(biome)
        if home is None:
            FALLBACKS.setdefault(biome, set()).add(callback + " (no home constants)")
            return hook()
        return home
    if kind == "point":
        return {"type": "point", "point": rewrite_point_key(spec["point"], ns),
                "op": spec["op"], "value": spec["value"]}
    if kind == "organ_set":
        organs = resolve_organ_set(spec["set"], biome, ns)
        if organs is None:
            FALLBACKS.setdefault(biome, set()).add(callback + " (unresolved set " + spec["set"] + ")")
            return hook()
        return {"type": "organ_set", "organs": organs, "op": spec["op"], "value": spec["value"]}
    if kind == "inventory":
        items = resolve_inventory_items(spec, biome, ns)
        if items is None:
            FALLBACKS.setdefault(biome, set()).add(callback + " (unresolved item)")
            return hook()
        return {"type": "inventory", "items": items, "op": "gte", "value": 1}
    FALLBACKS.setdefault(biome, set()).add(callback)
    return hook()


def deep_rewrite(node, ns, biome=None):
    """Recursively rewrite kubejs: ids; convert conditions when biome is given."""
    if isinstance(node, dict):
        out = {}
        for key, val in node.items():
            if key == "conditions" and isinstance(val, list) and biome is not None:
                out[key] = [convert_condition(c, biome, ns) for c in val]
            elif key == "point" and isinstance(val, str):
                out[key] = rewrite_point_key(val, ns)
            elif key in NS_VALUE_KEYS and isinstance(val, str):
                out[key] = rewrite_ns(val, ns)
            elif key == "source" and isinstance(val, str):
                out[key] = val  # source tags are internal, leave as-is
            else:
                out[key] = deep_rewrite(val, ns, biome)
        # drop the kubejs display mask on data-driven events/executions; the engine
        # renders those from their own fields. Opaque types (kubejs_*, addon ns:*) keep it.
        if "custom_display_key" in out and not is_opaque_type(out.get("type")):
            del out["custom_display_key"]
        return out
    if isinstance(node, list):
        return [deep_rewrite(v, ns, biome) for v in node]
    return node


def convert_organ_json(text, biome, ns):
    data = json.loads(text)
    return deep_rewrite(data, ns, biome)


def convert_biome(biome, dry_run=False):
    src = ORGANS / biome / "kubejs"
    if not src.is_dir():
        print(f"[skip] {biome}: no kubejs dir")
        return
    ns = biome.lower()
    data_pack = DATA_OUT / f"{ns}-pack"
    res_pack = RES_OUT / f"{ns}-pack"

    organ_src = src / "data" / "kubejs" / "organapi" / "organs"
    point_src = src / "data" / "kubejs" / "point_config"
    assets_src = src / "assets" / "kubejs"

    n_organ = n_point = n_asset = 0

    # --- organ + effect definitions ---
    if organ_src.is_dir():
        dst = data_pack / "data" / ns / "organapi" / "organs"
        if not dry_run:
            dst.mkdir(parents=True, exist_ok=True)
        for f in sorted(organ_src.glob("*.json")):
            converted = convert_organ_json(f.read_text(encoding="utf-8"), biome, ns)
            n_organ += 1
            if not dry_run:
                (dst / f.name).write_text(
                    json.dumps(converted, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # --- point_config ---
    if point_src.is_dir():
        dst = data_pack / "data" / ns / "point_config"
        if not dry_run:
            dst.mkdir(parents=True, exist_ok=True)
        for f in sorted(point_src.glob("*.json")):
            data = json.loads(f.read_text(encoding="utf-8"))
            data = deep_rewrite(data, ns)  # point/mark_icon ids only, no conditions
            if isinstance(data.get("mark_icon"), str):
                data["mark_icon"] = rewrite_ns(data["mark_icon"], ns)
            # display_name_key follows the re-namespaced point key so lang lookup matches
            if isinstance(data.get("display_name_key"), str) and ".kubejs." in data["display_name_key"]:
                data["display_name_key"] = data["display_name_key"].replace(".kubejs.", "." + ns + ".", 1)
            n_point += 1
            if not dry_run:
                (dst / f.name).write_text(
                    json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # --- block tags (KubeJS runtime tags -> datapack files under <ns>) ---
    for tag_name, blocks in BLOCK_TAGS.get(biome, {}).items():
        dst = data_pack / "data" / ns / "tags" / "blocks"
        if not dry_run:
            dst.mkdir(parents=True, exist_ok=True)
            (dst / f"{tag_name}.json").write_text(
                json.dumps({"replace": False, "values": blocks}, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8")

    # --- assets: textures, models (organ/), lang ---
    if assets_src.is_dir():
        for sub in ("textures", "models", "lang"):
            sdir = assets_src / sub
            if not sdir.is_dir():
                continue
            if sub == "models":
                # item models -> models/organ/<path>.json (renderer convention),
                # and rewrite their "organapi:item/x" texture refs to "<ns>:item/x".
                item_models = sdir / "item"
                dst = res_pack / "assets" / ns / "models" / "organ"
                if item_models.is_dir():
                    if not dry_run:
                        dst.mkdir(parents=True, exist_ok=True)
                    for f in sorted(item_models.glob("*.json")):
                        model = json.loads(f.read_text(encoding="utf-8"))
                        rewrite_model_textures(model, ns)
                        n_asset += 1
                        if not dry_run:
                            (dst / f.name).write_text(
                                json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            elif sub == "lang":
                dst = res_pack / "assets" / ns / "lang"
                if not dry_run:
                    dst.mkdir(parents=True, exist_ok=True)
                for f in sorted(sdir.glob("*.json")):
                    n_asset += 1
                    if not dry_run:
                        lang = json.loads(f.read_text(encoding="utf-8"))
                        lang = rewrite_lang_keys(lang, ns)
                        (dst / f.name).write_text(
                            json.dumps(lang, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            else:  # textures
                dst = res_pack / "assets" / ns / sub
                if not dry_run:
                    dst.mkdir(parents=True, exist_ok=True)
                    shutil.copytree(sdir, dst, dirs_exist_ok=True)
                n_asset += sum(1 for _ in sdir.rglob("*") if _.is_file())

    print(f"[ok] {biome} -> ns '{ns}': {n_organ} organs, {n_point} point_config, {n_asset} assets"
          + (" (dry-run)" if dry_run else ""))


def rewrite_model_textures(model, ns):
    tex = model.get("textures")
    if isinstance(tex, dict):
        for key, val in tex.items():
            if isinstance(val, str) and val.startswith("kubejs:"):
                tex[key] = ns + ":" + val[len("kubejs:"):]


def rewrite_lang_keys(lang, ns):
    """Rewrite lang keys/values from the old kubejs namespace to this pack's ns.

    - ``item.kubejs.<x>``            -> ``item.<ns>.<x>``   (organ display names)
    - ``point.organeffects.<t>.kubejs.<x>`` -> ``point.organeffects.<t>.<ns>.<x>``
      (EffectPointTextHelper builds ``point.organeffects.<type>.<namespace>.<path>``
       from the re-namespaced point keys, so the lang keys must match)
    - ``message.organkubejs.<...>``  kept as-is: these are the custom_display_key
      targets still referenced verbatim by converted conditions; re-homing them is a
      separate concern. Copied through so the pack still carries the strings.
    """
    out = {}
    for key, val in lang.items():
        new_key = key
        if key.startswith("item.kubejs."):
            new_key = "item." + ns + "." + key[len("item.kubejs."):]
        elif key.startswith("point.organeffects."):
            new_key = key.replace(".kubejs.", "." + ns + ".", 1)
        out[new_key] = val
    return out


def main(argv):
    dry_run = "--dry-run" in argv
    biomes = [a for a in argv if not a.startswith("--")]
    if not biomes:
        biomes = sorted(d.name for d in ORGANS.iterdir()
                        if d.is_dir() and (d / "kubejs").is_dir() and d.name != "common")
    for biome in biomes:
        convert_biome(biome, dry_run=dry_run)

    if FALLBACKS:
        report = {b: sorted(v) for b, v in sorted(FALLBACKS.items())}
        total = sum(len(v) for v in report.values())
        print(f"\n[fallback] {total} predicate uses across {len(report)} biomes marked kubejs_hook:")
        for b, cbs in report.items():
            print(f"  {b}: {len(cbs)}")
        if not dry_run:
            out = MIGRATION / "fallback_report.json"
            out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"[fallback] written to {out}")


if __name__ == "__main__":
    main(sys.argv[1:])


