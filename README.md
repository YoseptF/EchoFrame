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
bun run build
bun test
```

## Landing page

The React page uses official shadcn/ui components, Tailwind tokens, and locally bundled fonts and
photographs. `bun run dev` builds the frontend and serves it through Wrangler; edits to `src/` or
`public/` trigger a rebuild. `bun run build` creates `dist/` using Bun's HTML bundler and Tailwind
plugin. Wrangler runs that build automatically for previews and deployments, then serves the
output through Workers Static Assets. `/version` continues to return the running package version.

The interactive concept has three scripted stories, play/pause/reset controls, an expanded mosaic,
and local keyword matching for a typed line. It does not record audio, call an AI API, upload text,
or persist input. Story content and sample tags live in `src/lib/stories.ts`; UI components can be
added with `bunx shadcn add <component>`. Photo sources are listed in `public/images/README.md`.

## How changes ship

Branch off `release`, PR into `release`, add a changeset for anything users would notice. Merging
`release` into `main` versions, tags and releases automatically. Major versions are launches, not
bumps. See [CONTRIBUTING.md](CONTRIBUTING.md) and [launches/README.md](launches/README.md).
