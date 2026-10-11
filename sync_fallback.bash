#!/usr/bin/env bash
#
# Deploy the forge-only KubeJS *fallback* tree into a game instance's kubejs/ dir,
# alongside the data-driven organ packs (deployed separately by sync_packs.bash).
#
# After the repo reorg the fallback tree is pre-merged at repo-root kubejs/ (scripts under
# per-biome subdirs — KubeJS loads them recursively; assets/data/lang already merged to the
# standard namespace paths). It ships NO organ item or organ-def datapack, so it never
# reintroduces the "purple organ" duplication — organs ride organapi:organ_item + OrganId,
# served by the packs. See the organ-registration-retirement notes.
#
# Deployed content: skills (<biome>/_skills.js), runtime hooks (_runtime.js), event triggers
# (_events.js), tags (_tags.js), aux-item registration (_organs.js + models), drops/sources
# (chest loot, loadouts, surgery/sequenced recipes), source_tools intermediates, shared
# helpers (common/), PLUS the non-organ others/ kubejs (dim-lock, monster-buff, network,
# zhCN, quest, config) whose lang is merged in.
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

# 1) mirror the pre-merged repo kubejs/ tree (scripts under <biome>/ subdirs loaded
#    recursively by KubeJS; assets/data and the merged organ lang at their standard paths)
cp -r kubejs/. "$target_kjs/"

# 2) overlay the independent non-organ others/*/kubejs trees (dim-lock, monster-buff,
#    network, zhCN per-mod localisations, quest, config). These carry NO kubejs-namespace
#    lang, so a straight tree copy never clobbers the organ lang placed in step 1.
for g in others/*/; do
  [ -d "$g/kubejs" ] && cp -r "$g/kubejs/." "$target_kjs/"
done

echo "[sync_fallback] deployed forge KubeJS fallback -> $target_kjs"
