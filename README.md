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

The landing page explains the product through a full-width layout, an illustrated frame walkthrough,
and interactive examples of relevance, recency, and continuity heuristics. The walkthrough uses
scripted transcripts and bundled images; it is separate from live presentation sessions.

Live-session messaging explicitly requires the visitor's own Jev API key. The **Launch EchoFrame**
buttons intentionally have no action until the login flow is added. No credentials are collected,
no microphone is accessed, and no Jev calls are made by this page. Official links point to
[TypeSafe's key dashboard](https://console.typesafe.ai/keys) and
[Jev's quickstart](https://docs.typesafe.ai/introduction/quickstart).

Story content lives in `src/lib/stories.ts`; UI components can be added with
`bunx shadcn add <component>`. Photo sources are listed in `public/images/README.md`.

## How changes ship

Branch off `release`, PR into `release`, add a changeset for anything users would notice. Merging
`release` into `main` versions, tags and releases automatically. Major versions are launches, not
bumps. See [CONTRIBUTING.md](CONTRIBUTING.md) and [launches/README.md](launches/README.md).
