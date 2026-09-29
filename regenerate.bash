#!/usr/bin/env bash
#
# Canonical regeneration entry point for the cross-version data packs.
#
# The pack JSON under organs/{data,resources}/*-pack is produced by THREE passes that
# MUST run in this order — running convert_to_packs.py alone regenerates packs from
# predicate_spec.json and CLOBBERS the in-place edits of the later two passes (this is
# exactly the regression that lost 59 resolved hooks in commit 45f62cb). Always run
# this script; never call convert_to_packs.py on its own.
#
#   1. convert_to_packs.py      kubejs_predicate -> declarative / kubejs_hook placeholder
#                               (full regenerate from predicate_spec.json + biome consts)
#   2. convert_target_calls.py  in-place: mechanical kubejs_target_call -> target_strike
#   3. resolve_hooks.py         in-place: compile resolvable kubejs_hook bodies into
#                               declarative conditions (point/organ_set/inventory/any_of/…)
#
# All three are idempotent given this order, so re-running is safe. Pass --dry-run to
# preview without writing.
#
# Usage:
#   ./regenerate.bash [--dry-run] [biome ...]     # biomes forwarded to pass 1 only

set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"

dry=""
biomes=()
for arg in "$@"; do
  if [ "$arg" == "--dry-run" ]; then
    dry="--dry-run"
  else
    biomes+=("$arg")
  fi
done

echo "[regenerate] 1/3 convert_to_packs.py"
python3 convert_to_packs.py ${dry:+$dry} "${biomes[@]}"

echo "[regenerate] 2/3 convert_target_calls.py"
python3 convert_target_calls.py ${dry:+$dry}

echo "[regenerate] 3/3 resolve_hooks.py"
python3 resolve_hooks.py ${dry:+$dry}

echo "[regenerate] done${dry:+ (dry-run)}"
