#!/usr/bin/env bash
# Creates the GitHub release for the current version if its tag exists and has no release yet. A
# launch release leads with the launch file's why, then the changelog section.
set -euo pipefail
version=$(jq -r .version package.json); tag="v$version"
git rev-parse -q --verify "refs/tags/$tag" >/dev/null || { echo "no tag $tag"; exit 0; }
gh release view "$tag" >/dev/null 2>&1 && { echo "$tag already released"; exit 0; }
changes=$(awk -v v="## $version" 'BEGIN{p=0} $0==v{p=1;next} /^## /{if(p)exit} p' CHANGELOG.md 2>/dev/null || true)
why=$(bun scripts/launch.ts notes "$version")
notes="${why:+$why

}${changes:-No changelog entry.}"
gh release create "$tag" --title "echoframe $version" --notes "$notes"
echo "released $tag"
