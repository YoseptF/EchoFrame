# Working on EchoFrame

## Start here

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before repository or PR work.
- Before changing UI, copy, presentation frames, or motion, read the
  [style guide](docs/design/style-guide.md). Its component map points to the actual implementation.
- The user's current instructions take precedence when they change the design direction.

## Design constraints

- Use the full viewport with deliberate desktop and mobile compositions. Do not turn the landing
  page into a narrow centered column or a static brochure.
- Use Manrope. No handwritten/script fonts, decorative serifs, or italic display typography.
- Compose controls and surfaces from `src/components/ui/` (shadcn), styled with Tailwind and the
  tokens in `src/styles.css`. Reuse feature components before creating another implementation.
- Preserve the distinct Presentation, Backdrop, and Spatial modes. A frame communicates a thought;
  it is not a gallery of unrelated photos.
- Reuse `src/components/effects/motion-system.tsx` for motion policy. Keep reduced motion, the
  pause control, offscreen/hidden-tab suspension, and shader fallback working.
- Product copy is confident and specific. Live sessions require the visitor's own Jev API key.
  The landing walkthrough is authored and must not masquerade as a live integration. See the guide
  before changing those boundaries.
- The app at `/app` is local-first: folders and assets live in the browser's private file system
  behind `src/lib/library/`, one library per Google account. Sign-in is Google OAuth in the Worker
  (`src/auth.ts`) with a signed session cookie; there is no database. Jev calls go through the
  Worker's `/api/jev` relay, which requires a session, forwards the user's key and stores nothing.
- Verify visual changes in the browser on desktop and mobile, including actual scrolling and
  interaction. Put every scratch artifact in `tmp/`. `paseo script start dev` runs the dev server
  from `paseo.json`.

## Project workflow

- Use Bun. `bun run dev` runs Wrangler; `bun run build` bundles the frontend with Bun's HTML
  bundler. Preserve the existing Cloudflare Workers Static Assets setup; do not replace it with
  Vite or a new application scaffold.
- Code checks: `bun run typecheck`, `bun run build`, `bun test`.
- Branch from `release`, PR into `release`. Do not push directly to `release` or `main` or deploy
  from the laptop. Add a changeset for user-visible changes; never choose a major bump or edit a
  launch file unless asked. Documentation-only changes do not need a changeset.
- Stage explicit paths. Commit with one natural-language line, no type prefix, body, or trailers.
  Do not add tool attribution to commits, PRs, releases, code, or docs.
- Update the style guide when intentionally changing art direction, component ownership, or a
  documented interaction contract. Do not leave the next contributor with stale instructions.
