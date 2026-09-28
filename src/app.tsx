import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  FolderOpen,
  Frame,
  Layers3,
  Mic,
  Play,
  Sparkles,
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
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MosaicDemo } from "@/components/mosaic-demo";
import { version } from "../package.json";

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <AudioLines className="size-6 text-primary" strokeWidth={2.5} />
      <span className="text-xl font-semibold tracking-[-0.07em]">
        echoframe<span className="text-primary">.</span>
      </span>
    </span>
  );
}

const faqs = [
  [
    "Is EchoFrame available yet?",
    "Not yet. EchoFrame is an idea taking shape. This page is an interactive exploration of that idea: a visual backdrop that follows your story. The demo uses sample images and scripted narration, with local keyword matching when you type your own line.",
  ],
  [
    "What would I put in my library?",
    "The vision starts with your own images: photographs, references, illustrations, and the visual material behind your story. Organize them in folders, and EchoFrame would automatically tag them when you add them so they can surface at the right moment.",
  ],
  [
    "How would the app follow my voice?",
    "In presentation mode, the planned app would listen to your microphone and transcribe a recent window of speech. AI, guided by selection rules, would use that context to find relevant images in your library and arrange them into a changing mosaic. The timing and exact behavior are still being explored.",
  ],
  [
    "Does this demo record me or use AI?",
    "No. This preview never accesses your microphone and does not call an AI service. Sample stories use a scripted sequence. Your typed line is matched against a small set of tags in your browser; it is not uploaded or stored.",
  ],
  [
    "Would it generate images or use mine?",
    "The idea is to bring your existing visual library to life. EchoFrame would select and arrange images you have added, so the backdrop stays connected to your material and your story.",
  ],
];

export function App() {
  const [startSignal, setStartSignal] = useState(0);
  const startDemo = () => setStartSignal((value) => value + 1);
  return (
    <TooltipProvider>
      <div className="overflow-x-clip">
        <Button
          asChild
          className="fixed top-2 left-2 z-50 -translate-y-20 focus:translate-y-0"
        >
          <a href="#main">Skip to content</a>
        </Button>
        <header className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-10 lg:px-14">
          <a
            href="#"
            aria-label="EchoFrame home"
            className="rounded-sm outline-ring focus-visible:outline-2"
          >
            <Brand />
          </a>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-2 sm:gap-7"
          >
            <Button
              asChild
              variant="link"
              className="hidden text-xs font-normal text-muted-foreground sm:inline-flex"
            >
              <a href="#how-it-works">The idea</a>
            </Button>
            <Button
              asChild
              variant="link"
              className="hidden text-xs font-normal text-muted-foreground sm:inline-flex"
            >
              <a href="#questions">Questions</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-full border-white/20 bg-transparent px-4 text-xs"
            >
              <a href="#demo" onClick={startDemo}>
                Step inside <ArrowUpRight />
              </a>
            </Button>
          </nav>
        </header>

        <main id="main">
          <section
            aria-labelledby="hero-heading"
            className="relative mx-auto max-w-5xl px-5 pt-12 pb-14 text-center sm:pt-16 sm:pb-16 lg:pt-20"
          >
            <Badge
              variant="outline"
              className="gap-2 rounded-full border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-medium tracking-[0.09em] text-primary"
            >
              <span className="size-1.5 rounded-full bg-primary" /> AN IDEA FOR
              A MORE VISUAL WORLD
            </Badge>
            <h1
              id="hero-heading"
              className="mt-7 text-[clamp(3.1rem,7.5vw,6.4rem)] leading-[1.04] font-medium tracking-[-0.065em]"
            >
              You tell the story.
              <br />
              <span className="font-serif font-normal tracking-[-0.035em] text-primary italic">
                Let it surround you.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-lg text-sm leading-[1.85] text-muted-foreground sm:text-base">
              Imagine a backdrop that follows your voice. Your images,
              <br className="hidden sm:block" /> finding their moment. A living
              mosaic, shaped by your story.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full px-6 text-xs font-semibold shadow-lg shadow-primary/5"
              >
                <a href="#demo" onClick={startDemo}>
                  <Play className="size-3.5 fill-current" /> Try the concept{" "}
                  <ArrowRight className="ml-2 size-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 rounded-full text-xs text-muted-foreground"
              >
                <a href="#how-it-works">
                  Meet the idea <ArrowDown className="ml-1 size-3.5" />
                </a>
              </Button>
            </div>
            <p className="mt-4 text-[10px] tracking-wide text-muted-foreground/80">
              A little glimpse of the future. No signup needed.
            </p>
          </section>

          <MosaicDemo startSignal={startSignal} />

          <section
            className="mx-auto max-w-5xl px-6 pt-20 pb-20 text-center sm:pt-24 sm:pb-28"
            aria-label="Who EchoFrame is for"
          >
            <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              For the people who bring ideas to life
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-sm font-medium text-foreground/75 sm:gap-x-12 sm:text-base">
              <span>Storytellers</span>
              <span className="text-primary/35">✳</span>
              <span>Presenters</span>
              <span className="text-primary/35">✳</span>
              <span>Educators</span>
              <span className="hidden text-primary/35 sm:inline">✳</span>
              <span>Curious minds</span>
            </div>
          </section>

          <section
            id="how-it-works"
            aria-labelledby="how-heading"
            className="border-y bg-[#141915]"
          >
            <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.2em] text-primary uppercase">
                    The vision
                  </p>
                  <h2
                    id="how-heading"
                    className="mt-4 text-4xl leading-[1.12] font-medium tracking-[-0.055em] sm:text-5xl"
                  >
                    Less slide wrangling.
                    <br />
                    <span className="text-muted-foreground">
                      More storytelling.
                    </span>
                  </h2>
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  A simple idea: prepare your world, then stay in the moment.
                  Here’s how we imagine it working.
                </p>
              </div>
              <div className="mt-12 grid gap-4 md:grid-cols-3">
                <Card className="gap-0 border-white/10 bg-background/40 py-0 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex h-36 items-center justify-center">
                      <div className="relative w-48 rounded-lg border border-white/15 bg-card p-4 shadow-xl shadow-black/10">
                        <FolderOpen className="mb-3 size-6 text-primary" />
                        <div className="flex gap-1.5">
                          {["forest", "mountains", "waterfall"].map((name) => (
                            <img
                              key={name}
                              src={`/images/${name}.webp`}
                              alt=""
                              loading="lazy"
                              className="h-12 w-12 rounded object-cover"
                            />
                          ))}
                        </div>
                        <Badge
                          variant="secondary"
                          className="absolute -right-3 -bottom-3 gap-1 rounded-md border border-primary/20 bg-[#263429] px-2 py-1 text-[9px] text-primary"
                        >
                          <Sparkles className="size-2.5" /> Tagged automatically
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-7 text-[10px] tracking-widest text-primary/70">
                      01 / COLLECT
                    </p>
                    <h3 className="mt-3 text-lg font-medium tracking-tight">
                      Your world, in folders.
                    </h3>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Bring your images into one library. Automatic tags would
                      make every asset ready for its moment.
                    </p>
                  </CardContent>
                </Card>
                <Card className="gap-0 border-white/10 bg-background/40 py-0 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex h-36 items-center justify-center gap-4">
                      <AudioLines
                        className="size-12 text-primary/50"
                        strokeWidth={1}
                      />
                      <div className="flex size-20 items-center justify-center rounded-full border border-primary/20 bg-primary/5 ring-8 ring-primary/[0.025]">
                        <Mic
                          className="size-7 text-primary"
                          strokeWidth={1.5}
                        />
                      </div>
                      <AudioLines
                        className="size-12 text-primary/50"
                        strokeWidth={1}
                      />
                    </div>
                    <p className="mt-7 text-[10px] tracking-widest text-primary/70">
                      02 / SPEAK
                    </p>
                    <h3 className="mt-3 text-lg font-medium tracking-tight">
                      Follow your train of thought.
                    </h3>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Start presentation mode and talk naturally. Recent speech
                      would give the app context as your story unfolds.
                    </p>
                  </CardContent>
                </Card>
                <Card className="gap-0 border-white/10 bg-background/40 py-0 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex h-36 items-center justify-center">
                      <div className="grid h-28 w-48 grid-cols-[1.4fr_1fr] grid-rows-2 gap-1.5 rounded-lg border border-primary/20 bg-card p-1.5">
                        {["forest", "mountains", "waterfall"].map(
                          (name, index) => (
                            <img
                              key={name}
                              src={`/images/${name}.webp`}
                              alt=""
                              loading="lazy"
                              className={`h-full w-full rounded-sm object-cover ${index === 0 ? "row-span-2" : ""}`}
                            />
                          ),
                        )}
                      </div>
                    </div>
                    <p className="mt-7 text-[10px] tracking-widest text-primary/70">
                      03 / SURROUND
                    </p>
                    <h3 className="mt-3 text-lg font-medium tracking-tight">
                      Watch your story take shape.
                    </h3>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      AI would find the relevant images in your library and
                      compose a mosaic that moves with your words.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section
            className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-2 md:gap-20 md:py-32"
            aria-labelledby="story-heading"
          >
            <div className="relative overflow-hidden rounded-xl border border-white/10">
              <img
                src="/images/forest.webp"
                alt="Sunlight illuminating the forest floor"
                loading="lazy"
                className="aspect-[1.1] w-full object-cover brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute right-5 bottom-6 left-5 border-l border-primary/70 pl-4">
                <p className="text-[9px] tracking-[0.2em] text-primary uppercase">
                  In your element
                </p>
                <p className="mt-2 font-serif text-3xl text-white italic">
                  Make them feel like they’re there.
                </p>
              </div>
            </div>
            <div>
              <Badge
                variant="outline"
                className="rounded-full border-primary/20 px-3 py-1 text-[10px] text-primary"
              >
                <Frame className="mr-1 size-3" /> A backdrop. A feeling. A
                world.
              </Badge>
              <h2
                id="story-heading"
                className="mt-6 text-4xl leading-[1.15] font-medium tracking-[-0.055em] sm:text-5xl"
              >
                Great stories don’t
                <br />
                move in straight lines.
                <br />
                <span className="font-serif text-primary italic">
                  Neither should
                  <br className="hidden md:block" /> your visuals.
                </span>
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
                Take a detour. Follow a question. Go back to that one
                unforgettable moment. We imagine your visuals keeping up, while
                you stay connected to the people in front of you.
              </p>
              <div className="mt-7 flex items-center gap-3 text-xs text-foreground/80">
                <Layers3 className="size-4 text-primary" /> Your assets. Your
                narrative. Room to improvise.
              </div>
            </div>
          </section>

          <section
            id="questions"
            aria-labelledby="faq-heading"
            className="mx-auto grid max-w-6xl gap-8 border-t px-5 py-20 sm:px-8 sm:py-24 md:grid-cols-[0.8fr_1.2fr] md:gap-20"
          >
            <div>
              <p className="text-[10px] font-medium tracking-[0.2em] text-primary uppercase">
                Still taking shape
              </p>
              <h2
                id="faq-heading"
                className="mt-4 text-4xl font-medium tracking-[-0.055em]"
              >
                A few good
                <br />
                questions.
              </h2>
              <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
                A big idea, with plenty left to explore.
                <br />
                Here’s where things stand today.
              </p>
            </div>
            <Accordion type="single" collapsible>
              {faqs.map(([question, answer], index) => (
                <AccordionItem
                  key={question}
                  value={`question-${index}`}
                  className="border-white/10"
                >
                  <AccordionTrigger className="py-5 text-sm font-medium hover:no-underline">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="pr-5 text-sm leading-7 text-muted-foreground">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section
            className="border-y border-primary/10 bg-[#1b251d] px-5 py-20 text-center sm:py-24"
            aria-labelledby="closing-heading"
          >
            <AudioLines className="mx-auto size-8 text-primary" />
            <h2
              id="closing-heading"
              className="mt-6 text-4xl leading-tight font-medium tracking-[-0.055em] sm:text-6xl"
            >
              Every story has a world.
              <br />
              <span className="font-serif text-primary italic">
                Step into yours.
              </span>
            </h2>
            <p className="mt-5 text-sm text-muted-foreground">
              This is where EchoFrame begins. Come imagine it with us.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 h-12 rounded-full px-7 text-xs"
            >
              <a href="#demo" onClick={startDemo}>
                Explore the concept <ArrowRight className="ml-3 size-4" />
              </a>
            </Button>
          </section>
        </main>
        <footer className="mx-auto max-w-7xl px-5 py-9 sm:px-10 lg:px-14">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <Brand />
            <p className="text-xs text-muted-foreground">
              A dream in progress. A story worth telling.
            </p>
            <Button
              asChild
              variant="link"
              className="h-auto justify-start p-0 text-xs text-muted-foreground"
            >
              <a href="#how-it-works">
                Back to the idea <ArrowUpRight />
              </a>
            </Button>
          </div>
          <Separator className="my-7" />
          <div className="flex items-center justify-between gap-4 text-[10px] text-muted-foreground/80">
            <span>© {new Date().getFullYear()} EchoFrame</span>
            <span>
              Concept preview <span className="mx-2 text-white/20">/</span> v
              {version}
            </span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

function ArrowUpRight() {
  return <ArrowRight className="size-3.5 -rotate-45" />;
}
