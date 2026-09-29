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
buttons open the app at `/app`. The landing page itself collects no credentials, accesses no
microphone, and makes no Jev calls. Official links point to
[TypeSafe's key dashboard](https://console.typesafe.ai/keys) and
[Jev's quickstart](https://docs.typesafe.ai/introduction/quickstart).

Mode and scene content lives in `src/lib/presentation.ts`; renderers live in
`src/components/presentation-stage.tsx`. The forest/water-cycle example links its scientific
reference to USGS Water Science. UI components can be added with
`bunx shadcn add <component>`. Photo sources are listed in `public/images/README.md`.

## The app

`/app` is a second Bun HTML entry (`src/app/index.html`) sharing chunks with the landing page. The
Worker serves the app shell for every `/app/*` address so deep links work; routing is client-side
with `wouter`.

The app is local-first. There is no database:

- **Sign-in** is Google. The Worker runs the OAuth code flow (`src/auth.ts`) and keeps the result
  in a signed, HttpOnly session cookie; `/api/session` reports who is signed in. Each Google
  account gets its own library on the device, and the last account is cached so the library still
  opens offline.
- **Storage** is the browser's Origin Private File System, laid out as real folders and files
  (`src/lib/library/library.ts` documents the layout). `FileStore` in `src/lib/library/store.ts`
  is the seam an installed app can implement against the real disk; tests use the in-memory store.
- **Folders** hold image, audio, and text assets. Each asset has a description and tags; Jev
  matches speech against words, so media without a description is flagged.
- **Import and export** use the [folder format](docs/folder-format.md): an `echoframe.json`
  manifest beside the files, as a directory or `.zip`. Agents and scripts can prepare a whole
  folder, descriptions and tags included, and the app imports it as a new folder (dashboard) or
  into an existing one (folder page, or drop the `.zip`). Export writes the same format, which
  doubles as a backup (`src/lib/library/bundle.ts`).
- **Echo settings** per folder: starting mode, speech window, minimum hold, the relevance,
  recency and continuity weights, and the speech language.
- **Live sessions** (`/app/folders/<id>/live`) listen with the browser's speech recognition, or
  take typed lines, and keep a rolling speech window. Each request asks Jev which described item
  fits the latest sentence and the broader thread (two Choice questions), whether anything fits
  (Noul), and whether the thought on screen continues (Noul). `src/lib/echo.ts` turns those
  answers into the frame with the folder's relevance, recency and continuity weights and minimum
  hold, and `EchoStage` renders it in Presentation, Backdrop or Spatial.
- **Jev** calls go to `POST /api/jev`. TypeSafe does not accept browser origins, so the Worker
  forwards the request with the user's own key and stores nothing. Only signed-in sessions can
  use the relay. Settings checks a key with one small request before saving it.

### Google sign-in setup

Create an OAuth client of type **Web application** in the Google Cloud console with these
authorized redirect URIs:

- `https://echoframe.yosept.me/auth/google/callback`
- `https://echoframe-staging.yosept.me/auth/google/callback`
- `http://localhost:8787/auth/google/callback`

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` as Worker secrets for
production and staging (`bunx wrangler secret put <NAME>` and `--env staging`). Locally, copy
`.dev.vars.example` to `.dev.vars`; `APP_ORIGIN` is needed there because `wrangler dev` reports
the production host. Without the Google values, sign-in shows as unavailable. PR preview URLs
can't be registered with Google, so previews sign in through staging: `SIGN_IN_ORIGIN` and
`PREVIEW_HOST` (staging `vars` in `wrangler.jsonc`) send a preview's sign-in to staging's
registered callback, and staging hands back a one-minute token bound to that preview's origin and
a nonce cookie the preview set. Only `https://pr-<n>-<PREVIEW_HOST>` origins are accepted.

`/privacy` and `/terms` (`src/components/legal.tsx`) are rendered to static HTML during the build.
Google requires the privacy policy URL before the OAuth app can be published. Keep both pages true
to what the code does when data handling changes.

## How changes ship

Branch off `release`, PR into `release`, add a changeset for anything users would notice. Merging
`release` into `main` versions, tags and releases automatically. Major versions are launches, not
bumps. See [CONTRIBUTING.md](CONTRIBUTING.md) and [launches/README.md](launches/README.md).
