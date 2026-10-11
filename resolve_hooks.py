#!/usr/bin/env python3
"""Second-pass hook resolver — JS-helper → declarative-condition compiler.

``convert_to_packs.py`` (pass 1) rewrites every ``kubejs_predicate`` it recognises
from ``predicate_spec.json`` into a builtin condition, and marks the rest as a
``kubejs_hook`` passthrough. This script (pass 2) re-examines the legacy KubeJS
predicate *bodies* directly and, for every hook whose logic is expressible with the
conditions organEffects already ships, rewrites the ``kubejs_hook`` in the emitted
pack JSON to that declarative form — in place.

It is a small recursive compiler over the predicate expression:

  * boolean structure  ``a && b`` → all_of, ``a || b`` → any_of, ``!a`` → not
  * point thresholds    getRuntimePoint/getOepRuntime/getShieldPoint/getCounter → point
  * installed organs    hasMatching/countMatching/indexOf(installedSourceIds) → organ_set
  * inventory items     auxOnline/hasAuxiliary/hasAuxItem/inventoryAuxiliary/inventoryCount → inventory
  * world state         dimensionId/biome.indexOf/overworld → dimid/biome_category
  * zones/home          isXZone helpers → any_of[...]; homeMatch/homeState → build_home_condition
  * misc leaves         isOnFire → environment_state, isFallFlying → movement_state,
                        hasEffect → status_effect, countNearbyEntityTypes → any_of[nearby_entity]

Anything containing a primitive with no declarative equivalent (getLinkCounter,
getMark, stillFor) makes the whole predicate unresolvable → it is left as
``kubejs_hook`` for the forge KubeJS fallback (step 7).

IMPORTANT — pipeline ordering: pass 1 regenerates packs from predicate_spec.json and
would clobber this pass's edits, so this script MUST run *after* convert_to_packs.py
every time. Always regenerate via ``regenerate.bash`` (convert → target_calls →
resolve), never ``convert_to_packs.py`` alone. This script is idempotent: it rewrites
resolvable hooks in place and leaves everything else untouched, so re-running is safe.

Usage: python3 resolve_hooks.py [--dry-run]
"""
import json
import re
import sys
from pathlib import Path

import convert_to_packs as C

ROOT = Path(__file__).resolve().parent
ORGANS = ROOT / "organs"
DATA_OUT = ORGANS / "data"
MIGRATION = ROOT / "migration"
SERVER_SCRIPTS = sorted((ORGANS).glob("*/kubejs/server_scripts/*.js"))
COMMON_JS = ORGANS / "common" / "kubejs" / "server_scripts" / "00_organ_common.js"

ZONE_BLOCK_RADIUS = 5
ZONE_STRUCT_RADIUS_CHUNKS = 10

# Exact membership of the vanilla #minecraft:raiders entity tag. When a countNearby
# roster equals this set we emit one tag-based nearby_entity node instead of six.
_RAIDERS_TAG_MEMBERS = {
    "minecraft:pillager", "minecraft:vindicator", "minecraft:evoker",
    "minecraft:illusioner", "minecraft:witch", "minecraft:ravager",
}

# void-kit helper (End): inventoryCount([...]) > 0
VOID_KIT_ITEMS = ["minecraft:ender_pearl", "minecraft:chorus_fruit", "minecraft:elytra"]

COMMON_FUNCS = {}


# ---------- JS extraction helpers ----------

def _braced_body(src, start):
    depth, k = 1, start
    while k < len(src) and depth > 0:
        if src[k] == '{':
            depth += 1
        elif src[k] == '}':
            depth -= 1
        k += 1
    return src[start:k - 1]


def object_literal(src, var):
    """Parse ``var = { key: 'val', "key2": "val2", ... }`` (quoted or bare keys)."""
    m = re.search(r'\b' + var + r'\s*=\s*\{', src)
    if not m:
        return {}
    body = _braced_body(src, m.end())
    out = {}
    for mm in re.finditer(r'[\'"]?([A-Za-z_]\w*)[\'"]?\s*:\s*[\'"]([^\'"]+)[\'"]', body):
        out.setdefault(mm.group(1), mm.group(2))
    return out


def id_set_literal(src, var):
    """Parse ``var = new Set([...])`` / ``var = [...]`` → list of string ids."""
    m = re.search(r'\b' + var + r'\s*=\s*(?:new\s+Set\s*\(\s*)?\[', src)
    if not m:
        return None
    depth, k = 1, m.end()
    while k < len(src) and depth > 0:
        if src[k] == '[':
            depth += 1
        elif src[k] == ']':
            depth -= 1
        k += 1
    return re.findall(r'[\'"]([^\'"]+)[\'"]', src[m.end():k - 1])


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
        d = biomes.setdefault(biome, {"const": {}, "RESOURCE": {}, "AUX": {},
                                      "AUXILIARY": {}, "sets": {}, "arrays": {},
                                      "funcs": {}, "preds": {}})
        d["RESOURCE"].update(object_literal(src, "RESOURCE"))
        d["AUX"].update(object_literal(src, "AUX"))
        d["AUXILIARY"].update(object_literal(src, "AUXILIARY"))
        for m in re.finditer(r'(?:let|const|var)\s+([A-Za-z_]\w*)\s*=\s*[\'"]([^\'"]+)[\'"]', src):
            d["const"].setdefault(m.group(1), m.group(2))
        for m in re.finditer(r'(?:let|const|var)\s+([A-Za-z_]\w*)\s*=\s*(?:new\s+Set\s*\(\s*)?\[', src):
            ids = id_set_literal(src, m.group(1))
            if ids is not None:
                d["arrays"].setdefault(m.group(1), ids)
                if m.group(1).endswith("_IDS"):
                    d["sets"].setdefault(m.group(1), ids)

        d["funcs"].update(functions_of(src))
        for m in re.finditer(r"OrganKubejsEvents\.predicate\(\s*'([^']*)'\s*,", src):
            j, pd, buf = m.end(), 1, []
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


# ---------- expression utilities ----------

GUARD_RE = re.compile(r'^(?:!!)?(?:event\.)?player$')


def _strip_outer_parens(e):
    e = e.strip()
    while e.startswith('(') and e.endswith(')'):
        depth = 0
        ok = True
        for i, c in enumerate(e):
            if c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth == 0 and i != len(e) - 1:
                    ok = False
                    break
        if ok:
            e = e[1:-1].strip()
        else:
            break
    return e


def _split_top(expr, op):
    """Split on a binary op (``&&`` / ``||``) at paren depth 0."""
    parts, depth, last, i = [], 0, 0, 0
    while i < len(expr):
        c = expr[i]
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
        elif depth == 0 and expr[i:i + 2] == op:
            parts.append(expr[last:i])
            i += 2
            last = i
            continue
        i += 1
    parts.append(expr[last:])
    return [p.strip() for p in parts]


def _last_return_expr(body):
    """The boolean expr a helper ultimately returns (collapsed single-line body)."""
    idx = body.rfind('return ')
    if idx < 0:
        # e.g. arrow-less `X_PredicateResult(event, EXPR)` with no return
        return body.strip()
    return body[idx + len('return '):].strip().rstrip(' }')


# ---------- symbol resolution ----------

POINT_TYPE = {"getRuntimePoint": "runtime", "getOepRuntime": "runtime",
              "getShieldPoint": "shield", "getCounter": "counter"}
INV_HELPERS = ("auxOnline", "hasAuxiliary", "hasAuxItem", "inventoryAuxiliary")
OP_MAP = {">=": "gte", ">": "gt", "<=": "lte", "<": "lt", "===": "eq", "==": "eq"}


def resolve_arg(biomes, biome, token):
    """Resolve RESOURCE.x / AUX.x / AUXILIARY.x / CONST / literal to a raw id string."""
    token = token.strip().strip("'\"")
    d = biomes[biome]
    for prefix, tbl in (("RESOURCE.", "RESOURCE"), ("AUX.", "AUX"), ("AUXILIARY.", "AUXILIARY")):
        if token.startswith(prefix):
            return d[tbl].get(token.split(".", 1)[1])
    if token in d["const"]:
        return d["const"][token]
    if ":" in token:
        return token
    return None


def point_key(biomes, biome, ns, getter, raw_key_token):
    key = resolve_arg(biomes, biome, raw_key_token)
    if not key:
        return None
    ptype = POINT_TYPE[getter]
    return C.rewrite_point_key(ptype + ":" + key, ns)


def parse_locals(body):
    """Split ``let X = EXPR`` bindings from the trailing return/predicate expr.

    Returns (locals_dict, tail_expr). Substitution is textual so nested getX()
    calls in a local survive into the boolean expression the compiler sees.
    """
    locals_ = {}
    for m in re.finditer(r'\blet\s+([A-Za-z_]\w*)\s*=\s*(.+?)(?=\s+(?:let|return|if)\b|$)', body):
        locals_.setdefault(m.group(1), m.group(2).strip())
    tail = _last_return_expr(body)
    return locals_, tail


def substitute_locals(expr, locals_):
    for _ in range(4):  # a couple passes cover locals-referencing-locals
        new = expr
        for name, val in locals_.items():
            wrapped = ('(' + val + ')') if (' && ' in val or ' || ' in val) else val
            # match the bare local only — never a `.name` property access (e.g. the
            # `current` in `RESOURCE.current`), which would otherwise recursively expand
            # a local whose value contains its own name as a key suffix.
            new = re.sub(r'(?<![\w.])' + re.escape(name) + r'(?![\w])', wrapped, new)
        if new == expr:
            break
        expr = new
    return expr


def normalize_player(expr):
    """Collapse the player/entity aliases so arg matchers see one paren level.

    Also drops ``try { … } catch (…) { … }`` noise: the catch fallback is a
    degraded copy, so we keep the primary try body and discard the catch block.
    """
    expr = expr.replace('event.player', 'player')
    expr = re.sub(r'catch\s*\([^)]*\)\s*\{[^{}]*\}', '', expr)
    expr = re.sub(r'\btry\s*\{', ' ', expr)
    for _ in range(3):
        new = re.sub(r'entityOf\(\s*player\s*\)', 'player', expr)
        if new == expr:
            break
        expr = new
    return expr



# ---------- the compiler ----------

_BIOMES = {}

# sentinel conditions for constant truthiness (player null-guards, `!RESOURCE`, …).
# They are folded out of &&/||/! and never appear in emitted JSON.
TRUE = {"__bool__": True}
FALSE = {"__bool__": False}
# bare identifiers that are always-truthy objects in the KubeJS runtime
TRUTHY_IDENT = {"RESOURCE", "HOME", "player"}


def funcs_for(biome):
    fs = dict(COMMON_FUNCS)
    fs.update(_BIOMES[biome]["funcs"])
    return fs



def _home_branch(biome, field):
    h = C.HOME_JS.get(biome)
    if not h:
        return None
    if field == "dimension":
        if not h.get("dimension_home"):
            return None
        subs = [{"type": "dimid", "value_id": d} for d in h.get("dimensions", [])]
    elif field == "biome":
        subs = [{"type": "biome_category", "value": kw} for kw in h.get("biome_keywords", [])]
    elif field == "structure":
        structs = h.get("structures", [])
        if not structs:
            return None
        r = max(1, min(32, h.get("structure_radius", 8)))
        return {"type": "structure", "structures": list(structs), "radius_chunks": r}
    else:
        return None
    if not subs:
        return None
    return subs[0] if len(subs) == 1 else {"type": "any_of", "conditions": subs}


def _resolve_array(biome, token):
    token = token.strip()
    if token.startswith('['):
        out = []
        for el in re.split(r',', token.strip('[] ')):
            el = el.strip()
            if not el:
                continue
            m = re.fullmatch(r'[\'"]([^\'"]+)[\'"]', el)
            if m:
                out.append(m.group(1))
            else:  # bare identifier → resolve via const / array table
                val = _BIOMES[biome]["const"].get(el)
                if val:
                    out.append(val)
                elif el in _BIOMES[biome]["arrays"]:
                    out.extend(_BIOMES[biome]["arrays"][el])
                else:
                    return None
        return out or None
    if token in _BIOMES[biome]["arrays"]:
        return _BIOMES[biome]["arrays"][token]
    if token.startswith("HOME.structures"):
        return C.HOME_JS.get(biome, {}).get("structures", [])
    return None


def compile_expr(expr, biome, ns, seen=None):
    seen = seen or set()
    expr = _strip_outer_parens(expr.strip())
    if not expr:
        return None
    if GUARD_RE.match(expr) or expr in TRUTHY_IDENT:
        return TRUE
    parts = _split_top(expr, "||")
    if len(parts) > 1:
        subs = []
        for p in parts:
            c = compile_expr(_strip_outer_parens(p), biome, ns, seen)
            if c is None:
                return None
            if c is TRUE:
                return TRUE
            if c is FALSE:
                continue
            subs.append(c)
        if not subs:
            return FALSE
        return subs[0] if len(subs) == 1 else {"type": "any_of", "conditions": subs}
    parts = _split_top(expr, "&&")
    if len(parts) > 1:
        subs = []
        for p in parts:
            c = compile_expr(_strip_outer_parens(p), biome, ns, seen)
            if c is None:
                return None
            if c is FALSE:
                return FALSE
            if c is TRUE:
                continue
            subs.append(c)
        if not subs:
            return TRUE
        return subs[0] if len(subs) == 1 else {"type": "all_of", "conditions": subs}
    if expr.startswith('!!'):
        return compile_expr(expr[2:], biome, ns, seen)
    if expr.startswith('!'):
        inner = compile_expr(expr[1:], biome, ns, seen)
        if inner is None:
            return None
        if inner is TRUE:
            return FALSE
        if inner is FALSE:
            return TRUE
        if isinstance(inner, dict) and inner.get("type") == "not":
            return inner["conditions"][0]   # collapse double negation
        return {"type": "not", "conditions": [inner]}
    return compile_leaf(expr, biome, ns, seen)


compile_expr_seen = compile_expr




BLOCKED_RE = re.compile(r'\b(getLinkCounter|getMark|findNearbyMarked|findNearbyMarkedEntities|stillFor)\b')
CMP = r'(>=|<=|===|==|>|<)'
KEY = r"([A-Za-z_][\w.]*|'[^']+'|\"[^\"]+\")"


def _mk_point(biome, ns, getter, key_tok, op, num):
    key = point_key(_BIOMES, biome, ns, getter, key_tok)
    if key is None:
        return None
    return {"type": "point", "point": key, "op": OP_MAP.get(op, "gte"), "value": int(num)}


def _resource_point_key(biome, ns, field, ptype="counter"):
    """Resolve RESOURCE.<field> (e.g. current/capacity) to a namespaced point key."""
    key = _BIOMES[biome]["RESOURCE"].get(field)
    if not key:
        return None
    return C.rewrite_point_key(ptype + ":" + key, ns)


def _js_formula_to_expr(formula, biome, ns):
    """Convert a JS numeric RHS (Math.* + point getters) into an organEffects formula
    string the `point` condition can evaluate: strip the `Math.` prefix and rewrite each
    getCounter/getRuntimePoint/... read to point('<namespaced key>'). Returns None if any
    getter cannot be resolved or a non-arithmetic token survives."""
    s = re.sub(r'\bMath\.', '', formula.strip())

    def repl(m):
        key = point_key(_BIOMES, biome, ns, m.group(1), m.group(2))
        return "point('%s')" % key if key else m.group(0)

    s = re.sub(r'(?:[A-Za-z_]\w*\.)?(getRuntimePoint|getOepRuntime|getShieldPoint|getCounter)\(\s*[^,]+,\s*' + KEY + r'\s*\)', repl, s)
    if re.search(r'\bget(?:Counter|RuntimePoint|OepRuntime|ShieldPoint)\b', s):
        return None  # an unresolved getter survived — bail to the forge fallback
    if not re.fullmatch(r"[\d\s+\-*/%().,':A-Za-z_]*", s):
        return None  # stray token (comparison, bracket, …) → not a pure arithmetic formula
    return s.strip()


def compile_leaf(expr, biome, ns, seen=None):
    seen = seen or set()
    expr = _strip_outer_parens(expr.strip())
    if BLOCKED_RE.search(expr):
        return None
    # home
    if re.fullmatch(r'(?:Common\.)?homeMatch\(\s*(?:event\.)?player\s*\)', expr):
        return C.build_home_condition(biome)
    m = re.fullmatch(r'(?:Common\.)?homeState\([^)]*\)\)?\.(\w+)', expr)
    if m:
        return _home_branch(biome, m.group(1)) if m.group(1) != "final" else C.build_home_condition(biome)
    # point comparison (getter may carry a Runtime./Common./OrganKubeJS. prefix)
    m = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?(getRuntimePoint|getOepRuntime|getShieldPoint|getCounter)\([^,]+,\s*' + KEY + r'\s*\)\s*' + CMP + r'\s*(\d+)', expr)
    if m:
        return _mk_point(biome, ns, m.group(1), m.group(2), m.group(3), m.group(4))
    # dynamic-threshold point comparison: getter(player, KEY) OP <formula>, where the RHS
    # references capacity/other counters (e.g. createT2 high_load: current >= max(16,
    # floor(capacity*0.75))). The `point` condition now evaluates a formula threshold.
    m = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?(getRuntimePoint|getOepRuntime|getShieldPoint|getCounter)\([^,]+,\s*' + KEY + r'\s*\)\s*' + CMP + r'\s*(.+)', expr)
    if m:
        key = point_key(_BIOMES, biome, ns, m.group(1), m.group(2))
        formula = _js_formula_to_expr(m.group(4), biome, ns)
        if key is not None and formula is not None:
            value = int(formula) if re.fullmatch(r'\d+', formula) else formula
            return {"type": "point", "point": key, "op": OP_MAP.get(m.group(3), "gte"), "value": value}
    # energyReady(player, N) == current >= min(capacity, floor(N)) (mekanism energy gate)
    m = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?energyReady\([^,]+,\s*(\d+)\s*\)', expr)
    if m:
        cur = _resource_point_key(biome, ns, "current")
        cap = _resource_point_key(biome, ns, "capacity")
        if cur and cap:
            return {"type": "point", "point": cur, "op": "gte",
                    "value": "min(point('%s'), %d)" % (cap, int(m.group(1)))}
    # organ_set
    m = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?hasMatching\([^,]+,\s*([A-Za-z_]\w*|new Set\(\[[^\]]*\]\))\s*\)', expr)
    if m:
        return _organ_set(biome, ns, m.group(1), "gte", 1)
    m = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?countMatching\([^,]+,\s*([A-Za-z_]\w*)\s*\)\s*' + CMP + r'\s*(\d+)', expr)
    if m:
        return _organ_set(biome, ns, m.group(1), OP_MAP.get(m.group(2), "gte"), int(m.group(3)))
    m = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?installedSourceIds\([^)]*\)\.indexOf\(\s*\'([^\']+)\'\s*\)\s*>=\s*0', expr)
    if m:
        return {"type": "organ_set", "organs": [C.rewrite_ns(m.group(1), ns)], "op": "gte", "value": 1}
    # inventory
    m = re.fullmatch(r'(?:auxOnline|inventoryAuxiliary)\([^,]+,\s*' + KEY + r'\s*\)', expr)
    if m:
        raw = resolve_arg(_BIOMES, biome, m.group(1))
        return {"type": "inventory", "items": [C.rewrite_ns(raw, ns)], "op": "gte", "value": 1} if raw else None
    m = re.fullmatch(r'hasAuxiliary\([^,]+,\s*\'([^\']+)\'\s*\)', expr)
    if m:
        raw = _BIOMES[biome]["AUXILIARY"].get(m.group(1))
        return {"type": "inventory", "items": [C.rewrite_ns(raw, ns)], "op": "gte", "value": 1} if raw else None
    m = re.fullmatch(r'hasAuxItem\([^,]+,\s*\'([^\']+)\'\s*\)', expr)
    if m:
        return {"type": "inventory", "items": [C.rewrite_ns(m.group(1), ns)], "op": "gte", "value": 1}
    m = re.fullmatch(r'inventoryCount\([^,]+,\s*(\[[^\]]*\]|[A-Za-z_]\w*)\s*\)\s*>\s*0', expr)
    if m:
        arr = _resolve_array(biome, m.group(1))
        return {"type": "inventory", "items": [C.rewrite_ns(i, ns) for i in arr], "op": "gte", "value": 1} if arr else None
    if re.fullmatch(r'hasVoidKit\(\s*(?:event\.)?player\s*\)', expr):
        return {"type": "inventory", "items": list(VOID_KIT_ITEMS), "op": "gte", "value": 1}
    return _compile_leaf_world(expr, biome, ns, seen)


def _organ_set(biome, ns, set_tok, op, value):
    if set_tok.startswith("new Set"):
        ids = re.findall(r'[\'"]([^\'"]+)[\'"]', set_tok)
    else:
        ids = _BIOMES[biome]["sets"].get(set_tok)
    if not ids:
        return None
    return {"type": "organ_set", "organs": [C.rewrite_ns(i, ns) for i in ids], "op": op, "value": value}


MOB_EFFECTS = {"BAD_OMEN": "minecraft:bad_omen"}
MOVEMENT = {"isSprinting": "sprinting", "isCrouching": "sneaking", "isSwimming": "swimming",
            "isFallFlying": "fall_flying"}


def _compile_leaf_world(expr, biome, ns, seen):
    # status effect
    m = re.search(r'hasEffect\(\s*MobEffects\.(\w+)\s*\)', expr)
    if m and re.fullmatch(r'[\w.()]*hasEffect\([^)]*\)', expr):
        eff = MOB_EFFECTS.get(m.group(1), "minecraft:" + m.group(1).lower())
        return {"type": "status_effect", "effect": eff}
    # movement / environment leaves
    m = re.search(r'\.(isSprinting|isCrouching|isSwimming|isFallFlying)\(\)', expr)
    if m and expr.endswith(')'):
        return {"type": "movement_state", "state": MOVEMENT[m.group(1)]}
    if re.search(r'\.isOnFire\(\)', expr):
        return {"type": "environment_state", "state": "on_fire"}
    if re.search(r'\.isInLava\(\)', expr):
        return {"type": "environment_state", "state": "in_lava"}
    if re.search(r'\.isInWater\(\)', expr):
        return {"type": "environment_state", "state": "in_water"}
    if re.fullmatch(r'(?:Common\.)?isWet\(\s*(?:event\.)?player\s*\)', expr):
        return {"type": "environment_state", "state": "wet"}
    # nearby entity scan → any_of[nearby_entity per id]
    m = re.fullmatch(r'countNearbyEntityTypes\([^,]+,\s*([A-Za-z_]\w*)\s*,\s*(\d+)\)\s*>\s*0', expr)
    if m:
        ids = _BIOMES[biome]["sets"].get(m.group(1)) or _BIOMES[biome]["arrays"].get(m.group(1))
        if not ids:
            return None
        radius = float(m.group(2))
        # Collapse the vanilla raider roster into the #minecraft:raiders entity tag: when
        # the id set CONTAINS all six tag members, replace those six with one tag-based
        # nearby_entity node and keep any extras (vex / irons_spellbooks summons) as their
        # own nodes. The engine's nearby_entity supports entity_tag, and the tag membership
        # equals exactly those six ids, so this is faithful.
        idset = set(ids)
        if _RAIDERS_TAG_MEMBERS <= idset:
            subs = [{"type": "nearby_entity", "entity_tag": "minecraft:raiders",
                     "op": "gt", "value": 0, "radius": radius}]
            subs += [{"type": "nearby_entity", "entity": i, "op": "gt", "value": 0,
                      "radius": radius} for i in ids if i not in _RAIDERS_TAG_MEMBERS]
            return subs[0] if len(subs) == 1 else {"type": "any_of", "conditions": subs}
        subs = [{"type": "nearby_entity", "entity": i, "op": "gt", "value": 0,
                 "radius": radius} for i in ids]
        return subs[0] if len(subs) == 1 else {"type": "any_of", "conditions": subs}
    # dimension
    m = re.fullmatch(r'dimensionId\([^)]*\)\s*===?\s*\'([^\']+)\'', expr)
    if m:
        return {"type": "dimid", "value_id": m.group(1)}
    if re.fullmatch(r'(?:Common\.)?overworld\(\s*(?:event\.)?player\s*\)', expr):
        return {"type": "dimid", "value_id": "minecraft:overworld"}
    # biome keyword
    m = re.fullmatch(r'(?:(?:Common\.)?biomeId\([^)]*\)|biome)\)?\.indexOf\(\s*\'([^\']+)\'\s*\)\s*>=\s*0', expr)
    if m:
        return {"type": "biome_category", "value": m.group(1)}
    # nearby block
    m = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?hasNearbyBlock\([^,]+,\s*(\[[^\]]*\]|[A-Za-z_]\w*)\s*,\s*(\d+)\)', expr)
    if m:
        blocks = _resolve_array(biome, m.group(1))
        return {"type": "nearby_block", "blocks": blocks, "radius": int(m.group(2)),
                "vertical": 1, "value": 1} if blocks else None
    # nearby structure (has/nearbyStructure, optional Common. prefix)
    m = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?(?:has)?[Nn]earbyStructure\([^,]+,\s*(\[[^\]]*\]|[A-Za-z_.]+)\s*,\s*([^,)]+)(?:,[^)]*)?\)', expr)
    if m:
        structs = _resolve_array(biome, m.group(1))
        rad = _resolve_radius(biome, m.group(2))
        return {"type": "structure", "structures": structs,
                "radius_chunks": max(1, min(32, rad))} if structs else None
    # time / light
    if re.fullmatch(r'(?:Common\.)?isDaytime\(\s*(?:event\.)?player\s*\)', expr) or re.search(r'\.isDay\(\)', expr):
        return {"type": "time", "mode": "day"}
    if re.fullmatch(r'(?:Common\.)?highLight\(\s*(?:event\.)?player\s*\)', expr):
        return {"type": "lightlevel", "op": "gte", "value": 12}
    # raw light-level comparison: Number(...getMaxLocalRawBrightness(...)) OP N
    if 'getMaxLocalRawBrightness' in expr:
        m = re.search(r'(>=|<=|>|<|===?)\s*(\d+)\s*$', expr)
        if m:
            return {"type": "lightlevel", "op": OP_MAP.get(m.group(1), "gte"), "value": int(m.group(2))}
    # count-helper comparison: someCountHelper(player) OP N  (helper wraps countMatching)
    m = re.fullmatch(r'(?:Common\.)?([A-Za-z_]\w*)\(\s*player\s*\)\s*(>=|>|<=|<)\s*(\d+)', expr)
    if m and m.group(1) in funcs_for(biome) and m.group(1) not in seen:
        body = flatten_body(funcs_for(biome)[m.group(1)])
        hm = re.fullmatch(r'(?:[A-Za-z_]\w*\.)?countMatching\([^,]+,\s*([A-Za-z_]\w*)\s*\)', body.strip())
        if hm:
            return _organ_set(biome, ns, hm.group(1), OP_MAP.get(m.group(2), "gte"), int(m.group(3)))
    # helper inline (last resort)
    m = re.fullmatch(r'(?:Common\.)?([A-Za-z_]\w*)\(\s*(?:event\.)?player\s*\)', expr)
    if m and m.group(1) in funcs_for(biome) and m.group(1) not in seen:
        return _compile_helper(m.group(1), biome, ns, seen | {m.group(1)})
    return None


def _resolve_radius(biome, tok):
    tok = tok.strip()
    if tok.isdigit():
        return int(tok)
    if tok.startswith("HOME.structure_radius"):
        return C.HOME_JS.get(biome, {}).get("structure_radius", 8)
    return 8


def _flip_negative_guard(cond):
    """`A !== B` / `A != B` → `A === B` so a `return false` guard becomes a positive AND term."""
    cond = cond.strip()
    m = re.fullmatch(r'(.+?)\s*!==?\s*(.+)', cond)
    if m:
        return m.group(1).strip() + ' === ' + m.group(2).strip()
    return '!(' + cond + ')'


def _consume_balanced(s, open_ch, close_ch, start):
    depth, k = 1, start
    while k < len(s) and depth > 0:
        if s[k] == open_ch:
            depth += 1
        elif s[k] == close_ch:
            depth -= 1
        k += 1
    return s[start:k - 1], k


def flatten_body(body):
    """Flatten a helper body (early-return disjunction + guards) into one boolean expr.

    ``if (C) { return true } … return F``  →  ``C || F``
    ``if (G) { return false } … return F`` →  drop null-guards; else ``!(G) && F``
    (a ``A !== B`` false-guard flips to the positive ``A === B`` requirement).
    """
    body = normalize_player(re.sub(r'\s+', ' ', body).strip())
    ors, ands, locals_ = [], [], {}
    while True:
        body = body.strip()
        m = re.match(r'^let\s+([A-Za-z_]\w*)\s*=\s*', body)
        if m:
            rest = body[m.end():]
            # value runs to the next let/if/for/return keyword
            stop = re.search(r'\s+(?:let|if|for|return)\b', rest)
            end = stop.start() if stop else len(rest)
            locals_.setdefault(m.group(1), rest[:end].strip())
            body = rest[end:]
            continue
        # keyword-loop disjunction: for(...) { if (biome.indexOf(ARR[i]) >= 0) return true }
        m = re.match(r'^for\s*\(', body)
        if m:
            _, k = _consume_balanced(body, '(', ')', m.end())
            blk_start = body.index('{', k) + 1
            block, k2 = _consume_balanced(body, '{', '}', blk_start)
            hm = re.search(r'\.indexOf\(\s*([A-Za-z_]\w*)\[\w+\]\s*\)\s*>=\s*0[^}]*return true', block)
            if hm and hm.group(1) in locals_:
                for kw in re.findall(r"'([^']+)'", locals_[hm.group(1)]):
                    ors.append("biomeId(player).indexOf('%s') >= 0" % kw)
            body = body[k2:]
            continue
        m = re.match(r'^if\s*\(', body)
        if m:
            cond, k = _consume_balanced(body, '(', ')', m.end())
            blk_start = body.index('{', k) + 1
            block, k2 = _consume_balanced(body, '{', '}', blk_start)
            block = block.strip()
            if re.search(r'return\s+true', block):
                ors.append(cond.strip())
            else:
                # a `return false`/`return …false…` guard: drop pure null-guards
                # (`!player`), else keep as a positive AND requirement.
                c = cond.strip()
                null_guard = GUARD_RE.match(c[1:].strip()) if c.startswith('!') else False
                if not null_guard:
                    ands.append(_flip_negative_guard(c))
            body = body[k2:]
            continue
        break
    final = _last_return_expr(body)
    core = final
    if ands:
        core = ' && '.join(ands + ['(' + final + ')'])
    expr = ' || '.join(ors + ['(' + core + ')']) if ors else core
    return substitute_locals(expr, locals_)


def _compile_helper(name, biome, ns, seen):
    return compile_expr(flatten_body(funcs_for(biome)[name]), biome, ns, seen)



def _predicate_tail_expr(body):
    """Extract EXPR from the last ``...predicateResult(event, EXPR)`` call."""
    last = None
    for m in re.finditer(r'[Pp]redicateResult\(', body):
        last = m
    if last is None:
        return _last_return_expr(body)
    j, depth, buf = last.end(), 1, []
    while j < len(body) and depth > 0:
        c = body[j]
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
        if depth > 0:
            buf.append(c)
        j += 1
    args = ''.join(buf)
    # split off the leading `event,` → the remainder is EXPR
    parts = _split_top_comma(args)
    return parts[-1].strip() if parts else args.strip()


def _split_top_comma(expr):
    parts, depth, last = [], 0, 0
    for i, c in enumerate(expr):
        if c in '([':
            depth += 1
        elif c in ')]':
            depth -= 1
        elif c == ',' and depth == 0:
            parts.append(expr[last:i])
            last = i + 1
    parts.append(expr[last:])
    return [p.strip() for p in parts]


def compile_predicate(name, biome, ns):
    body = _BIOMES[biome]["preds"].get(name)
    if not body:
        return None
    body = normalize_player(re.sub(r'\s+', ' ', body).strip())
    locals_, _ = parse_locals(body)
    expr = _predicate_tail_expr(body)
    expr = substitute_locals(expr, locals_)
    cond = compile_expr(expr, biome, ns)
    if cond is TRUE:
        return {"type": "static"}   # always-on predicate → engine's static condition
    if cond is FALSE or cond is None:
        return None
    return cond


# ---------- pack rewrite ----------

def build_resolution_table():
    spec = json.loads((MIGRATION / "predicate_spec.json").read_text(encoding="utf-8"))
    ordered = sorted(_BIOMES, key=len, reverse=True)
    table = {}
    for name, entry in spec.items():
        if entry.get("type") != "hook":
            continue
        biome = next((b for b in ordered if name.startswith(b)), None)
        if biome is None:
            continue
        cond = compile_predicate(name, biome, biome.lower())
        if cond is not None:
            table[name] = cond
    return table


def rewrite_node(node, table, stats):
    """Recursively rewrite any resolvable ``kubejs_hook`` dict to its declarative form."""
    if isinstance(node, dict):
        if node.get("type") == "kubejs_hook":
            replacement = table.get(node.get("callback"))
            if replacement is not None:
                stats["resolved"] += 1
                return json.loads(json.dumps(replacement))  # deep copy, no display mask
            stats["left"] += 1
            stats["remaining"].add(node.get("callback"))
            return node
        return {k: rewrite_node(v, table, stats) for k, v in node.items()}
    if isinstance(node, list):
        return [rewrite_node(v, table, stats) for v in node]
    return node


# why each still-unresolved hook needs the forge KubeJS fallback (a new engine
# capability, or an intentional cross-ref). Keyed by callback substring.
REMAINING_REASON = {
    "high_load": "dynamic threshold: current >= max(16, floor(capacity*0.75)) — needs point-vs-formula compare",
    "energy_ready": "dynamic threshold: current >= min(capacity, amount) — needs point-vs-point compare",
    "flow_ready": "dynamic threshold (energyReady) — needs point-vs-point compare",
    "heat_blade_ready": "energyReady dynamic threshold inside the AND — needs point-vs-point compare",
    "sync_online": "reads getLinkCounter — intentional forge cross-ref (link counter written by hook)",
    "radiation_source_nearby": "reads getLinkCounter (syncOnline) — intentional forge cross-ref",
    "marked_online": "reads per-entity mark (getMark/findNearbyMarkedEntities) — no declarative primitive",
    "rooted_online": "home && stillFor>=60 — no still-timer primitive",
    "lava_online": "entity.isInLava() branch — no in_lava environment_state primitive",
}


def _cond_kind(c):
    t = c.get("type")
    if t in ("any_of", "all_of", "not"):
        return "composite"
    if t == "point":
        return "point"
    if t in ("organ_set", "inventory"):
        return "set/inv"
    return "world"


def normalize_node(node):
    """Idempotent structural simplification of condition trees.

    Flattens nested same-type ``any_of``/``all_of`` (``a||(b||c)`` → one any_of),
    de-duplicates identical siblings, and unwraps single-child combinators. Pure
    semantics-preserving; non-combinator nodes pass through untouched. Runs over
    EVERY organ so pre-existing nesting is tidied too — a positive side effect of
    the home-condition compaction.
    """
    if isinstance(node, list):
        return [normalize_node(v) for v in node]
    if not isinstance(node, dict):
        return node
    t = node.get("type")
    if t in ("any_of", "all_of"):
        flat = []
        seen = set()
        for child in node.get("conditions", []):
            child = normalize_node(child)
            members = child.get("conditions", []) if isinstance(child, dict) and child.get("type") == t else [child]
            for mem in members:
                key = json.dumps(mem, ensure_ascii=False, sort_keys=True)
                if key not in seen:
                    seen.add(key)
                    flat.append(mem)
        if len(flat) == 1:
            return flat[0]
        out = dict(node)
        out["conditions"] = flat
        return out
    return {k: normalize_node(v) for k, v in node.items()}


def main(argv):
    dry_run = "--dry-run" in argv
    global COMMON_FUNCS, _BIOMES
    COMMON_FUNCS = functions_of(COMMON_JS.read_text(encoding="utf-8"))
    _BIOMES = load_biomes()
    table = build_resolution_table()

    kinds = {}
    for c in table.values():
        kinds[_cond_kind(c)] = kinds.get(_cond_kind(c), 0) + 1
    print(f"[resolve] {len(table)} hook callbacks now resolvable "
          + ", ".join(f"{v} {k}" for k, v in sorted(kinds.items())))

    stats = {"resolved": 0, "left": 0, "remaining": set()}
    files = sorted(DATA_OUT.glob("*-pack/data/*/organapi/organs/*.json"))
    changed = 0
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        before = json.dumps(data, ensure_ascii=False, sort_keys=True)
        data = rewrite_node(data, table, stats)
        data = normalize_node(data)
        after = json.dumps(data, ensure_ascii=False, sort_keys=True)
        if before != after:
            changed += 1
            if not dry_run:
                f.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"[resolve] rewrote {stats['resolved']} kubejs_hook conditions across {changed} files; "
          f"{stats['left']} hooks remain "
          f"({len(stats['remaining'])} distinct callbacks, forge KubeJS fallback)"
          + (" (dry-run)" if dry_run else ""))

    if not dry_run:
        (MIGRATION / "resolved_hooks.json").write_text(
            json.dumps(table, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        # authoritative post-resolve fallback list (the true "C" that needs a new
        # engine capability or is an intentional forge cross-ref). Supersedes the
        # convert_to_packs.py fallback_report, which only reflects pass 1.
        report = {}
        for cb in sorted(stats["remaining"]):
            reason = next((r for k, r in REMAINING_REASON.items() if k in cb), "see predicate body")
            report[cb] = reason
        (MIGRATION / "fallback_report.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])







