#!/usr/bin/env bash
#
# Migration-era sync (step 6): copies the data-driven custom packs produced by
# convert_to_packs.py into a game instance's run directory, matching the migrated
# organAPI/organEffects pack loader layout:
#
#     <gameDir>/organs/data/<ns>-pack/       (SERVER_DATA sub-packs)
#     <gameDir>/organs/resources/<ns>-pack/  (CLIENT_RESOURCES sub-packs)
#
# This replaces the legacy "generate kubejs/" flow (sync.bash) for the cross-version
# branch: content is loaded from run-dir custom packs, not KubeJS scripts. KubeJS
# fallback for kubejs_hook conditions is a separate step-7 concern and is NOT synced
# here.
#
# Usage:
#   ./sync_packs.bash [target_gamedir]
# Mirrors the committed organs/{data,resources}/*-pack into the instance. It does
# NOT regenerate them (see the note below).

set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"

if [ "${1:-}" == "" ]; then
  target_dir="/home/kuzuanpa/library/links/minecraft-packs-local/CuiGu/versions/No Flesh Within Chest Reborn/"
else
  target_dir="$1"
fi

# NOTE: the packs under organs/{data,resources} are the committed source of truth for
# the cross-version branch. To regenerate them from the legacy KubeJS sources, run
# ./regenerate.bash (convert_to_packs.py -> convert_target_calls.py -> resolve_hooks.py,
# in that order). This script only MIRRORS the committed/regenerated packs into a game
# instance — it does NOT regenerate, so it never clobbers anything.

# mirror into the game run directory (organs/ is the loader scan root)
target_organs="$target_dir/organs"
for side in data resources; do
  src="organs/$side"
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

echo "[sync_packs] synced organs/{data,resources}/*-pack -> $target_organs"
