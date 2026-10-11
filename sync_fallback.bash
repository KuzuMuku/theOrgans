#!/usr/bin/env bash
#
# Deploy the forge-only KubeJS *fallback* tree into a game instance's kubejs/ dir,
# alongside the data-driven packs (which are deployed separately by sync_packs.bash).
#
# This tree no longer registers organs or ships organ-definition datapacks — the organ
# bodies live in organs/{data,resources}/*-pack (packs are canonical). What remains and
# gets deployed here is the still-needed forge content:
#   * skills            organs/<biome>/kubejs/startup_scripts/<biome>_skills.js
#   * runtime hooks     organs/<biome>/kubejs/server_scripts/<biome>_runtime.js
#   * event triggers    organs/<biome>/kubejs/startup_scripts/<biome>_events.js
#   * tags              organs/<biome>/kubejs/server_scripts/<biome>_tags.js
#   * aux-item reg      organs/<biome>/kubejs/startup_scripts/<biome>_organs.js  (+ models)
#   * drops / sources   organ_sources/<biome>/kubejs/**  (chest loot, loadouts, recipes)
#   * intermediates     organ_sources/source_tools/kubejs/**
#   * shared helpers    organs/common/kubejs/**
#
# Organs everywhere ride organapi:organ_item + OrganId (see migrate_sources.py). Deploying
# this tree does NOT reintroduce the "purple organ" duplication, because no organ item or
# organ-def JSON is present any more.
#
# Usage:  ./sync_fallback.bash [target_gamedir]

set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"

if [ "${1:-}" == "" ]; then
  target_dir="/home/kuzuanpa/library/links/minecraft-packs-local/CuiGu/versions/No Flesh Within Chest Reborn"
else
  target_dir="${1%/}"
fi
target_kjs="$target_dir/kubejs"
mkdir -p "$target_kjs"

# source groups that carry forge-only organ fallback kubejs/
mapfile -t groups < <(
  printf '%s\n' organs/common organs/*/ organ_sources/*/ | sed 's:/*$::' | sort -u
)

# PLACEHOLDER_COPY

copy_sub() { # $1 = group kubejs dir, $2 = relative subpath under kubejs/
  local src="$1/$2"
  [ -e "$src" ] || return 0
  mkdir -p "$target_kjs/$2"
  cp -r "$src/." "$target_kjs/$2/"
}

for g in "${groups[@]}"; do
  kjs="$g/kubejs"
  [ -d "$kjs" ] || continue
  copy_sub "$kjs" startup_scripts
  copy_sub "$kjs" server_scripts
  copy_sub "$kjs" client_scripts
  copy_sub "$kjs" data
  # assets: everything EXCEPT lang (lang is merged below, not overwritten)
  if [ -d "$kjs/assets/kubejs" ]; then
    for a in "$kjs"/assets/kubejs/*/; do
      [ -d "$a" ] || continue
      case "$(basename "$a")" in
        lang) : ;;  # merged separately
        *) mkdir -p "$target_kjs/assets/kubejs/$(basename "$a")"
           cp -r "$a." "$target_kjs/assets/kubejs/$(basename "$a")/" ;;
      esac
    done
  fi
done

# merge all source lang files (biomes share one kubejs/assets/kubejs/lang/<locale>.json)
python3 - "$here" "$target_kjs" <<'PY'
import json, pathlib, sys
root, target = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
merged = {}
for f in root.glob("organ*/*/kubejs/assets/kubejs/lang/*.json"):
    locale = f.name
    merged.setdefault(locale, {}).update(json.loads(f.read_text(encoding="utf-8")))
out = target / "assets" / "kubejs" / "lang"
out.mkdir(parents=True, exist_ok=True)
for locale, data in merged.items():
    (out / locale).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[sync_fallback] merged lang {locale}: {len(data)} keys")
PY

echo "[sync_fallback] deployed forge KubeJS fallback -> $target_kjs"

