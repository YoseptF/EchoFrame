# EchoFrame style guide

This is the design contract for contributors and coding agents. Read it before changing UI,
copy, presentation layouts, or motion. Follow the user's current instructions when they change
the direction; update this guide alongside an intentional design change.

## Read this first

1. **Sell freedom to follow a thought.** The core line is “Great stories don’t move in straight
   lines. Neither should your visuals.” EchoFrame follows the speaker instead of constraining
   them to a predetermined slide sequence.
2. **Use the whole viewport.** Compose across the width with asymmetric regions. Do not restore
   a narrow, centered landing-page column with large unused side margins.
3. **Manrope only.** No handwritten, cursive, script, decorative serif, or italic display fonts.
   Create emphasis with scale, weight, color, and motion.
4. **Build UI with the existing shadcn components.** Use Tailwind and theme tokens to compose
   them. Do not create a parallel collection of custom buttons, tabs, cards, or dialogs.
5. **Demonstrate a presentation, not a photo gallery.** A frame has a point, hierarchy, and
   relevant supporting material. Three unrelated photos with titles are not an echoframe.
6. **Keep the three modes distinct.** Presentation is a composed keynote; Backdrop is a single
   supporting visual; Spatial is a changing information space with connected context.
7. **The page should feel alive.** Preserve the reactive light field, transitions, and
   scroll-driven mode tour. Do not flatten it into a static document or a stack of ruled tables.
8. **Motion must serve the story and respect the viewer.** Reuse the shared effects system;
   pause ambient work offscreen and in hidden tabs; honor reduced motion and the pause control.
9. **Speak about a product with confidence.** Explain the mechanism and value. Avoid “just an
   idea,” “a dream in progress,” “not available yet,” and similar copy that dismisses the product.
10. **Keep the commercial and implementation boundaries honest.** Live sessions require the
    visitor's own Jev API key. The page's authored walkthrough is an illustration. Launch buttons
    open the app at `/app`, where the library lives on the visitor's device.
11. **In the app, everything is shadcn.** Pages are compositions of `src/components/ui/`
    primitives. No hand-styled controls, panels, or form elements.

## What the experience should feel like

Cinematic, responsive, technically credible, and contemporary. A dark environment lets content
and light take the foreground. Large, clean type establishes the idea; a moving composition
proves it. The interface has depth without becoming a collection of floating decorations.

The Spatial reference is the feeling of a cinematic assistant assembling useful context while
someone speaks: an explanation gains prominence, related material stays nearby, and the layout
adapts. Take the information behavior from that reference, not film branding, fake telemetry,
unreadable technical ornament, or a copied movie interface.

| Preserve                                                        | Avoid                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Full-width sections and asymmetric desktop composition          | A centered `max-w-*` wrapper around the entire landing page                            |
| An authored thought with supporting evidence and clear emphasis | Random image collages with decorative titles                                           |
| Pointer-responsive light, transitions, and scroll-driven scenes | A printed brochure translated into HTML                                                |
| A coherent set of connected panels in Spatial                   | Arbitrary cards, pretend confidence percentages, or meaningless gauges                 |
| A quiet stage in Backdrop                                       | Captions, badges, or extra information inside the backdrop                             |
| Native document scrolling and responsive inline mobile sections | Scroll hijacking or shrinking a desktop dashboard until its labels are unreadable      |
| Product-specific technical explanations                         | Generic “AI magic,” fake testimonials, unsupported metrics, or apologetic concept copy |

## Find the right file

Paths below are relative to the repository root. These are the current implementation, not
suggested new files.

| Change                                                                             | Start here                                                                                                             | Responsibility                                                                                                          |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Page composition, navigation, hero, FAQs, session requirements, heuristic examples | [src/landing.tsx](../../src/landing.tsx)                                                                               | Composes the landing page; owns its `LaunchButton`, FAQ and rule content                                                |
| Wordmark and mode icons                                                            | [brand.tsx](../../src/components/brand.tsx), [mode-icons.ts](../../src/components/mode-icons.ts)                       | `Brand` and `modeIcons`, shared by the landing page and the app                                                         |
| App routes, sign-in, dashboard, folder, settings                                   | [src/app](../../src/app)                                                                                               | `routes.tsx` owns routing; `pages/` compose screens; `components/` holds app feature compositions                       |
| App data and local storage                                                         | [library-context.tsx](../../src/app/library-context.tsx), [src/lib/library](../../src/lib/library)                     | Signed-in profile, `useLibraryData`/`useLibraryAction` hooks; `Library` model on a `FileStore`                          |
| Folder import and export                                                           | [bundle.ts](../../src/lib/library/bundle.ts), [import-dialog.tsx](../../src/app/components/import-dialog.tsx)          | The [folder format](../folder-format.md); `ImportDialog` previews an import into a new or existing folder               |
| Jev requests                                                                       | [jev.ts](../../src/lib/jev.ts)                                                                                         | Typed client for the `/api/jev` relay and friendly error messages                                                       |
| Live session: what Jev is asked and how the frame decides                          | [echo.ts](../../src/lib/echo.ts), [speech.ts](../../src/lib/speech.ts)                                                 | Candidates, the one-request question set, heuristics, minimum hold; browser speech recognition and the speech window    |
| Live session screen and its frame                                                  | [live.tsx](../../src/app/pages/live.tsx), [echo-stage.tsx](../../src/app/components/echo-stage.tsx)                    | `LivePage` gates and controls; `useEchoSession` runs the ask loop; `EchoStage` renders the folder's material per mode   |
| Shared colors, fonts, radii, base styles                                           | [src/styles.css](../../src/styles.css)                                                                                 | Tailwind v4 theme tokens and reduced-motion CSS                                                                         |
| React mount, local font imports, effects provider                                  | [src/frontend.tsx](../../src/frontend.tsx)                                                                             | Manrope imports and the single top-level `EffectsProvider`                                                              |
| Browser title, description, social metadata, favicon reference                     | [src/index.html](../../src/index.html)                                                                                 | HTML entry and metadata; keep it consistent with page copy                                                              |
| Hero mode selection, playback, arbitrary thought jumps, transcript, expanded stage | [frame-walkthrough.tsx](../../src/components/frame-walkthrough.tsx)                                                    | `FrameWalkthrough` owns mode and scene state; starts in Spatial                                                         |
| How each mode actually looks                                                       | [presentation-stage.tsx](../../src/components/presentation-stage.tsx)                                                  | Shared `PresentationStage`; internal `Presentation`, `Backdrop`, `Spatial`, `SpatialCompact`, and `WaterPath` renderers |
| Mode descriptions and authored talk                                                | [presentation.ts](../../src/lib/presentation.ts)                                                                       | `modes`, `scenes`, `FrameMode`, `FrameScene`, and the example's `scienceSource`                                         |
| Scroll-driven comparison                                                           | [scroll-mode-tour.tsx](../../src/components/scroll-mode-tour.tsx)                                                      | `ScrollModeTour`; desktop sticky stage and inline mobile examples                                                       |
| Shared animation behavior                                                          | [motion-system.tsx](../../src/components/effects/motion-system.tsx)                                                    | Effects provider, pause control, reveal, tilt, scroll progress, text ribbon, and active-motion hook                     |
| Hero shader                                                                        | [aurora-field.tsx](../../src/components/effects/aurora-field.tsx)                                                      | `AuroraField`: GLSL, pointer/scroll response, scheduling, fallback, and resource cleanup                                |
| UI primitives                                                                      | [src/components/ui](../../src/components/ui)                                                                           | Official shadcn components; extend their composition rather than making duplicates                                      |
| Conditional Tailwind classes                                                       | [src/lib/utils.ts](../../src/lib/utils.ts)                                                                             | `cn(...)` merges classes for feature components                                                                         |
| shadcn generator settings                                                          | [components.json](../../components.json)                                                                               | `new-york`, React/TSX, neutral base, CSS variables, Lucide, `@/` aliases                                                |
| Bundled photography and attribution                                                | [public/images](../../public/images) and [source list](../../public/images/README.md)                                  | Local WebP images and their provenance                                                                                  |
| Build and serving                                                                  | [scripts/build.ts](../../scripts/build.ts), [src/index.ts](../../src/index.ts), [wrangler.jsonc](../../wrangler.jsonc) | Bun builds both entries; Cloudflare serves them; the Worker owns `/version`, `/api/jev`, and the `/app` fallback        |

### Which shadcn component to use

Import feature UI from `@/components/ui/<name>`. All of these are already installed.

| Need                                              | Use                                                                                 | Existing example                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Action, icon action, or styled navigation link    | `Button`; `asChild` for links                                                       | `LaunchButton` in `landing.tsx`; walkthrough controls         |
| Mode or heuristic selection                       | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                                    | Mode selector in `FrameWalkthrough`; rules in `landing.tsx`   |
| Related content, transcript, or information panel | `Card`, `CardContent` and other Card slots                                          | Transcript card; Spatial panels                               |
| Small state, topic, or category marker            | `Badge`                                                                             | Transcript tags and section eyebrows                          |
| Expanded stage or modal content                   | `Dialog` and its title/description/trigger slots                                    | Expanded presentation in `FrameWalkthrough`                   |
| Expandable questions                              | `Accordion` and its item/trigger/content slots                                      | FAQs in `landing.tsx`                                         |
| An intentional divider                            | `Separator`                                                                         | Footer                                                        |
| Help for an icon control                          | `Tooltip` with `TooltipTrigger asChild`                                             | Primitive is installed; `TooltipProvider` wraps the page      |
| App navigation shell                              | `Sidebar` family, `Breadcrumb`                                                      | `AppShell` and `PageHeader` in `app/components/app-shell.tsx` |
| Forms                                             | `Field` family, `Input`, `Textarea`, `InputGroup`, `Select`, `Slider`, `RadioGroup` | Settings, asset sheet, echo settings                          |
| Choice between described options                  | `RadioGroup` inside `FieldLabel` choice cards                                       | Mode choice in `EchoConfigForm`                               |
| Rows with media, text, and an action              | `Item` family                                                                       | Sign-in profiles, Jev key prompt                              |
| Nothing here yet, or a missing page               | `Empty` family                                                                      | Empty library, empty folder, not found                        |
| Menus and confirmations                           | `DropdownMenu`; `AlertDialog` via `ConfirmDialog`                                   | Folder card menu, deletes                                     |
| Side editor                                       | `Sheet`                                                                             | `AssetSheet`                                                  |
| Notifications                                     | `toast` from `sonner` with the `Toaster`                                            | Saves, uploads, key checks                                    |
| Loading placeholders                              | `Skeleton`, `Spinner`                                                               | Folder grid, sidebar, uploads                                 |

If a missing primitive is necessary, add the official component with
`bunx shadcn add <component>`, then inspect the generated files and lockfile. Do not install a
second UI kit. Use `lucide-react` for icons; avoid emoji as interface icons.

Semantic HTML, SVG diagrams, and canvas/WebGL are appropriate for document structure and
visualization. The shadcn rule means reuse its controls and surfaces, not replace a shader or a
relationship diagram with an inappropriate UI primitive. Use Tailwind for layout; custom GLSL
belongs in the effects component, not scattered through page JSX.

## Visual language

### Color and surfaces

[styles.css](../../src/styles.css) is the source of truth. Prefer its semantic utilities for
normal interface styling; change shared values there instead of adding near-duplicate colors.

| Token / utility              | Current value | Use                             |
| ---------------------------- | ------------- | ------------------------------- |
| `bg-background`              | `#080c0d`     | Page foundation                 |
| `text-foreground`            | `#f2f6ef`     | Main readable content           |
| `bg-card`                    | `#101817`     | Secondary surfaces              |
| `bg-primary`, `text-primary` | `#caff85`     | Main action and active emphasis |
| `text-primary-foreground`    | `#14201a`     | Text on filled primary controls |
| `text-muted-foreground`      | `#a2aaa3`     | Supporting copy                 |
| `border-border`              | `#ffffff18`   | Quiet structural edges          |
| `ring-ring`                  | Primary color | Visible keyboard focus          |
| `text-destructive`           | `#ff8f8f`     | Errors, when needed             |

The hero's lime-to-cyan text gradient and Spatial's cyan light belong to the established palette.
Presentation and Spatial also have deliberate local art colors in `presentation-stage.tsx`; they
are mode treatments, not a reason to hardcode new colors in ordinary controls.

Use low-opacity surfaces, thin borders, restrained backdrop blur, and selective glow to create
depth. Emphasize the active material. Do not outline every region, apply neon to all text, or put
an opaque box over every image. Primary controls should remain identifiable without a glow.

Current radius tokens: `sm` 6px, `md` 8px, `lg` 12px, `xl` 16px. Navigation pills and primary CTAs
can use `rounded-full`; frame panels can be tighter. Match the nearby component's role.

### Typography and spacing

- Use `font-sans` (Manrope), bundled in `frontend.tsx` at weights 400, 500, 600, and 700.
- Large headings use tight tracking, approximately `-0.045em` to `-0.065em`, and leading around
  `1.02`–`1.1`. Use `clamp(...)` or responsive type classes; never let large type cause overflow.
- Body copy generally uses `text-sm`/`text-base`, with `leading-7` or relaxed leading. Micro-labels
  are for secondary metadata, not essential explanations or main actions.
- Use lime or the existing lime/cyan gradient for emphasis. Do not introduce a second typeface
  or italicize display text to make it look “designed.”
- Standard page gutters are `px-5 sm:px-8 xl:px-12`; section spacing is commonly `py-12` through
  `py-20`, with larger desktop moments where the composition benefits.
- Full-width does not mean edge-to-edge body text. Constrain an individual paragraph when it
  improves reading, while using the rest of the section for a meaningful visual or interaction.

## The frame is the product

`PresentationStage` takes `mode`, `sceneIndex`, and an optional `className`. It reads the authored
scene from `presentation.ts`. Reuse it in walkthroughs, comparisons, and heuristic examples so
those views cannot quietly evolve into different products.

| Mode           | Composition contract                                                                                      | What changes with the speaker                                                |
| -------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `presentation` | A real keynote slide: one main idea, strong typography, a supporting visual or diagram, intentional space | The idea, visual hierarchy, and slide composition                            |
| `backdrop`     | One full-bleed image; no visible titles, tags, or panels inside the stage                                 | The selected background when the subject warrants it                         |
| `spatial`      | Connected visual, explanation, and relationship panels; hierarchy shows the current focus                 | Panel prominence, arrangement, and relevant material; useful context remains |

Keep content causally connected to the transcript. A diagram explains the thought; an image
supports it; a note supplies context. Do not add decorative charts or invented statistics to fill
space. The forest/water example is authored material with a linked USGS source, not live Jev output.

Preserve these interaction rules:

- Changing mode keeps the current thought, so visitors can compare treatments.
- Visitors can jump between thoughts in any order; linear playback is an optional walkthrough.
- Autoplay happens once on entering view when motion is enabled. Playback stops at the end,
  pauses when leaving view or hiding the tab, and can be replayed.
- Expanded-stage navigation and the transcript agree on the selected scene.
- A scene's `action` copy describes what the selected mode actually renders.

The current talk has three scenes. Renderer branches, chapter labels/counts, the scroll tour,
and heuristic examples contain corresponding assumptions. **Adding a fourth scene is not just
appending to `scenes`.** Audit those consumers. The `focus` string must be an exact substring of
`transcript`, and every scene needs an action for every mode. Adding a mode also requires its
renderer, walkthrough icon/controls, responsive treatment, and tour mapping.

## Motion and interaction

Use `motion/react` with the existing provider. Do not add GSAP, a second animation system, or
independent animation loops for effects already provided here.

| Existing building block | Use it for                             | Contract                                                                            |
| ----------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| `EffectsProvider`       | Global motion policy                   | Already mounted in `frontend.tsx`; keep one shared policy                           |
| `useEffects()`          | Finite transitions and pointer effects | `enabled` accounts for pause and system preference                                  |
| `useActiveMotion<T>()`  | Ambient or repeating work              | Attach its `ref`; `active` additionally checks visibility and viewport intersection |
| `EffectsToggle`         | The viewer's pause control             | Preserve the accessible state and reduced-motion behavior                           |
| `Reveal`                | A section entering view                | One-time reveal; do not nest many reveals around every word                         |
| `Tilt`                  | Subtle pointer depth on a frame        | Mouse-only spring motion; returns to rest; no touch requirement                     |
| `ThoughtRibbon`         | Typography reacting to scroll          | Native scroll-linked movement, with readable nondecorative copy                     |
| `ScrollModeTour`        | Scroll-led mode comparison             | Desktop pins a stage; mobile renders examples inline                                |
| `AuroraField`           | The hero's reactive light              | One decorative shader instance; static fallback; bounded render work                |

Existing timings are starting points: 0.3–0.75s for transitions, the reveal ease
`[0.22, 1, 0.36, 1]`, springs for panel movement and selection, and slow image drift. Match related
interactions instead of picking new timings for every component.

For repeating effects, `MotionConfig` alone is insufficient: it does not automatically stop all
opacity animations, timers, or WebGL work. Gate repeats with `active`, set inactive repeats to
zero, and cancel timers/RAF loops. Use refs or Motion values for pointer/frame updates instead of
setting React state every frame. Clean up observers, listeners, and graphics resources.

Preserve the shader's current ceilings: DPR at most 1.25, width at most 1400px (900px for coarse
pointers), height at most 900px, and draw-rate caps of 30/24fps. These are ceilings, not promised
frame rates. Do not multiply shader instances across the page. Test context loss and fallback
when changing the renderer.

Scrolling should reveal or transform meaningful content, not fight the viewer. Keep wheel/touch
scrolling native. No scroll snapping, forced scroll positions, fake loading screens, or required
pointer gestures for essential content. Retain a coherent static experience when effects are off.

## Desktop and mobile are separate compositions

Do not solve mobile by shrinking the entire desktop page or hiding overflowing content.

- Page grids normally split at `lg`; check the transition around 1024px.
- Presentation stages use **container width**, not viewport width. The named containers and
  `cqw` sizes in `presentation-stage.tsx` let the same stage work in a hero, modal, or small panel.
- Presentation and Backdrop are 16:10. Spatial is 16:10 at container widths of at least 540px,
  with a separate 4:5 compact composition below that width. Preserve this distinction.
- The tour's desktop sticky stage becomes inline examples below `lg`; do not pin a stage that
  consumes the whole phone screen.
- Allow wrapping in navigation and control groups; preserve labels, focus rings, and usable
  targets. Put explanatory copy outside a tiny preview when necessary.
- Verify 320, 390, 768, 1024, 1440, and 1920px. A page-level overflow clip is not evidence that
  content fits; inspect the actual layout and control bounds.

## Copy and product boundaries

Lead with freedom, then explain the mechanism: a rolling speech window, tagged material,
selection heuristics, Jev decisions, and a mode-specific composition. Describe relevance,
recency, and continuity in terms of what the audience sees.

Use confident, concrete language. Examples: “Your voice decides what comes next” and “Keep the
scene. Give the speaker space.” Avoid apologetic availability FAQs, vague AI superlatives,
funding complaints, and language that makes the product sound like a discarded idea.

Live sessions require the visitor's **own Jev API key**. Keep that requirement visible near the
launch action and in session setup. Jev is TypeSafe's decision model; preserve the verified
[documentation](https://docs.typesafe.ai/introduction) and
[key dashboard](https://console.typesafe.ai/keys) links unless their official destinations change.
Do not imply that Jev generates image pixels or that this landing-page walkthrough runs live AI.

`LaunchButton` links to `/app`. The walkthrough label explains the example without turning the
entire page into a disclaimer. Do not collect API keys or microphone permissions as decoration.

## The app

The app shares the tokens, Manrope, and shadcn primitives with the landing page, but it is a work
surface: quieter, denser, and built entirely from `src/components/ui/`. The sign-in screen may use
`AuroraField` (it must sit inside a `<section>`, which the shader uses for pointer tracking);
signed-in pages do not run ambient effects.

- **Local first, and say so.** Sign-in is Google, but folders and assets live in the browser's
  private file system. Copy may say files stay on this device; never imply cloud sync or backup.
  Say it once where it matters, not as a slogan on every screen.
- **Words drive matching.** Jev reads descriptions and tags, not pixels. Keep the "needs a
  description" prompts visible for media, and never imply Jev sees images.
- **Live sessions follow the frame contract.** `EchoStage` renders the folder's own material with
  the same mode rules and art treatment as `PresentationStage`: Presentation is a slide built from
  the focus item, Backdrop shows one image and never text, Spatial keeps retained and connected
  items around the focus. Jev decides _which_ material; code decides _when_: only on a change of
  subject, after the minimum hold, and never because another item edged ahead mid-thought. The
  stage is for an audience: it shows titles, imagery, and at most one short sentence of a note,
  never the descriptions written for Jev. Posters and covers are shown whole (`contain` over a
  blurred copy), not cropped. The stage stays still between changes; context around the focus is
  chosen when the focus changes, and a change is a single crossfade with no layout or scale
  animation of panels. Match percentages in the side panel are Jev's real probabilities, never
  decoration. The microphone starts only from "Start listening", and typing a line works
  everywhere as the fallback.
- **Keys stay the user's.** The Jev key is stored in the profile and sent only through the
  `/api/jev` relay. Check a key before saving it and explain failures in plain words.
- **Page anatomy.** Every signed-in page starts with `PageHeader` (sidebar trigger, breadcrumb,
  actions), then a large heading, using the standard page gutters. Destructive actions go through
  `ConfirmDialog`. Results are reported with a toast.
- **Mobile.** The sidebar becomes a sheet that closes after navigation; grids collapse to one
  column; toolbars wrap.

## Recipes

### Add a normal landing section

Use the existing reveal and shadcn building blocks. This example belongs under the existing
provider; it does not introduce a new layout system or a second provider.

```tsx
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/effects/motion-system";

export function SessionSection() {
  return (
    <Reveal
      aria-labelledby="session-detail-heading"
      className="grid gap-8 px-5 py-16 sm:px-8 lg:grid-cols-2 xl:px-12"
    >
      <h2 id="session-detail-heading" className="text-4xl tracking-[-0.05em]">
        Follow the thought.
      </h2>
      <div>
        <p className="text-base leading-7 text-muted-foreground">
          Let relevant material come forward as the conversation changes.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <a href="#frame">
            Explore the frame <ArrowRight />
          </a>
        </Button>
      </div>
    </Reveal>
  );
}
```

### Add an ambient accent

Keep it decorative, local, and pausable. Use this pattern only where an existing effect does
not already do the job.

```tsx
import { motion } from "motion/react";
import { useActiveMotion } from "@/components/effects/motion-system";

export function ActivityAccent() {
  const { ref, active } = useActiveMotion<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden="true">
      <motion.div
        className="size-2 rounded-full bg-primary"
        animate={{ opacity: active ? [0.4, 1, 0.4] : 0.6 }}
        transition={{ duration: active ? 3 : 0, repeat: active ? Infinity : 0 }}
      />
    </div>
  );
}
```

For a content edit, change the source data rather than copying the renderer. For a new control,
look for a shadcn primitive first. For a global color adjustment, change a token. For a new motion
behavior, start with the effects table above. Keep feature compositions in `src/components/`,
effects in `src/components/effects/`, and generic primitives in `src/components/ui/`.

## Definition of done for visual changes

1. Read this guide and inspect the named components before editing. Preserve the current Bun,
   React, Tailwind, Motion, and Cloudflare setup; do not scaffold a replacement app.
2. Run `bun run typecheck`, `bun run build`, and `bun test` for code changes. Run the local page
   with `bun run dev`. Follow [CONTRIBUTING.md](../../CONTRIBUTING.md) for commits, changesets,
   and PRs into `release`; a docs-only change does not need a UI changeset or new UI tests.
3. Inspect actual desktop and mobile browser renders. For motion changes, also watch the page
   over time, move the pointer, and scroll through the tour in both directions. A still image
   cannot prove an animation works.
4. Check keyboard mode selection, arbitrary thought jumps, expanded-stage navigation, and
   existing interactions affected by the edit. Keep Backdrop free of overlay text.
5. Test pause/resume and reduced motion. For shader changes, verify no ongoing draws while
   paused/offscreen/hidden, fallback without WebGL, and context-loss recovery.
6. Put screenshots, recordings, and all other scratch artifacts in `tmp/`. Use a fresh browser
   context for animation checks if earlier tests installed a fake clock: a shifted performance
   clock can disagree with the Web Animations timeline and make healthy animations appear stuck.
7. Verify the PR preview is built from the current commit before claiming hosted behavior works.
   Use a cache-busting revision query if the preview alias is serving a cached document.
8. Report what changed and what was verified. If components move or a design rule intentionally
   changes, update this guide and its links in the same PR.
