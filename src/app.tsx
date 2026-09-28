import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  Check,
  FolderOpen,
  KeyRound,
  Layers3,
  Mic,
  MoveUpRight,
  ScanText,
  SlidersHorizontal,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FrameWalkthrough } from "@/components/frame-walkthrough";
import { version } from "../package.json";
import { AuroraField } from "@/components/effects/aurora-field";
import {
  EffectsToggle,
  Reveal,
  ScrollProgress,
  ThoughtRibbon,
  useEffects,
} from "@/components/effects/motion-system";
import { ScrollModeTour } from "@/components/scroll-mode-tour";
import { PresentationStage } from "@/components/presentation-stage";

// The login flow will be connected here. Deliberately inert for this landing-page PR.
function LaunchButton({ compact = false }: { compact?: boolean }) {
  return (
    <Button
      type="button"
      variant={compact ? "outline" : "default"}
      className={
        compact
          ? "h-9 rounded-full border-primary/25 px-3 text-[10px] sm:h-10 sm:px-4 sm:text-xs"
          : "h-12 rounded-full px-6 text-xs shadow-[0_0_30px_#caff851c] transition-transform hover:scale-[1.035] active:scale-[.98]"
      }
    >
      Launch EchoFrame <ArrowRight className="ml-2 size-4" />
    </Button>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <AudioLines
        className="size-6 text-primary max-[380px]:hidden"
        strokeWidth={2.5}
      />
      <span className="text-xl font-semibold tracking-[-0.07em]">
        echoframe<span className="text-primary">.</span>
      </span>
    </span>
  );
}

const rules = [
  {
    id: "relevance",
    label: "01 / Relevance",
    title: "Surface the idea, not every keyword.",
    description:
      "Your recent speech and tagged material identify the main thought. The selected mode decides whether that thought becomes a slide, a background, or a cluster of connected context.",
    transcript:
      "Look past the trees for a moment. A forest is a living water system, connecting the soil beneath our feet with the air above us.",
    tags: ["forest", "water cycle", "main idea"],
    mode: "presentation" as const,
    sceneIndex: 0,
    decision: "Give the main idea a clear hierarchy",
    detail:
      "In Presentation mode, one headline and one focal visual establish the point.",
  },
  {
    id: "recency",
    label: "02 / Recency",
    title: "Bring the explanation forward.",
    description:
      "As the speaker moves from a subject to a mechanism, the current explanation deserves more emphasis. Promote the relevant note or diagram while retaining the context that still helps.",
    transcript:
      "Roots take up water from the soil, and leaves release it into the air as vapor. That process is called transpiration.",
    tags: ["transpiration", "explanation", "shift focus"],
    mode: "spatial" as const,
    sceneIndex: 1,
    decision: "Promote the mechanism; retain the forest",
    detail:
      "In Spatial mode, the explanation moves into focus and the visual becomes supporting context.",
  },
  {
    id: "continuity",
    label: "03 / Continuity",
    title: "Sometimes the right move is to hold.",
    description:
      "A new sentence doesn’t always need a new composition. Let the speaker develop a thought, keep relevant context stable, and change the frame when the subject gives a reason to.",
    transcript:
      "Here’s the part we don’t see: roots take up water from the soil, and leaves release it into the air as vapor.",
    tags: ["same subject", "more detail", "hold background"],
    mode: "backdrop" as const,
    sceneIndex: 1,
    decision: "Keep the scene. Give the speaker space.",
    detail:
      "In Backdrop mode, the forest stays on screen as the speaker explains the process.",
  },
];

const faqs = [
  [
    "What do I need for a live demo?",
    "Your own Jev API key, a microphone, and your presentation material. Live demos and presentation sessions require a Jev key; API usage is billed to your TypeSafe account. The frame walkthrough on this page illustrates how a session flows.",
  ],
  [
    "What actually drives the frame?",
    "Your recent speech provides the context. EchoFrame combines that transcript with your tagged material and the selected presentation mode. Jev returns structured choices and scores; EchoFrame’s heuristics turn those signals into content selection, emphasis, and arrangement. Relevance, recency, and continuity guide what enters the frame, what stays, and what takes the lead.",
  ],
  [
    "Why use a rolling transcript window?",
    "The frame needs to follow the thought you are developing now. A rolling window gives the selection process recent context without treating every word in the entire talk as equally relevant. The window length is a tuning parameter, rather than a fixed presentation structure.",
  ],
  [
    "Can I change direction halfway through a presentation?",
    "That is the point. Follow a question, return to an earlier idea, or take an unexpected detour. Your library is a pool of material, not a sequence of slides. The current context and selection rules drive the composition.",
  ],
  [
    "How do the three modes differ?",
    "Presentation gives your talk the hierarchy of a keynote: a main idea, supporting visuals, and a composed slide. Backdrop uses one visual and keeps the stage clear. Spatial assembles connected images, explanations, and relationships around what you are saying. The mode guides the layout; your voice drives the content.",
  ],
];

export function App() {
  const { enabled } = useEffects();
  return (
    <TooltipProvider>
      <div className="overflow-x-clip">
        <ScrollProgress />
        <Button
          asChild
          className="fixed top-2 left-2 z-50 -translate-y-20 focus:translate-y-0"
        >
          <a href="#main">Skip to content</a>
        </Button>
        <header className="sticky top-0 z-40 flex min-h-20 w-full flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-background/70 px-5 py-4 backdrop-blur-xl sm:px-8 xl:px-12">
          <a
            href="#"
            aria-label="EchoFrame home"
            className="rounded-sm outline-ring focus-visible:outline-2"
          >
            <Brand />
          </a>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-1.5 sm:gap-7"
          >
            <Button
              asChild
              variant="link"
              className="hidden text-xs text-muted-foreground sm:inline-flex"
            >
              <a href="#heuristics">The engine</a>
            </Button>
            <Button
              asChild
              variant="link"
              className="hidden text-xs text-muted-foreground sm:inline-flex"
            >
              <a href="#questions">Questions</a>
            </Button>
            <EffectsToggle />
            <LaunchButton compact />
          </nav>
        </header>

        <main id="main">
          <section
            aria-labelledby="hero-heading"
            className="relative isolate grid w-full lg:grid-cols-[0.9fr_1.1fr]"
          >
            <AuroraField />
            <div className="flex min-w-0 flex-col justify-between px-5 pt-12 pb-10 sm:px-8 sm:pt-16 lg:pt-14 xl:px-12 xl:pt-20">
              <div>
                <Badge
                  variant="outline"
                  className="gap-2 rounded-full border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] tracking-[0.12em] text-primary"
                >
                  <span className="size-1.5 rounded-full bg-primary" />{" "}
                  VOICE-DRIVEN VISUAL STORYTELLING
                </Badge>
                <motion.h1
                  initial={
                    enabled
                      ? { opacity: 0, y: 35, filter: "blur(10px)" }
                      : false
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  id="hero-heading"
                  className="mt-8 text-[clamp(2.9rem,5.5vw,8rem)] leading-[1.02] font-medium tracking-[-0.065em]"
                >
                  Great stories don’t move in straight lines.
                  <br />
                  <span className="bg-gradient-to-r from-primary via-[#a7f5bf] to-[#66d7e6] bg-clip-text text-transparent">
                    Neither should your visuals.
                  </span>
                </motion.h1>
                <p className="mt-7 text-base leading-relaxed text-muted-foreground xl:text-lg">
                  A keynote, a quiet backdrop, or a spatial canvas of supporting
                  context. Your voice decides what comes next. Your mode decides
                  how it appears.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <LaunchButton />
                  <Button
                    asChild
                    variant="ghost"
                    className="h-12 rounded-full text-xs"
                  >
                    <a href="#heuristics">
                      Inside the engine <ArrowDown className="size-3.5" />
                    </a>
                  </Button>
                </div>
                <p className="mt-4 flex items-center gap-2 text-xs text-primary/85">
                  <KeyRound className="size-3.5 shrink-0" /> Live demos require
                  your own Jev API key.
                </p>
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-5 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                <span>For presenters & storytellers</span>
                <span className="flex items-center gap-2">
                  <AudioLines className="size-4 text-primary" /> Follow the
                  thought
                </span>
              </div>
            </div>
            <div className="relative min-w-0 p-3 pt-7 sm:p-6 sm:pt-8 xl:p-9 xl:pt-10">
              <FrameWalkthrough />
            </div>
          </section>

          <ThoughtRibbon />
          <ScrollModeTour />

          <Reveal
            id="heuristics"
            aria-labelledby="engine-heading"
            className="w-full scroll-mt-6"
          >
            <div className="grid border-b lg:grid-cols-[0.9fr_1.1fr]">
              <div className="px-5 pt-16 pb-8 sm:px-8 lg:py-20 xl:px-12">
                <p className="text-[10px] tracking-[0.2em] text-primary uppercase">
                  Inside the engine
                </p>
                <h2
                  id="engine-heading"
                  className="mt-5 text-4xl leading-[1.08] font-medium tracking-[-0.055em] sm:text-5xl xl:text-6xl"
                >
                  Your speech is the signal.
                  <br />
                  <span className="text-primary">
                    The heuristics give it shape.
                  </span>
                </h2>
              </div>
              <div className="flex flex-col justify-center px-5 pb-12 sm:px-8 lg:py-20 xl:px-12">
                <p className="text-base leading-8 text-muted-foreground">
                  EchoFrame listens to a rolling window of recent speech. That
                  context meets your tagged material, selected mode, and
                  selection rules. Jev evaluates small, specific questions
                  against that context. EchoFrame turns the resulting choices
                  and scores into the composition.
                </p>
                <p className="mt-4 text-sm leading-7 text-foreground/80">
                  The loop keeps running as you talk: understand the current
                  thought, select the material, update the composition.
                </p>
              </div>
            </div>
            <div className="grid border-b md:grid-cols-4">
              {[
                {
                  icon: Mic,
                  label: "01 / CAPTURE",
                  title: "Recent speech",
                  detail:
                    "A moving transcript window. Enough context to follow the thought.",
                },
                {
                  icon: FolderOpen,
                  label: "02 / RETRIEVE",
                  title: "Tagged library",
                  detail:
                    "Assets organized in folders, tagged on import, ready to match.",
                },
                {
                  icon: SlidersHorizontal,
                  label: "03 / SELECT",
                  title: "Heuristics + Jev",
                  detail:
                    "Score relevant material, select the main idea, and decide whether the context warrants a change.",
                },
                {
                  icon: Layers3,
                  label: "04 / COMPOSE",
                  title: "A living frame",
                  detail:
                    "Compose a slide, hold a background, or assemble connected context according to the selected mode.",
                },
              ].map(({ icon: Icon, label, title, detail }) => (
                <div
                  key={label}
                  className="min-w-0 border-b px-5 py-8 last:border-b-0 sm:px-8 md:border-r md:border-b-0 md:last:border-r-0 xl:px-12"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] tracking-widest text-muted-foreground">
                      {label}
                    </p>
                    <Icon className="size-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-5 text-xl font-medium tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-[0.6fr_1.4fr]">
              <div className="px-5 py-12 sm:px-8 lg:border-r lg:py-16 xl:px-12">
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 text-[10px] text-primary"
                >
                  THE SELECTION LOGIC
                </Badge>
                <h3 className="mt-5 text-3xl leading-tight tracking-[-0.04em] xl:text-4xl">
                  Rules for the frame.
                  <br />
                  Freedom for the speaker.
                </h3>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">
                  Choose what supports the current thought, how much context the
                  audience needs, and what deserves the focus. The same
                  selection logic composes differently in each mode.
                </p>
                <p className="mt-4 text-xs leading-6 text-muted-foreground">
                  Jev supplies typed decisions: Choice selects an option, Score
                  rates a candidate, and Noul evaluates a yes/no question.
                  EchoFrame owns the weights and update rules.
                </p>
                <Button
                  asChild
                  variant="link"
                  className="mt-3 h-auto justify-start p-0 text-xs text-primary"
                >
                  <a
                    href="https://docs.typesafe.ai/introduction"
                    target="_blank"
                    rel="noreferrer"
                  >
                    How Jev decisions work <MoveUpRight className="size-3.5" />
                  </a>
                </Button>
                <p className="mt-6 border-l border-primary/40 pl-4 text-xs leading-6 text-muted-foreground">
                  Explore three examples of how the rules guide a composition.
                </p>
              </div>
              <Tabs
                defaultValue="relevance"
                className="min-w-0 gap-0 px-5 py-8 sm:px-8 lg:py-16 xl:px-12"
              >
                <TabsList
                  aria-label="Explore selection heuristics"
                  className="mb-7 h-11 w-full justify-start rounded-none border-b bg-transparent p-0"
                >
                  <>
                    {rules.map((rule) => (
                      <TabsTrigger
                        key={rule.id}
                        value={rule.id}
                        className="min-w-0 rounded-none px-2 text-[10px] sm:px-5 sm:text-xs"
                      >
                        {rule.label}
                      </TabsTrigger>
                    ))}
                  </>
                </TabsList>
                {rules.map((rule) => (
                  <TabsContent key={rule.id} value={rule.id} className="mt-0">
                    <h4 className="text-xl font-medium tracking-tight sm:text-2xl">
                      {rule.title}
                    </h4>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {rule.description}
                    </p>
                    <div className="mt-7 grid gap-5 sm:grid-cols-[1.15fr_0.85fr]">
                      <Card className="min-w-0 gap-0 rounded-lg border-white/10 bg-card/60 py-0 shadow-none">
                        <CardContent className="p-5">
                          <p className="flex items-center gap-2 text-[10px] tracking-widest text-primary uppercase">
                            <ScanText className="size-3.5" /> Recent transcript
                            / example
                          </p>
                          <p className="mt-5 text-base leading-7">
                            “{rule.transcript}”
                          </p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {rule.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="rounded-sm text-[10px] font-normal text-primary"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <div className="min-w-0">
                        <PresentationStage
                          mode={rule.mode}
                          sceneIndex={rule.sceneIndex}
                        />
                        <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary">
                          <Check className="size-3.5 shrink-0" />
                          {rule.decision}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          {rule.detail}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </Reveal>

          <Reveal
            id="session"
            aria-labelledby="session-heading"
            className="grid scroll-mt-24 border-y bg-[radial-gradient(ellipse_at_0%_50%,#a4ed7b18,transparent_65%)] lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="px-5 py-14 sm:px-8 sm:py-20 xl:px-12">
              <p className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-primary uppercase">
                <KeyRound className="size-4" /> Bring your own key
              </p>
              <h2
                id="session-heading"
                className="mt-6 text-4xl leading-[1.08] font-medium tracking-[-0.055em] sm:text-5xl xl:text-7xl"
              >
                Your voice.
                <br />
                Your library.
                <br />
                <span className="text-primary">Your Jev key.</span>
              </h2>
              <p className="mt-7 text-base leading-8 text-foreground/75">
                Live demos and presentation sessions require your own Jev API
                key. Your key powers the selection and composition while you
                talk. API usage runs on your TypeSafe account.
              </p>
            </div>
            <div className="flex flex-col justify-center border-t px-5 py-10 sm:px-8 lg:border-t-0 lg:border-l lg:py-16 xl:px-12">
              <h3 className="text-[10px] tracking-[0.2em] text-primary uppercase">
                Your session starts with
              </h3>
              {[
                {
                  icon: KeyRound,
                  title: "A Jev API key",
                  body: "An active key from your TypeSafe account is required for the live demo.",
                },
                {
                  icon: FolderOpen,
                  title: "Your visual material",
                  body: "Folders of images, automatically tagged as you add them to your library.",
                },
                {
                  icon: Mic,
                  title: "Something worth saying",
                  body: "Microphone access in presentation mode. Recent speech drives the selection loop.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex gap-4 border-b border-white/10 py-6 last:border-0"
                >
                  <Icon
                    className="mt-1 size-5 shrink-0 text-primary"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h4 className="text-base font-medium">{title}</h4>
                    <p className="mt-2 text-sm leading-6 text-foreground/60">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
              <div className="mt-5 flex flex-wrap gap-3">
                <LaunchButton />
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-primary/25 px-5 text-xs"
                >
                  <a
                    href="https://console.typesafe.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get a Jev API key <MoveUpRight className="size-3.5" />
                  </a>
                </Button>
              </div>
              <Button
                asChild
                variant="link"
                className="mt-5 h-auto justify-start self-start p-0 text-xs text-primary"
              >
                <a
                  href="https://docs.typesafe.ai/introduction/quickstart"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the official Jev quickstart{" "}
                  <MoveUpRight className="size-3.5" />
                </a>
              </Button>
            </div>
          </Reveal>

          <Reveal
            id="questions"
            aria-labelledby="faq-heading"
            className="grid w-full gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20 lg:py-20 xl:px-12"
          >
            <div>
              <p className="text-[10px] tracking-[0.2em] text-primary uppercase">
                The practical details
              </p>
              <h2
                id="faq-heading"
                className="mt-5 text-4xl font-medium tracking-[-0.055em] sm:text-5xl"
              >
                Know your
                <br />
                instrument.
              </h2>
            </div>
            <Accordion type="single" collapsible>
              {faqs.map(([question, answer], index) => (
                <AccordionItem key={question} value={`question-${index}`}>
                  <AccordionTrigger className="py-5 text-sm font-medium hover:no-underline">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="pr-5 text-sm leading-7 text-muted-foreground">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>

          <Reveal
            aria-labelledby="closing-heading"
            className="flex flex-col justify-between gap-8 border-y px-5 py-14 sm:px-8 sm:py-20 md:flex-row md:items-end xl:px-12"
          >
            <h2
              id="closing-heading"
              className="text-5xl leading-[1.04] font-medium tracking-[-0.06em] sm:text-7xl xl:text-8xl"
            >
              Lose the line.
              <br />
              <span className="text-primary">Keep the story.</span>
            </h2>
            <div className="md:max-w-sm">
              <p className="text-sm leading-7 text-muted-foreground">
                An echoframe gives your story room to move.
                <br />
                Bring your material. Follow your voice.
              </p>
              <div className="mt-6">
                <LaunchButton />
              </div>
            </div>
          </Reveal>
        </main>
        <footer className="w-full px-5 py-8 sm:px-8 xl:px-12">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <Brand />
            <p className="text-xs text-muted-foreground">
              Your story sets the direction.
            </p>
            <Button
              asChild
              variant="link"
              className="h-auto justify-start p-0 text-xs text-muted-foreground"
            >
              <a href="#heuristics">
                Explore the engine <MoveUpRight className="size-3.5" />
              </a>
            </Button>
          </div>
          <Separator className="my-6" />
          <div className="flex items-center justify-between gap-4 text-[10px] text-muted-foreground">
            <span>© {new Date().getFullYear()} EchoFrame</span>
            <span>
              v{version} <span className="mx-2 text-white/20">/</span>{" "}
              Voice-driven visual storytelling
            </span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
