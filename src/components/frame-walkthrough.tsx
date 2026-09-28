import { motion } from "motion/react";
import { Tilt, useActiveMotion } from "@/components/effects/motion-system";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Image,
  Layers3,
  Maximize2,
  Pause,
  Play,
  Presentation,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PresentationStage } from "@/components/presentation-stage";
import { cn } from "@/lib/utils";
import {
  modes,
  scenes,
  scienceSource,
  type FrameMode,
} from "@/lib/presentation";

const modeIcons = {
  presentation: Presentation,
  backdrop: Image,
  spatial: Layers3,
};

export function FrameWalkthrough() {
  const [mode, setMode] = useState<FrameMode>("spatial");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { ref, active } = useActiveMotion<HTMLElement>();
  const started = useRef(false);
  useEffect(() => {
    if (active && !started.current) {
      started.current = true;
      setPlaying(true);
    } else if (!active) {
      setPlaying(false);
    }
  }, [active]);
  const scene = scenes[sceneIndex]!;
  const selectedMode = modes.find((item) => item.id === mode)!;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (sceneIndex === scenes.length - 1) setPlaying(false);
      else setSceneIndex((current) => current + 1);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [playing, sceneIndex]);
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () =>
      document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  function selectScene(index: number) {
    setSceneIndex(index);
    setPlaying(false);
  }
  function togglePlayback() {
    if (!playing && sceneIndex === scenes.length - 1) setSceneIndex(0);
    setPlaying((current) => !current);
  }
  const [before, after] = scene.transcript.split(scene.focus);

  return (
    <section
      ref={ref}
      id="frame"
      aria-label="Presentation mode walkthrough"
      className="@container/walkthrough min-w-0"
    >
      <div className="mb-4 flex items-center justify-between gap-3 text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" /> One talk. Three
          ways to frame it.
        </span>
        <span className="hidden sm:block">ECHOFRAME / MODES</span>
      </div>
      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as FrameMode)}
        className="gap-0"
      >
        <TabsList
          aria-label="Choose a presentation mode"
          className="relative mb-5 h-12 w-full rounded-full border border-white/10 bg-white/[0.035] p-1 backdrop-blur-lg"
        >
          {modes.map((item) => {
            const Icon = modeIcons[item.id];
            return (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="relative gap-1.5 rounded-full px-2 text-[10px] data-[state=active]:bg-transparent dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent sm:text-xs"
              >
                {mode === item.id && (
                  <motion.span
                    layoutId="walkthrough-mode"
                    className="absolute inset-0 rounded-full border border-primary/25 bg-primary/10 shadow-[0_0_20px_#caff8510]"
                    transition={{ type: "spring", stiffness: 350, damping: 32 }}
                  />
                )}
                <Icon className="relative size-3.5" />
                <span className="relative">{item.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent value={mode} className="m-0">
          <Tilt className="relative rounded-xl border border-white/15 bg-[#0b1211]/80 p-2 shadow-[0_20px_80px_#0008]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-cyan-300/5 blur-2xl"
            />
            <PresentationStage mode={mode} sceneIndex={sceneIndex} />
            <div className="absolute inset-x-2 bottom-1 h-px overflow-hidden bg-white/5">
              <motion.div
                key={`${sceneIndex}-${playing}`}
                className="h-full origin-left bg-gradient-to-r from-primary to-cyan-300"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: playing ? 1 : 0 }}
                transition={{ duration: playing ? 7 : 0, ease: "linear" }}
              />
            </div>
          </Tilt>
        </TabsContent>
      </Tabs>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous thought"
            disabled={sceneIndex === 0}
            onClick={() => selectScene(sceneIndex - 1)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            size="icon"
            className="rounded-full"
            aria-label={
              playing
                ? "Pause walkthrough"
                : sceneIndex === scenes.length - 1
                  ? "Replay walkthrough"
                  : "Play walkthrough"
            }
            onClick={togglePlayback}
          >
            {playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next thought"
            disabled={sceneIndex === scenes.length - 1}
            onClick={() => selectScene(sceneIndex + 1)}
          >
            <ArrowRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Restart walkthrough"
            onClick={() => selectScene(0)}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-wider text-muted-foreground">
            0{sceneIndex + 1} / 03
          </span>
          <Dialog
            onOpenChange={(open) => {
              if (open) setPlaying(false);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-white/15 bg-transparent text-[10px]"
                aria-label="Expand presentation"
              >
                <Maximize2 className="size-3.5" />
                <span className="hidden @min-[400px]/walkthrough:inline">
                  Open stage
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none overflow-y-auto bg-background p-3 sm:max-w-[min(96vw,1400px)] sm:p-5">
              <DialogHeader className="pr-7">
                <DialogTitle>
                  {selectedMode.name} / The living forest
                </DialogTitle>
                <DialogDescription>
                  {scene.cue} · Illustrated presentation sequence
                </DialogDescription>
              </DialogHeader>
              <div className="mx-auto w-full max-w-[min(100%,112vh)]">
                <PresentationStage mode={mode} sceneIndex={sceneIndex} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sceneIndex === 0}
                  onClick={() => selectScene(sceneIndex - 1)}
                >
                  <ArrowLeft /> Previous thought
                </Button>
                <span className="text-xs text-muted-foreground">
                  0{sceneIndex + 1} / 03
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sceneIndex === scenes.length - 1}
                  onClick={() => selectScene(sceneIndex + 1)}
                >
                  Next thought <ArrowRight />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Jump to a thought"
      >
        <span className="mr-1 text-[9px] tracking-widest text-muted-foreground uppercase">
          Jump anywhere
        </span>
        {scenes.map((item, index) => (
          <Button
            key={item.id}
            size="sm"
            variant={sceneIndex === index ? "secondary" : "ghost"}
            aria-pressed={sceneIndex === index}
            className="h-8 px-2.5 text-[10px]"
            onClick={() => selectScene(index)}
          >
            {["Big picture", "Mechanism", "Connections"][index]}
          </Button>
        ))}
      </div>

      <Card className="mt-5 gap-0 overflow-hidden rounded-xl border-white/10 bg-background/40 py-0 shadow-none backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <p className="flex items-center gap-2 text-[10px] tracking-widest text-muted-foreground uppercase">
            <AudioLines
              className={cn(
                "size-4 text-primary",
                playing && "motion-safe:animate-pulse",
              )}
            />{" "}
            Example narration
          </p>
          <span className="text-[10px] text-primary/75">{scene.cue}</span>
        </div>
        <div className="px-4 py-4" aria-live={playing ? "off" : "polite"}>
          <motion.p
            key={sceneIndex}
            initial={active ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm leading-7 text-muted-foreground"
          >
            “{before}
            <span className="text-foreground">{scene.focus}</span>
            {after}”
          </motion.p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {scene.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-sm text-[9px] font-normal text-primary"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="border-t px-4 py-3">
          <p className="text-[9px] tracking-widest text-primary uppercase">
            Composition decision
          </p>
          <p className="mt-1.5 text-xs leading-6 text-muted-foreground">
            {scene.action[mode]}
          </p>
        </div>
      </Card>
      <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 @min-[600px]/walkthrough:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[9px] tracking-[0.15em] text-primary uppercase">
            {selectedMode.name} mode
          </p>
          <h2 className="mt-2 text-base font-medium leading-snug tracking-tight">
            {selectedMode.label}
          </h2>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          {selectedMode.description}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <a
          href={scienceSource.url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-white/20 underline-offset-4 hover:text-foreground"
        >
          Example source: USGS Water Science
        </a>
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-[10px] text-primary"
        >
          <a href="#session">Live sessions require your Jev key ↗</a>
        </Button>
      </div>
    </section>
  );
}
