# echoframe

For UI work, start with the [style guide and component map](docs/design/style-guide.md).
Agent entry instructions are in [AGENTS.md](AGENTS.md); contribution rules are in
[CONTRIBUTING.md](CONTRIBUTING.md).

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

The landing page explains the product through a full-width layout, an illustrated presentation walkthrough,
and interactive examples of relevance, recency, and continuity heuristics. The same authored talk is rendered in three modes: Presentation (composed slides), Backdrop
(one full-bleed visual), and Spatial (linked visual, explanation, and relationship panels). Mode
switches preserve the current thought. Playback advances through three scenes and stops at the end;
direct jumps between thoughts, previous/next, restart, and expanded-stage controls also work without playback. Spatial has a compact
layout for narrow containers. The walkthrough is separate from live presentation sessions.

The landing page also includes a pointer- and scroll-reactive WebGL field, scroll-linked typography,
a sticky desktop mode tour, and Motion transitions around the shadcn components. The hero walkthrough
plays once when it first enters view. A header control pauses visual effects; reduced-motion visitors
get static effects and no autoplay. Small screens show the mode examples inline instead of pinning a
large stage. The shader caps its resolution and draw rate, stops offscreen or in a hidden tab, and
falls back to a static gradient when WebGL is unavailable or its context is lost.

Live-session messaging explicitly requires the visitor's own Jev API key. The **Launch EchoFrame**
buttons intentionally have no action until the login flow is added. No credentials are collected,
no microphone is accessed, and no Jev calls are made by this page. Official links point to
[TypeSafe's key dashboard](https://console.typesafe.ai/keys) and
[Jev's quickstart](https://docs.typesafe.ai/introduction/quickstart).

Mode and scene content lives in `src/lib/presentation.ts`; renderers live in
`src/components/presentation-stage.tsx`. The forest/water-cycle example links its scientific
reference to USGS Water Science. UI components can be added with
`bunx shadcn add <component>`. Photo sources are listed in `public/images/README.md`.

## How changes ship

Branch off `release`, PR into `release`, add a changeset for anything users would notice. Merging
`release` into `main` versions, tags and releases automatically. Major versions are launches, not
bumps. See [CONTRIBUTING.md](CONTRIBUTING.md) and [launches/README.md](launches/README.md).
