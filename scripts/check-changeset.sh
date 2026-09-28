#!/usr/bin/env bash
# Fails when a PR changes source without a changeset. Run with BASE_SHA and HEAD_SHA set (the PR
# workflow does), or against the merge base with origin/release locally.
set -euo pipefail
BASE=${BASE_SHA:-$(git merge-base HEAD origin/release)}
HEAD=${HEAD_SHA:-HEAD}
changed=$(git diff --name-only "$BASE" "$HEAD")
if ! grep -Eq '^(index\.ts|src/|package\.json)' <<<"$changed"; then echo "no source changed, no changeset needed"; exit 0; fi
added=$(git diff --name-only --diff-filter=A "$BASE" "$HEAD" | grep -E '^\.changeset/[^/]+\.md$' | grep -v README.md || true)
if [ -z "$added" ]; then
  echo "::error::this change touches echoframe but adds no .changeset/*.md file. Run 'bun run changeset' (or 'bun run changeset --empty' if there is nothing to tell users)."
  exit 1
fi
echo "changesets added:"; echo "$added"
