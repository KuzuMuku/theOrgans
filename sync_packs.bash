#!/usr/bin/env bash
#
# Deploy the canonical data-driven organ packs into a game instance's run directory,
# matching the organAPI/organEffects custom pack loader layout:
#
#     <gameDir>/organs/data/<ns>-pack/       (SERVER_DATA sub-packs)
#     <gameDir>/organs/resources/<ns>-pack/  (CLIENT_RESOURCES sub-packs)
#
# Source of truth in this repo lives at packs/{data,resources}/*-pack. The instance-side
# path stays <gameDir>/organs/ (that is the organAPI pack-loader scan root, an instance
# convention — it does NOT follow the repo reorg). KubeJS forge fallback is deployed
# separately by sync_fallback.bash.
#
# Usage:
#   ./sync_packs.bash [target_gamedir]
# Mirrors packs/{data,resources}/*-pack into the instance (copy-only, never clobbers
# unrelated instance files).

set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"

if [ "${1:-}" == "" ]; then
  target_dir="/home/kuzuanpa/library/links/minecraft-packs-local/CuiGu/versions/No Flesh Within Chest Reborn/"
else
  target_dir="$1"
fi

# mirror into the game run directory (instance scans <gameDir>/organs/ for packs)
target_organs="$target_dir/organs"
for side in data resources; do
  src="packs/$side"
  [ -d "$src" ] || continue
  mkdir -p "$target_organs/$side"
  # copy each <ns>-pack, replacing any stale copy of the same pack
  for pack in "$src"/*-pack; do
    [ -d "$pack" ] || continue
    name="$(basename "$pack")"
    rm -rf "$target_organs/$side/$name/"
    cp -r "$pack" "$target_organs/$side/$name"
  done
done

echo "[sync_packs] synced packs/{data,resources}/*-pack -> $target_organs"
