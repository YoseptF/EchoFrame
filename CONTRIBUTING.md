# How changes ship

Two locked branches. Everything else is a short-lived branch.

| Branch | Is | Gets changes from | Deploys to |
|---|---|---|---|
| `release` | staging, the next release in the making | pull requests from feature branches | echoframe-staging.yosept.me |
| `main` | production | one pull request from `release` | echoframe.yosept.me |

## Day to day

1. Branch off `release`. Commit as often as you like, one plain sentence per commit.
2. If a user would notice the change, add a changeset in the same branch:
   `bun run changeset`. Pick the bump, write one sentence for the changelog.
   Several commits share one changeset. Refactors, tests and tooling need none.
   Code changed but nothing to tell users? `bun run changeset --empty`. That is recorded too.
3. Open a PR into `release`. CI runs typecheck and tests, refuses the PR if source changed without
   a changeset, and refuses any `major` changeset unless a launch is armed. It also comments a
   preview URL on the PR (see below). Merge when green. Merging means "this ships next".

## Preview URLs

Every PR into `release` gets `https://pr-<n>-echoframe-staging.yosept-flores.workers.dev`, updated
on every push. It is a version of the staging Worker under a `pr-<n>` alias, nothing is deployed.
Production never has version URLs; `preview_urls` is on for staging only.

Google sign-in works on previews: "Continue with Google" goes through staging's registered callback
and comes back to the preview signed in. That relies on the sign-in handoff being live on staging,
so a PR opened before a change to it needs `release` merged in first.

## Bump rules

Majors are launches, not bumps. No changeset picks `major` on its own; see [Launches](#launches).

While echoframe is 0.x:

| Bump | Means | Examples |
|---|---|---|
| minor | something changed that people rely on, or a new capability | removed or renamed option, changed default, new feature |
| patch | same behaviour, better | bug fix, wording, speed, error messages |

From 1.0 on:

| Bump | Means | Examples |
|---|---|---|
| minor | new capability, nothing existing changes; old behaviour deprecated but still working | new option, new feature, a deprecation warning |
| patch | same behaviour, better | bug fix, wording, speed, error messages |

A breaking change on 1.x does not ship as a minor and does not force a major. Keep the old way
working, deprecate it in a minor, and remove it with the next launch.

Unsure? Pick the smaller bump and say why in the PR. Never `major`.

## Launches

Going from 0.x to 1.0, or from 1.x to 2.0, is something you announce. It happens only through a
launch file, `launches/v<major>.md`, that says why this is a major and holds the tweet and the
LinkedIn post that announce it. It lands in a PR of its own, and ships no sooner than 7 days after
it last changed. The full rules are in [launches/README.md](launches/README.md).

## Releasing

Every merge into `release` deploys staging. Nothing is versioned yet: the changesets pile up in
`.changeset/` until you ship.

1. Open `release` → `main`. CI comments on the PR what the merge will release: the new version,
   its changelog text and the launch status. The launch gate fails the PR if breaking changes are
   waiting on a launch that is still cooling down.
2. Merge it. Actions turns a ready launch into its major changeset, turns the pending changesets
   into one version bump and one changelog entry, commits "Version packages" to `main` and
   fast-forwards `release` to match. Then it deploys the Worker to echoframe.yosept.me, tags
   `v<x.y.z>` and creates the GitHub release from the changelog. On a launch it also prints the posts in the workflow summary.

One bump per production release, so version numbers only move when something actually ships.
Nobody chooses a version number and nobody deploys from a laptop.

If `release` moved between opening the PR and the deploy, the fast-forward is refused and Actions
opens a "Sync the version commit into release" PR instead. Merge it before the next release.

## Commit messages

One line, natural language, no type prefixes, no trailers, no tool attribution.

## Local development

See the README. `bun run check:changeset` and `bun run launch check` run the same checks CI does
against `origin/release`.
