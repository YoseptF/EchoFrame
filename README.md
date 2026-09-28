# echoframe

To install dependencies:

```bash
bun install
```

echoframe is a Cloudflare Worker: https://echoframe.yosept.me (staging:
https://echoframe-staging.yosept.me). To run it locally:

```bash
bun run dev
```

Checks:

```bash
bun run typecheck
bun test
```

## How changes ship

Branch off `release`, PR into `release`, add a changeset for anything users would notice. Merging
`release` into `main` versions, tags and releases automatically. Major versions are launches, not
bumps. See [CONTRIBUTING.md](CONTRIBUTING.md) and [launches/README.md](launches/README.md).
