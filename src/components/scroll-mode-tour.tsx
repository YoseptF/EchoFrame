import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PresentationStage } from "@/components/presentation-stage";
import { Reveal, Tilt, useEffects } from "@/components/effects/motion-system";
import { modes } from "@/lib/presentation";
import { cn } from "@/lib/utils";

function ModeStep({
  index,
  onEnter,
}: {
  index: number;
  onEnter: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-30% 0px -40% 0px" });
  const { enabled } = useEffects();
  const mode = modes[index]!;
  useEffect(() => {
    if (inView) onEnter(index);
  }, [inView, index, onEnter]);
  return (
    <motion.div
      ref={ref}
      id={`mode-${mode.id}`}
      className="relative flex min-h-0 scroll-mt-28 flex-col justify-center border-t border-white/10 py-12 lg:min-h-[72vh] lg:border-t-0 lg:py-20"
      animate={{ opacity: enabled && !inView ? 0.35 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-5 right-0 text-[8rem] leading-none font-semibold tracking-[-0.09em] text-white/[0.025] lg:top-16"
      >
        0{index + 1}
      </span>
      <Badge
        variant="outline"
        className="w-fit rounded-full border-primary/25 px-3 py-1.5 text-[10px] tracking-[.12em] text-primary"
      >
        0{index + 1} / {mode.name.toUpperCase()}
      </Badge>
      <h3 className="relative mt-6 text-[clamp(2rem,3.1vw,4rem)] leading-[1.08] font-medium tracking-[-0.055em]">
        {mode.label}
      </h3>
      <p className="mt-6 text-sm leading-7 text-muted-foreground xl:text-base">
        {mode.description}
      </p>
      <p className="mt-7 flex items-start gap-3 text-xs leading-6 text-primary/80">
        <ArrowUpRight className="mt-1 size-4 shrink-0" />
        {mode.rule}
      </p>
      <div className="mt-8 lg:hidden">
        <PresentationStage mode={mode.id} sceneIndex={index === 2 ? 1 : 0} />
      </div>
    </motion.div>
  );
}

export function ScrollModeTour() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { enabled } = useEffects();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  return (
    <section
      ref={ref}
      id="modes"
      aria-labelledby="modes-heading"
      className="relative px-5 pt-16 sm:px-8 sm:pt-24 xl:px-12"
    >
      <Reveal className="flex flex-col justify-between gap-6 pb-10 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-primary uppercase">
            Find your frequency
          </p>
          <h2
            id="modes-heading"
            className="mt-5 text-4xl font-medium tracking-[-.055em] sm:text-6xl"
          >
            One voice.
            <br />
            <span className="text-muted-foreground">
              Three different energies.
            </span>
          </h2>
        </div>
        <p className="flex items-center gap-3 text-xs text-muted-foreground">
          <ArrowDown className="size-4 text-primary" /> Scroll to change the
          canvas
        </p>
      </Reveal>
      <div className="relative grid gap-8 lg:grid-cols-[.65fr_1.35fr] lg:gap-16 xl:gap-24">
        <div className="absolute inset-y-0 -left-3 hidden w-px bg-white/5 lg:block">
          <motion.div
            className="h-full w-full origin-top bg-primary/50"
            style={{ scaleY: scrollYProgress }}
          />
        </div>
        <div>
          {modes.map((mode, index) => (
            <ModeStep key={mode.id} index={index} onEnter={setActive} />
          ))}
        </div>
        <div className="relative hidden min-w-0 lg:block">
          <div className="sticky top-[18vh] pb-20">
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                A different kind of presence
              </span>
              <div className="flex gap-2">
                {modes.map((mode, index) => (
                  <Button
                    key={mode.id}
                    asChild
                    variant="ghost"
                    size="sm"
                    aria-label={`Scroll to ${mode.name} mode`}
                    className={cn(
                      "h-7 rounded-full px-3 text-[10px]",
                      active === index
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <a href={`#mode-${mode.id}`}>0{index + 1}</a>
                  </Button>
                ))}
              </div>
            </div>
            <Tilt className="relative">
              <motion.div
                aria-hidden="true"
                className="absolute -inset-5 -z-10 rounded-[2rem] blur-3xl"
                animate={{
                  backgroundColor:
                    active === 2
                      ? "#44c9cf19"
                      : active === 1
                        ? "#74ba3b18"
                        : "#caff8512",
                }}
              />
              <div className="overflow-hidden rounded-xl border border-white/15 bg-[#0b1111] p-2 shadow-[0_25px_90px_#0009]">
                <PresentationStage
                  mode={modes[active]!.id}
                  sceneIndex={active === 2 ? 1 : 0}
                />
              </div>
            </Tilt>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={enabled ? { opacity: 0, y: 14 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 flex items-center justify-between gap-4"
              >
                <p className="text-xs text-muted-foreground">
                  {modes[active]!.name}{" "}
                  <span className="mx-2 text-white/20">/</span> The living
                  forest
                </p>
                <span className="text-[10px] tracking-widest text-primary">
                  VOICE → CONTEXT → FRAME
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
