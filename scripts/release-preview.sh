#!/usr/bin/env bash
# Prints, as markdown, what merging the current tree into main would release: the launch status,
# the version change and its changelog section. Runs `changeset version` in place, so use it on a
# throwaway checkout (CI) or discard the changes afterwards.
set -euo pipefail
bun scripts/launch.ts status
echo
old=$(jq -r .version package.json)
bun scripts/launch.ts apply >/dev/null
bunx changeset version >/dev/null 2>&1 || true
new=$(jq -r .version package.json)
if [ "$new" = "$old" ]; then
  echo "No pending changesets. Merging bumps no version and creates no release."
  exit 0
fi
echo "### echoframe $old → $new"
awk -v v="## $new" 'BEGIN{p=0} $0==v{p=1;next} /^## /{if(p)exit} p' CHANGELOG.md
