# Launches

A major version of echoframe is a launch: something you post about, not something that happens
because one pull request changed a default. Changesets never pick `major`. The only way to go from
0.x to 1.0, or from 1.x to 2.0, is a file here.

## Arming a launch

1. Copy `TEMPLATE.md` to `v<next major>.md` (`v1.md` while echoframe is 0.x) and fill every
   section: why this is a major, what changes for people already using it, the tweet, the LinkedIn
   post. CI measures each section and refuses placeholders. The posts are the ones you will really
   publish.
2. Open a pull request into `release` that changes only that file. A launch is never bundled with
   code.
3. Merge it. The launch is now armed.

## Cooling down

An armed launch ships with the first release into `main` that happens at least 7 days after the
launch file last changed. Every edit restarts the clock: the words you will post have to sit still
for a week. Until then releases go out as usual, as minors and patches, and the
release PR says when the launch becomes ready. Changed your mind? Delete the file in its own pull
request and the launch is disarmed.

While a launch is armed, `major` changesets are accepted for the breaking changes that go with it.
Once one of those merges, nothing reaches `main` until the launch is ready: the release PR fails
its launch gate until the cooldown ends.

## Launch day

Merging the release PR bumps echoframe to `<major>.0.0`, puts the launch's why at the top of the
GitHub release, and prints the tweet and LinkedIn post in the workflow summary. Post them.

After that the file is history: CI refuses any change to the launch file of a shipped major.
