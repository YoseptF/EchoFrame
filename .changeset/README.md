# Changesets

One file here per user-visible change, added in the same PR as the change. It names the package
(`echoframe`), the bump (patch or minor) and one sentence written for the person reading the
changelog. Many commits can share one file.

    bun run changeset            # interactive
    bun run changeset --empty    # "this PR changes code but has nothing to tell users"

Never pick `major`. A major version is a launch and comes from a file in `launches/`, not from a
changeset. CI refuses a `major` changeset unless a launch is armed. CI also refuses a PR into
`release` that touches source without a file here. The bump rules and the release flow are in
CONTRIBUTING.md.
