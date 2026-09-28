import { useEffect, useState } from "react";
import {
  AudioLines,
  Check,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { stories, type Story } from "@/lib/stories";

function Mosaic({
  story,
  sceneIndex,
  expanded = false,
}: {
  story: Story;
  sceneIndex: number;
  expanded?: boolean;
}) {
  const lead = story.scenes[sceneIndex]!.lead;
  const order = [lead, (lead + 1) % 3, (lead + 2) % 3];
  return (
    <div
      className={cn(
        "grid grid-cols-[1.55fr_1fr] grid-rows-2 gap-2 overflow-hidden rounded-lg",
        expanded
          ? "h-[60vh]"
          : "h-[340px] sm:h-[520px] lg:h-[clamp(380px,37vw,760px)]",
      )}
      aria-label={`${story.name} visual mosaic`}
    >
      {order.map((index, slot) => {
        const photo = story.images[index]!;
        return (
          <div
            key={`${story.id}-${index}-${slot}`}
            className={cn(
              "relative overflow-hidden bg-muted motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700",
              slot === 0 && "row-span-2",
            )}
          >
            <img
              src={`/images/${photo.file}.webp`}
              alt={photo.alt}
              className="h-full w-full object-cover"
              loading={story.id === "wild" ? "eager" : "lazy"}
              fetchPriority={
                story.id === "wild" && slot === 0 ? "high" : "auto"
              }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 sm:p-5">
              <span className="text-[10px] font-medium tracking-wide text-white/85 sm:text-xs">
                {photo.label}
              </span>
              {slot === 0 && (
                <Badge
                  className="hidden border-white/25 bg-black/25 text-[10px] text-white backdrop-blur-md sm:inline-flex"
                  variant="outline"
                >
                  <Check className="size-3" /> Matched to your story
                </Badge>
              )}
            </div>
            {slot === 0 && (
              <div className="absolute top-5 left-5 sm:top-7 sm:left-7">
                <p className="text-[9px] font-medium tracking-[0.23em] text-white/75 uppercase sm:text-[10px]">
                  {story.eyebrow}
                </p>
                <p className="mt-3 max-w-60 text-3xl leading-tight font-medium tracking-tight text-white sm:text-5xl">
                  {story.name}
                  <span className="text-primary">.</span>
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MosaicDemo() {
  const [storyId, setStoryId] = useState("wild");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const story = stories.find((item) => item.id === storyId)!;
  const scene = story.scenes[sceneIndex]!;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setSceneIndex((current) => (current + 1) % 3),
      5500,
    );
    return () => window.clearInterval(timer);
  }, [playing, storyId]);
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () =>
      document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  function selectStory(id: string) {
    setStoryId(id);
    setSceneIndex(0);
  }

  return (
    <section
      id="frame"
      aria-label="Illustrated frame walkthrough"
      className="min-w-0"
    >
      <div className="mb-4 flex items-center justify-between gap-3 text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" /> The frame
          follows the thought
        </span>
        <span className="hidden sm:block">FRAME / 001</span>
      </div>
      <Card className="gap-0 overflow-hidden rounded-lg border-white/15 bg-[#181d19] py-0 shadow-2xl shadow-black/40">
        <Tabs value={storyId} onValueChange={selectStory} className="gap-0">
          <div className="flex flex-col gap-3 border-b px-3 py-3 2xl:flex-row 2xl:items-center 2xl:justify-between sm:px-5">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <AudioLines className="size-4 text-primary" /> An echoframe{" "}
              <Badge
                variant="outline"
                className="ml-1 rounded-sm text-[9px] font-normal text-muted-foreground"
              >
                WALKTHROUGH
              </Badge>
            </div>
            <TabsList
              aria-label="Choose a sample story"
              className="w-full bg-black/20 2xl:w-auto"
            >
              {stories.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="px-2.5 text-[11px] sm:px-4"
                >
                  {item.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {stories.map((item) => (
            <TabsContent
              key={item.id}
              value={item.id}
              className="m-0 p-2 sm:p-3"
            >
              <Mosaic story={item} sceneIndex={sceneIndex} />
            </TabsContent>
          ))}
        </Tabs>
        <div className="flex flex-col gap-5 px-5 pt-4 pb-5 sm:flex-row sm:items-center sm:gap-6 sm:px-7 sm:pt-5 sm:pb-6">
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:gap-1.5">
            <AudioLines
              className={cn(
                "size-7 text-primary",
                playing && "motion-safe:animate-pulse",
              )}
            />
            <span className="text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
              Example transcript
            </span>
          </div>
          <div
            className="min-w-0 flex-1"
            aria-live={playing ? "off" : "polite"}
          >
            <p className="min-h-14 text-sm leading-relaxed text-foreground/90 sm:text-base">
              “{scene.text}”
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Sparkles className="mr-1 size-3 text-primary" />
              {scene.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded text-[10px] font-normal text-primary/90"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Restart walkthrough"
                    onClick={() => {
                      setSceneIndex(0);
                      setPlaying(false);
                    }}
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Restart walkthrough</TooltipContent>
              </Tooltip>
              <Button
                size="icon"
                className="rounded-full"
                aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
                onClick={() => {
                  setPlaying(!playing);
                }}
              >
                {playing ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
              </Button>
              <Dialog
                onOpenChange={(open) => {
                  if (open) setPlaying(false);
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Expand mosaic"
                      >
                        <Maximize2 className="size-3.5" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Expand mosaic</TooltipContent>
                </Tooltip>
                <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-6xl overflow-y-auto bg-background sm:max-w-6xl">
                  <DialogHeader>
                    <DialogTitle>{story.name}</DialogTitle>
                    <DialogDescription>
                      An illustrated frame sequence using example assets and a
                      sample transcript.
                    </DialogDescription>
                  </DialogHeader>
                  <Mosaic story={story} sceneIndex={sceneIndex} expanded />
                  <p className="text-sm text-muted-foreground">
                    “{scene.text}”
                  </p>
                </DialogContent>
              </Dialog>
            </div>
            <span className="text-[10px] tracking-wider text-muted-foreground">
              0{sceneIndex + 1} <span className="text-white/25">/</span> 03
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t bg-black/10 px-5 py-3 text-[10px] text-muted-foreground sm:px-7">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "size-1.5 rounded-full",
                playing ? "bg-primary" : "bg-muted-foreground",
              )}
            />
            {playing
              ? "Playing walkthrough"
              : "Illustrated sequence · press play"}
          </span>
          <span className="hidden sm:inline">
            Recent context → matching assets → composition
          </span>
        </div>
      </Card>
      <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-[1fr_auto]">
        <p className="text-xs leading-6 text-muted-foreground">
          An example of a changing frame. Select a story and follow its
          transcript through the composition.
        </p>
        <Button
          asChild
          variant="link"
          className="h-auto justify-start self-start p-0 text-xs text-primary"
        >
          <a href="#session">Live demo: Jev key required ↗</a>
        </Button>
      </div>
    </section>
  );
}
