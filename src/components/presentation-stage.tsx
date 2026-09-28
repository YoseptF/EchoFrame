import { AnimatePresence, motion } from "motion/react";
import { useActiveMotion } from "@/components/effects/motion-system";
import {
  ArrowRight,
  ArrowUpRight,
  Cloud,
  Droplets,
  Leaf,
  ScanLine,
  Sprout,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { scenes, type FrameMode, type FrameScene } from "@/lib/presentation";

const MotionCard = motion.create(Card);

function WaterPath({
  vertical = false,
  compact = false,
}: {
  vertical?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex",
        vertical
          ? "flex-col gap-[2.5cqw]"
          : "items-center justify-between gap-[1.5cqw]",
      )}
      aria-label="Water pathway: soil to roots to leaves to atmosphere"
    >
      {[
        { label: "SOIL", icon: Droplets },
        { label: "ROOTS", icon: Sprout },
        { label: "LEAVES", icon: Leaf },
        { label: "AIR", icon: Cloud },
      ].map(({ label, icon: Icon }, index) => (
        <div
          key={label}
          className={cn(
            "flex",
            vertical
              ? "items-center gap-[2cqw]"
              : "min-w-0 flex-1 items-center gap-[1cqw]",
          )}
        >
          <div
            className={cn(
              "flex items-center",
              vertical ? "gap-[2cqw]" : "flex-col gap-[1cqw]",
            )}
          >
            <Icon
              strokeWidth={1.4}
              className={compact ? "size-[3.2cqw]" : "size-[5cqw]"}
            />
            <span
              className={cn(
                "font-medium tracking-[0.12em]",
                compact ? "text-[1.3cqw]" : "text-[1.5cqw]",
              )}
            >
              {label}
            </span>
          </div>
          {!vertical && index < 3 && (
            <ArrowRight
              strokeWidth={1}
              className="ml-auto size-[2cqw] shrink-0 opacity-40"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Presentation({
  scene,
  index,
  active,
}: {
  scene: FrameScene;
  index: number;
  active: boolean;
}) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-[#101110] text-[#f4f3ec]"
      data-renderer="presentation"
    >
      {index !== 1 && (
        <>
          <motion.img
            animate={active ? { scale: [1, 1.055] } : { scale: 1 }}
            transition={{
              duration: active ? 16 : 0,
              repeat: active ? Infinity : 0,
              repeatType: "reverse",
              ease: "linear",
            }}
            src={`/images/${scene.image}.webp`}
            alt={scene.alt}
            className={cn(
              "absolute inset-y-0 right-0 h-full object-cover",
              index === 0 ? "w-[48%]" : "w-full opacity-45",
            )}
          />
          <div
            className={cn(
              "absolute inset-0",
              index === 0
                ? "bg-gradient-to-r from-[#101110] via-[#101110]/70 to-transparent"
                : "bg-gradient-to-r from-[#101110]/80 via-[#101110]/40 to-transparent",
            )}
          />
        </>
      )}
      <div className="relative flex h-full flex-col p-[6cqw]">
        <div className="flex items-center justify-between text-[1.3cqw] font-medium tracking-[0.22em] text-white/60">
          <span>THE LIVING FOREST</span>
          <span>FIELD NOTES / 0{index + 1}</span>
        </div>
        {index === 0 && (
          <>
            <p className="mt-auto w-[76%] text-[7.3cqw] leading-[1.02] font-semibold tracking-[-0.065em]">
              The forest
              <br />
              is a{" "}
              <span className="text-[#d6eea3]">
                water
                <br />
                engine.
              </span>
            </p>
            <p className="mt-[3cqw] max-w-[54%] text-[1.85cqw] leading-relaxed text-white/65">
              A living connection between
              <br />
              the ground and the sky.
            </p>
          </>
        )}
        {index === 1 && (
          <>
            <div className="mt-[5cqw]">
              <p className="text-[5.1cqw] leading-[1.08] font-semibold tracking-[-0.055em]">
                The invisible part
                <br />
                of the journey.
              </p>
              <p className="mt-[1.5cqw] text-[1.65cqw] text-white/60">
                Water moves through plants and returns to the air.
              </p>
            </div>
            <div className="mt-auto border-y border-white/15 py-[4cqw] text-[#d6eea3]">
              <WaterPath />
            </div>
            <p className="mt-[2cqw] text-[1.35cqw] tracking-widest text-white/50">
              THIS PROCESS HAS A NAME:{" "}
              <span className="text-white">TRANSPIRATION</span>
            </p>
          </>
        )}
        {index === 2 && (
          <>
            <p className="mt-auto text-[7cqw] leading-[1.02] font-semibold tracking-[-0.06em]">
              From the ground.
              <br />
              <span className="text-[#d6eea3]">Back to the sky.</span>
            </p>
            <p className="mt-[3cqw] text-[1.85cqw] text-white/75">
              The trees. The water. The atmosphere.
              <br />
              One connected story.
            </p>
          </>
        )}
        <div className="mt-auto flex items-end justify-between pt-[4cqw]">
          <span className="h-[0.5cqw] w-[6cqw] bg-[#d6eea3]" />
          <span className="text-[1.15cqw] tracking-[0.12em] text-white/45">
            ECHOFRAME / PRESENTATION
          </span>
        </div>
      </div>
    </div>
  );
}

function Backdrop({ scene, active }: { scene: FrameScene; active: boolean }) {
  return (
    <div
      className="relative h-full overflow-hidden bg-[#101110]"
      data-renderer="backdrop"
    >
      <motion.img
        animate={active ? { scale: [1, 1.055] } : { scale: 1 }}
        transition={{
          duration: active ? 16 : 0,
          repeat: active ? Infinity : 0,
          repeatType: "reverse",
          ease: "linear",
        }}
        src={`/images/${scene.image}.webp`}
        alt={scene.alt}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
    </div>
  );
}

function SpatialCompact({
  scene,
  index,
}: {
  scene: FrameScene;
  index: number;
}) {
  const mechanism = index === 1;
  return (
    <div
      className="relative flex h-full flex-col gap-[4cqw] bg-[#071114] p-[5cqw] text-[#cdf2ee] @min-[540px]/stage:hidden"
      data-renderer="spatial-compact"
    >
      <div className="flex items-center justify-between border-b border-[#83d7d2]/25 pb-[3cqw]">
        <div>
          <p className="text-[2cqw] tracking-[0.12em] text-[#83d7d2]/65">
            CONTEXT SPACE / THE LIVING FOREST
          </p>
          <p className="mt-[1cqw] text-[6cqw] font-medium tracking-tight">
            {scene.contextTitle}
          </p>
        </div>
        <ScanLine className="size-[5cqw] text-[#83d7d2]/60" />
      </div>
      <Card
        className={cn(
          "relative min-h-0 flex-1 gap-0 overflow-hidden rounded-sm border-[#83d7d2]/30 bg-[#0b2025] py-0",
          mechanism && "order-2",
        )}
      >
        <img
          src={`/images/${scene.image}.webp`}
          alt={scene.alt}
          className="h-full min-h-0 w-full object-cover brightness-75 saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071114] to-transparent" />
        <p className="absolute bottom-[3cqw] left-[3cqw] text-[2cqw] tracking-widest text-[#cdf2ee]">
          {mechanism
            ? "RETAINED CONTEXT / FOREST"
            : "FOCAL MATERIAL / WATER SYSTEM"}
        </p>
        <div
          aria-hidden="true"
          className="absolute inset-[10%] rounded-[50%] border border-[#83d7d2]/35"
        />
      </Card>
      <Card
        className={cn(
          "gap-0 rounded-sm border-[#83d7d2]/25 bg-[#0c1e23] py-0 text-[#cdf2ee]",
          mechanism && "order-1",
        )}
      >
        <CardContent className="p-[3cqw]">
          <p className="text-[2cqw] tracking-widest text-[#83d7d2]/70">
            {mechanism ? "IN FOCUS / EXPLANATION" : "CONNECTED NOTE"}
          </p>
          <p className="mt-[1.5cqw] text-[3.2cqw] leading-relaxed">
            {scene.context}
          </p>
        </CardContent>
      </Card>
      <div className="order-3 border-t border-[#83d7d2]/20 pt-[3cqw]">
        <div className="[&_span]:text-[2cqw] [&_svg]:size-[5cqw]">
          <WaterPath />
        </div>
      </div>
    </div>
  );
}

function Spatial({
  scene,
  index,
  active,
}: {
  scene: FrameScene;
  index: number;
  active: boolean;
}) {
  const mechanism = index === 1;
  return (
    <>
      <SpatialCompact scene={scene} index={index} />
      <div
        className="relative hidden h-full overflow-hidden bg-[#071114] text-[#cdf2ee] @min-[540px]/stage:block"
        data-renderer="spatial"
      >
        <img
          src="/images/forest.webp"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.09] saturate-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#77d5cf08_1px,transparent_1px),linear-gradient(to_bottom,#77d5cf08_1px,transparent_1px)] bg-[size:4cqw_4cqw]"
        />
        <div className="absolute inset-x-[4%] top-[5%] flex items-center justify-between gap-3 border-b border-[#83d7d2]/20 pb-[2cqw]">
          <div>
            <p className="text-[1.05cqw] tracking-[0.2em] text-[#83d7d2]/60">
              CONTEXT SPACE / THE LIVING FOREST
            </p>
            <p className="mt-[0.8cqw] text-[3.2cqw] leading-tight font-medium tracking-[-0.035em]">
              {scene.contextTitle}
            </p>
          </div>
          <ScanLine className="size-[3cqw] text-[#83d7d2]/50" strokeWidth={1} />
        </div>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-[#8ee0d9]/35"
          viewBox="0 0 1000 625"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            initial={active ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            d={
              mechanism
                ? "M 420 285 H 470 V 350 H 515 M 710 458 V 510 H 425"
                : "M 570 285 H 625 V 240 H 660 M 570 400 H 615 V 495 H 660"
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <motion.circle
            animate={
              active
                ? { opacity: [0.4, 1, 0.4], r: [3, 6, 3] }
                : { opacity: 0.6, r: 4 }
            }
            transition={{
              duration: active ? 3 : 0,
              repeat: active ? Infinity : 0,
              ease: "easeInOut",
            }}
            cx={mechanism ? 420 : 570}
            cy="285"
            r="4"
            fill="currentColor"
          />
          <motion.circle
            animate={
              active
                ? { opacity: [0.4, 1, 0.4], r: [3, 6, 3] }
                : { opacity: 0.6, r: 4 }
            }
            transition={{
              duration: active ? 3 : 0,
              repeat: active ? Infinity : 0,
              ease: "easeInOut",
            }}
            cx={mechanism ? 710 : 570}
            cy={mechanism ? 458 : 400}
            r="4"
            fill="currentColor"
          />
          <path
            d="M 18 95 V 18 H 95 M 905 18 H 982 V 95 M 18 530 V 607 H 95 M 905 607 H 982 V 530"
            stroke="currentColor"
            fill="none"
            strokeWidth="1"
          />
        </svg>
        <MotionCard
          layout={active}
          initial={active ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 22 }}
          className={cn(
            "absolute gap-0 overflow-hidden rounded-sm border-[#83d7d2]/35 bg-[#0b2025]/70 py-0 text-[#cdf2ee] shadow-[0_0_30px_#63ccc90a] backdrop-blur-sm ",
            mechanism
              ? "top-[25%] left-[53%] h-[48%] w-[41%]"
              : "top-[25%] left-[5%] h-[60%] w-[52%]",
          )}
        >
          <div className="flex items-center justify-between border-b border-[#83d7d2]/20 px-[1.6cqw] py-[1cqw] text-[1.05cqw] tracking-widest text-[#83d7d2]/70">
            <span>{mechanism ? "SUPPORTING VISUAL" : "FOCAL MATERIAL"}</span>
            <span>IMG / 0{index + 1}</span>
          </div>
          <div className="relative min-h-0 flex-1">
            <img
              src={`/images/${scene.image}.webp`}
              alt={scene.alt}
              className="h-full w-full object-cover brightness-75 saturate-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071114] via-transparent to-transparent" />
            <div
              aria-hidden="true"
              className="absolute inset-[10%] rounded-[50%] border border-[#9de4da]/35"
            />
            <div
              aria-hidden="true"
              className="absolute inset-[18%] rounded-[50%] border border-dashed border-[#9de4da]/20"
            />
            <p className="absolute right-[2cqw] bottom-[2cqw] left-[2cqw] text-[1.2cqw] tracking-[0.12em] text-[#bfe7df]">
              {index === 2
                ? "WATER / FOREST / ATMOSPHERE"
                : "FOREST / CANOPY / ROOT SYSTEM"}
            </p>
          </div>
        </MotionCard>
        <MotionCard
          layout={active}
          initial={active ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 22 }}
          className={cn(
            "absolute gap-0 rounded-sm border-[#83d7d2]/25 bg-[#0c1e23]/90 py-0 text-[#cdf2ee] backdrop-blur-md ",
            mechanism
              ? "top-[25%] left-[5%] w-[39%]"
              : "top-[25%] left-[66%] w-[29%]",
          )}
        >
          <CardContent className="p-[2cqw]">
            <p className="flex items-center gap-[1cqw] text-[1cqw] tracking-widest text-[#83d7d2]/70">
              <Leaf className="size-[1.7cqw]" />{" "}
              {mechanism ? "IN FOCUS" : "CONNECTED NOTE"}
            </p>
            <p
              className={cn(
                "mt-[1.7cqw] font-medium tracking-tight",
                mechanism ? "text-[3cqw]" : "text-[2.2cqw]",
              )}
            >
              {scene.contextTitle}
            </p>
            <p className="mt-[1cqw] text-[1.5cqw] leading-[1.6] text-[#b7d3d2]/80">
              {scene.context}
            </p>
            <div className="mt-[1.6cqw] flex items-center justify-between border-t border-[#83d7d2]/20 pt-[1cqw] text-[0.95cqw] tracking-wider text-[#83d7d2]/60">
              <span>USGS / WATER SCIENCE</span>
              <ArrowUpRight className="size-[1.4cqw]" />
            </div>
          </CardContent>
        </MotionCard>
        <MotionCard
          layout={active}
          initial={active ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 22 }}
          className={cn(
            "absolute gap-0 rounded-sm border-[#83d7d2]/25 bg-[#0c1e23]/90 py-0 text-[#cdf2ee] ",
            mechanism
              ? "bottom-[9%] left-[5%] w-[39%]"
              : "bottom-[9%] left-[66%] w-[29%]",
          )}
        >
          <CardContent className="p-[2cqw]">
            <p className="mb-[2cqw] text-[1cqw] tracking-widest text-[#83d7d2]/70">
              RELATIONSHIP / WATER PATHWAY
            </p>
            <WaterPath compact />
          </CardContent>
        </MotionCard>
        <div className="absolute right-[5%] bottom-[3%] left-[5%] flex items-center justify-between text-[0.9cqw] tracking-[0.15em] text-[#83d7d2]/50">
          <span>IMAGE + EXPLANATION + RELATIONSHIP</span>
          <span>0{index + 1} / CONTEXT RETAINED</span>
        </div>
      </div>
    </>
  );
}

export function PresentationStage({
  mode,
  sceneIndex,
  className,
}: {
  mode: FrameMode;
  sceneIndex: number;
  className?: string;
}) {
  const scene = scenes[sceneIndex]!;
  const { ref, active } = useActiveMotion<HTMLDivElement>();
  return (
    <div ref={ref} className="@container/frame-stage w-full">
      <div
        className={cn(
          "@container/stage relative w-full overflow-hidden rounded-sm border border-white/10",
          mode === "spatial"
            ? "aspect-[4/5] @min-[540px]/frame-stage:aspect-[16/10]"
            : "aspect-[16/10]",
          className,
        )}
        role="img"
        aria-label={`${mode} mode: ${scene.title}`}
      >
        <AnimatePresence initial={false}>
          <motion.div
            className="absolute inset-0"
            key={mode === "spatial" ? mode : `${mode}-${sceneIndex}`}
            initial={
              active ? { opacity: 0, scale: 1.025, filter: "blur(6px)" } : false
            }
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{
              opacity: 0,
              scale: active ? 0.98 : 1,
              filter: active ? "blur(4px)" : "none",
            }}
            transition={{
              duration: active ? 0.65 : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {mode === "presentation" ? (
              <Presentation scene={scene} index={sceneIndex} active={active} />
            ) : mode === "backdrop" ? (
              <Backdrop scene={scene} active={active} />
            ) : (
              <Spatial scene={scene} index={sceneIndex} active={active} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
