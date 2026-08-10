

if [ "$1" == "" ];then
export target_dir="/home/kuzuanpa/library/links/minecraft-packs-local/CuiGu/versions/No Flesh Within Chest Reborn/"
else 
export target_dir="$1"
fi
set -euo pipefail
target_kubejs="$target_dir/kubejs"

mkdir -p "$target_kubejs"
rm -r "$target_kubejs"
mkdir -p "$target_kubejs"

#copy js file > individual dir
for source in organs organ_sources others; do
  for source_dir in $source/*/kubejs; do
    for subdir in startup_scripts server_scripts client_scripts; do
      if [ -d "$source_dir/$subdir" ]; then
        mkdir -p "$target_kubejs/$subdir/$source"
        cp -r "$source_dir/$subdir/." "$target_kubejs/$subdir/$source"
      fi
    done
  done
done

#copy regular file > correct dir
for source_dir in organs/*/kubejs organ_sources/*/kubejs others/*/kubejs; do
  for subdir in data assets config; do
    if [ -d "$source_dir/$subdir" ]; then
      mkdir -p "$target_kubejs/$subdir"
      cp -r "$source_dir/$subdir/." "$target_kubejs/$subdir/"
    fi
  done
done

#merge lang file > lang dir
for lang_file in organs/*/kubejs/assets/kubejs/lang/*.json others/*/kubejs/assets/kubejs/lang/*.json; do
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
