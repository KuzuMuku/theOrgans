#!/usr/bin/env python3
"""
Migrate the forge-only KubeJS *fallback* tree off the retired per-organ items.

After the organ registration is retired (packs are canonical, organs are the single
generic ``organapi:organ_item`` stamped with an ``OrganId``), the surviving forge-only
KubeJS content still referenced the old ``kubejs:<organ>`` item ids. This repoints them:

  * chest loot   organ_sources/*/kubejs/server_scripts/*_organ_chest_loot.js
                 LootEntry.of('kubejs:<organ>')
                 -> LootEntry.of('organapi:organ_item{OrganId:"<ns>:<organ>"}')
  * loadouts     organ_sources/*/kubejs/data/kubejs/default_loadouts/*.json
                 {"id":"kubejs:<organ>"} -> {"id":"<ns>:<organ>"}   (organ-definition id)
  * recipes      organ_sources/*/kubejs/data/organsurgery/recipes/organ_sources/*.json
                 "result":{"item":"kubejs:<organ>"} -> "result":{"item":"organapi:organ_item"}
                                                       + "organ":"<ns>:<organ>"
  * skills       organs/<biome>/kubejs/startup_scripts/<biome>_{organs,skills}.js
                 move the Common.registerSkills([...]) block into a dedicated _skills.js,
                 renamespacing kubejs:  -> <ns>:  (ids + skill lang keys the packs own).
  * lang         organs/<biome>/kubejs/assets/kubejs/lang/*.json
                 drop organ item names + point/skill keys (packs own them); keep aux items,
                 intermediates, and message.organkubejs.* fallback keys.

Non-organ kubejs ids (aux items, source_tools intermediates, recipe ingredients) are left
as real ``kubejs:`` items by design. The organ set is read from the canonical packs, so the
rewrite is driven by data, not hard-coded lists. Idempotent: safe to re-run.

Usage:  python3 migrate_sources.py [--dry-run]
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
PACKS = ROOT / "organs" / "data"
ORGANS = ROOT / "organs"
SOURCES = ROOT / "organ_sources"

# PLACEHOLDER_BODY


def build_organ_map():
    """path -> ns, read from the canonical packs (organ ids are globally unique)."""
    m = {}
    for f in PACKS.glob("*-pack/data/*/organapi/organs/*.json"):
        ns = f.parts[len(f.parts) - 4]  # organs/data/<ns>-pack/data/<ns>/organapi/organs/x.json
        path = f.stem
        if path in m and m[path] != ns:
            raise SystemExit(f"[fatal] organ path collision: {path} in {m[path]} and {ns}")
        m[path] = ns
    return m


ORGAN = build_organ_map()
KJ = re.compile(r"kubejs:([a-z0-9_]+)")


def biome_ns(biome):
    return biome.lower()


# --- chest loot -------------------------------------------------------------
# Match any quoted kubejs:<path> item literal (covers LootEntry.of('kubejs:x'),
# helper-arg forms like addOrganPool(table, 'kubejs:x', chance), and id arrays).
LOOT_RE = re.compile(r"""(['"])kubejs:([a-z0-9_]+)\1""")


def migrate_chest_loot(dry):
    changed = n = 0
    for f in SOURCES.glob("*/kubejs/server_scripts/*_organ_chest_loot.js"):
        text = f.read_text(encoding="utf-8")

        def repl(mobj):
            nonlocal n
            path = mobj.group(2)
            if path not in ORGAN:
                return mobj.group(0)  # non-organ real item (aux), leave as-is
            n += 1
            return ("'organapi:organ_item{OrganId:\""
                    + ORGAN[path] + ":" + path + "\"}'")

        new = LOOT_RE.sub(repl, text)
        if new != text:
            changed += 1
            if not dry:
                f.write_text(new, encoding="utf-8")
    print(f"[chest_loot] repointed {n} organ entries across {changed} files")
    return n


# --- default loadouts -------------------------------------------------------
def migrate_loadouts(dry):
    changed = n = 0
    for f in SOURCES.glob("*/kubejs/data/kubejs/default_loadouts/*.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        hits = [0]

        def walk(node):
            if isinstance(node, dict):
                v = node.get("id")
                if isinstance(v, str) and v.startswith("kubejs:"):
                    path = v.split(":", 1)[1]
                    if path in ORGAN:  # organ -> organ-definition id (Phase-3 bootstrapper)
                        node["id"] = ORGAN[path] + ":" + path
                        hits[0] += 1
                for val in node.values():
                    walk(val)
            elif isinstance(node, list):
                for val in node:
                    walk(val)

        walk(data)
        if hits[0]:
            changed += 1
            n += hits[0]
            if not dry:
                f.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[loadouts] repointed {n} organ ids across {changed} files")
    return n


# --- surgery recipes --------------------------------------------------------
def migrate_recipes(dry):
    changed = n = 0
    for f in SOURCES.glob("*/kubejs/data/organsurgery/recipes/organ_sources/*.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        result = data.get("result")
        if not isinstance(result, dict):
            continue
        item = result.get("item")
        if isinstance(item, str) and item.startswith("kubejs:"):
            path = item.split(":", 1)[1]
            if path in ORGAN:  # organ result -> generic carrier + organ-definition id
                result["item"] = "organapi:organ_item"
                data["organ"] = ORGAN[path] + ":" + path
                changed += 1
                n += 1
                if not dry:
                    f.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[recipes] repointed {n} organ results across {changed} files")
    return n


# --- Create sequenced_assembly results (createT1/T2 organ outputs) ----------
def migrate_sequenced_assembly(dry):
    changed = n = 0
    for f in SOURCES.glob("*/kubejs/data/**/recipes/organ_sources/*_sequenced_assembly.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        hit = False
        for out in data.get("results", []):
            item = out.get("item")
            if isinstance(item, str) and item.startswith("kubejs:"):
                path = item.split(":", 1)[1]
                if path in ORGAN:  # final organ output -> stamped generic carrier
                    out["item"] = "organapi:organ_item"
                    out["nbt"] = {"OrganId": ORGAN[path] + ":" + path}
                    hit = True
                    n += 1
        if hit:
            changed += 1
            if not dry:
                f.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[sequenced_assembly] repointed {n} organ outputs across {changed} files "
          "(Create nbt-output stamping — verify at runClient)")
    return n


# --- forge runtime organ-identity: installed organs are now organapi:organ_item,
#     so presence checks must compare the OrganId, and the *_IDS sets / id literals
#     in the runtime/event/tag scripts must use <ns>:<path> (not kubejs:<path>). -----
RUNTIME_KJ = re.compile(r"""(['"])kubejs:([a-z0-9_]+)\1""")


def migrate_runtime_identity(dry):
    # 1) central helper: installedSourceIds must yield the OrganId, not the item key.
    common = ORGANS / "common" / "kubejs" / "server_scripts" / "00_organ_common.js"
    text = common.read_text(encoding="utf-8")
    old = "found.push(String(BuiltInRegistries.ITEM.getKey(stack.getItem())))"
    new = ("let __id = Java.loadClass('cn.kuzuanpa.organapi.platform.Platform').itemIdentity().getOrganId(stack)\n"
           "    found.push(__id ? String(__id) : String(BuiltInRegistries.ITEM.getKey(stack.getItem())))")
    if old in text and not dry:
        common.write_text(text.replace(old, new), encoding="utf-8")

    # 2) renamespace organ id literals kubejs:<organ> -> <ns>:<organ> in runtime/event/tag
    #    scripts (ORGAN-filtered, so point-key literals like kubejs:*_resonance stay).
    files = 0
    for sub in ("server_scripts", "startup_scripts"):
        for f in ORGANS.glob(f"*/kubejs/{sub}/*.js"):
            if f.name.endswith("_skills.js"):
                continue  # already renamespaced to its biome ns
            t = f.read_text(encoding="utf-8")

            def repl(m):
                path = m.group(2)
                return (m.group(1) + ORGAN[path] + ":" + path + m.group(1)) if path in ORGAN else m.group(0)

            nt = RUNTIME_KJ.sub(repl, t)
            # per-biome hasXOrgan helper compares item key to the id -> compare OrganId instead
            nt = nt.replace(
                "if (String(BuiltInRegistries.ITEM.getKey(stack.getItem())) === organId) {",
                "let __id = Java.loadClass('cn.kuzuanpa.organapi.platform.Platform').itemIdentity().getOrganId(stack)\n"
                "    if (__id && String(__id) === organId) {")
            if nt != t:
                files += 1
                if not dry:
                    f.write_text(nt, encoding="utf-8")
    print(f"[runtime_identity] fixed installedSourceIds + renamespaced organ ids in {files} scripts")
    return files


# --- skills: split into a dedicated _skills.js, renamespace kubejs: -> <ns>: ---
def _match_paren(text, open_idx):
    """Index just past the ')' matching the '(' at open_idx, skipping string literals."""
    depth = 0
    i = open_idx
    quote = None
    while i < len(text):
        c = text[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "'\"":
            quote = c
        elif c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise SystemExit("[fatal] unbalanced parens in registerSkills")


def _renamespace_skills(block, ns):
    block = block.replace("kubejs:", ns + ":")
    block = block.replace(".kubejs.", "." + ns + ".")
    return block


def migrate_skills(dry):
    biomes = [d.name for d in ORGANS.iterdir()
              if d.is_dir() and d.name not in ("common", "data", "resources")]
    moved = 0
    for biome in sorted(biomes):
        sdir = ORGANS / biome / "kubejs" / "startup_scripts"
        if not sdir.is_dir():
            continue
        out = sdir / (biome + "_skills.js")
        if out.exists():
            continue  # already extracted (idempotent)
        src = next((p for p in sorted(sdir.glob("*.js"))
                    if not p.name.endswith("_skills.js")
                    and "Common.registerSkills(" in p.read_text(encoding="utf-8")), None)
        if src is None:
            continue
        ns = biome_ns(biome)
        text = src.read_text(encoding="utf-8")
        call = text.index("Common.registerSkills(")
        open_idx = text.index("(", call)
        end = _match_paren(text, open_idx)
        # trailing optional newline after the call
        stmt_end = end
        block = text[call:end]
        skills_js = (";(function () {\n\n"
                     + _renamespace_skills(block, ns) + "\n\n})()\n")
        # strip the registerSkills statement (and a following blank line) from the source
        new_src = text[:call] + text[stmt_end:]
        new_src = re.sub(r"\n[ \t]*\n(\s*)\}\)\(\)", r"\n\n})()", new_src)
        # drop the organ registerItems call (keep aux); its list var name contains ORGAN
        new_src = re.sub(r"[ \t]*Common\.registerItems\(event, [A-Z0-9_]*ORGAN[A-Z0-9_]*\)\n",
                         "", new_src)
        moved += 1
        if not dry:
            out.write_text(skills_js, encoding="utf-8")
            src.write_text(new_src, encoding="utf-8")
    print(f"[skills] extracted + renamespaced skills for {moved} biomes")
    return moved


# --- lang trim: drop keys the packs now own -------------------------------
def _drop_lang_key(key):
    # point/skill/counter/mark names are re-namespaced into the pack resources
    if key.startswith("point.organeffects") and ".kubejs." in key:
        return True
    # organ item display names live in the pack resources as item.<ns>.<path>
    if key.startswith("item.kubejs."):
        path = key[len("item.kubejs."):].split(".", 1)[0]
        return path in ORGAN
    return False  # keep aux items, message.organkubejs.* fallbacks, everything else


def trim_lang(dry):
    changed = dropped = 0
    for f in ORGANS.glob("*/kubejs/assets/kubejs/lang/*.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        kept = {k: v for k, v in data.items() if not _drop_lang_key(k)}
        if len(kept) != len(data):
            changed += 1
            dropped += len(data) - len(kept)
            if not dry:
                f.write_text(json.dumps(kept, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[lang] dropped {dropped} pack-owned keys across {changed} files")
    return dropped


def main(argv):
    dry = "--dry-run" in argv
    print(f"[migrate_sources] {len(ORGAN)} canonical organ ids; dry_run={dry}")
    migrate_chest_loot(dry)
    migrate_loadouts(dry)
    migrate_recipes(dry)
    migrate_sequenced_assembly(dry)
    migrate_skills(dry)
    migrate_runtime_identity(dry)
    trim_lang(dry)
    print("[migrate_sources] done" + (" (dry-run)" if dry else ""))


if __name__ == "__main__":
    main(sys.argv[1:])




