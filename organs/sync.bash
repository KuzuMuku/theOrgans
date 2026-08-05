#!/usr/bin/env bash
if [ "$1" == "" ];then echo "Null Path inputed!"; exit; fi

set -euo pipefail

target_root="$1"
target_kubejs="$target_root/kubejs"

mkdir -p "$target_kubejs"
rm -r "$target_kubejs"

for source_dir in */kubejs; do
  [ -d "$source_dir" ] || continue

  for subdir in startup_scripts server_scripts client_scripts data assets config; do
    if [ -d "$source_dir/$subdir" ]; then
      mkdir -p "$target_kubejs/$subdir"
      cp -r "$source_dir/$subdir/." "$target_kubejs/$subdir/"
    fi
  done
done



for lang_file in */kubejs/assets/kubejs/lang/*.json; do
  [ -f "$lang_file" ] || continue

  target_file="$target_kubejs/assets/kubejs/lang/$(basename "$lang_file")"
  mkdir -p "$(dirname "$target_file")"

  python3 - "$lang_file" "$target_file" <<'PY'
import json
import sys
from pathlib import Path

source_path = Path(sys.argv[1])
target_path = Path(sys.argv[2])

source = json.loads(source_path.read_text(encoding="utf-8"))
target = {}
if target_path.exists():
    target = json.loads(target_path.read_text(encoding="utf-8"))

target.update(source)
target_path.write_text(
    json.dumps(target, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
PY
done
