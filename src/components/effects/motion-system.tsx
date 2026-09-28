import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const EffectsContext = createContext({
  enabled: false,
  reduced: false,
  paused: false,
  toggle: () => {},
});

export function EffectsProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const enabled = !paused && reduced === false;
  return (
    <EffectsContext.Provider
      value={{
        enabled,
        reduced: !!reduced,
        paused,
        toggle: () => setPaused((value) => !value),
      }}
    >
      <MotionConfig reducedMotion={enabled ? "user" : "always"}>
        {children}
      </MotionConfig>
    </EffectsContext.Provider>
  );
}
export const useEffects = () => useContext(EffectsContext);

export function EffectsToggle() {
  const { enabled, reduced, toggle } = useEffects();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 rounded-full text-muted-foreground sm:size-9"
      onClick={toggle}
      disabled={reduced}
      aria-label={
        reduced
          ? "Visual effects reduced by system preference"
          : enabled
            ? "Pause visual effects"
            : "Resume visual effects"
      }
      aria-pressed={!enabled}
      title={enabled ? "Pause visual effects" : "Resume visual effects"}
    >
      {enabled ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
    </Button>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-primary via-cyan-300 to-primary"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

export function Reveal(props: HTMLMotionProps<"section">) {
  const { enabled } = useEffects();
  return (
    <motion.section
      initial={enabled ? { opacity: 0, y: 40 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}

export function Tilt({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { enabled } = useEffects();
  const x = useSpring(0, { stiffness: 120, damping: 22 });
  const y = useSpring(0, { stiffness: 120, damping: 22 });
  useEffect(() => {
    if (!enabled) {
      x.set(0);
      y.set(0);
    }
  }, [enabled, x, y]);
  return (
    <motion.div
      className={className}
      style={{ rotateX: x, rotateY: y, transformPerspective: 1400 }}
      onPointerMove={(event) => {
        if (!enabled || event.pointerType !== "mouse") return;
        const r = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientY - r.top) / r.height - 0.5) * -4);
        y.set(((event.clientX - r.left) / r.width - 0.5) * 5);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function ThoughtRibbon() {
  const ref = useRef<HTMLElement>(null);
  const { enabled } = useEffects();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["8%", "-22%"]);
  const back = useTransform(scrollYProgress, [0, 1], ["-24%", "3%"]);
  return (
    <section
      ref={ref}
      aria-label="The freedom to change direction"
      className="relative overflow-hidden border-y border-white/5 bg-[#0a100e] py-12 sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_50%,#caff8510,transparent_65%)]" />
      <motion.p
        aria-hidden="true"
        className="whitespace-nowrap text-[clamp(3rem,8vw,9rem)] leading-[1.1] font-semibold tracking-[-0.06em] text-primary"
        style={{ x: enabled ? x : 0 }}
      >
        Take the tangent. Follow the question.
      </motion.p>
      <motion.p
        aria-hidden="true"
        className="whitespace-nowrap text-[clamp(3rem,8vw,9rem)] leading-[1.1] font-semibold tracking-[-0.06em] text-white/15"
        style={{ x: enabled ? back : 0 }}
      >
        Go somewhere unexpected. Come back.
      </motion.p>
      <div className="relative mt-8 flex flex-col justify-between gap-4 px-5 sm:px-8 md:flex-row xl:px-12">
        <h2 className="text-sm font-medium">
          Take the tangent. Follow the question. Come back.
        </h2>
        <p className="max-w-lg text-sm leading-7 text-muted-foreground">
          Give your material a set of rules. Let the conversation decide the
          route.
        </p>
      </div>
    </section>
  );
}

export function useActiveMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const { enabled } = useEffects();
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return { ref, active: enabled && inView && visible };
}
