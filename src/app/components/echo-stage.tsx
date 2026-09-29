import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { AudioLines, ScanLine } from "lucide-react";
import { useEffects } from "@/components/effects/motion-system";
import { Card, CardContent } from "@/components/ui/card";
import type { Asset } from "@/lib/library/library";
import type { FrameMode } from "@/lib/presentation";
import { cn } from "@/lib/utils";
import { useAssetUrl } from "../library-context";

// A live frame built from the folder's own material. It follows the same mode contracts and art
// treatment as the authored `PresentationStage`: Presentation is a composed slide, Backdrop is one
// clear image, Spatial is connected panels around the current focus.

export type StageContent = {
  folderId: string;
  talk: string;
  focus?: Asset;
  /** Earlier focus, most recent first. */
  retained: Asset[];
  /** The next-best matches for what is being said. */
  related: Asset[];
};

const MotionCard = motion.create(Card);
const ease = [0.22, 1, 0.36, 1] as const;

function AssetImage({
  folderId,
  asset,
  className,
}: {
  folderId: string;
  asset: Asset;
  className?: string;
}) {
  const url = useAssetUrl(folderId, asset);
  return url ? (
    <img
      src={url}
      alt={asset.description || asset.name}
      className={cn("h-full w-full object-cover", className)}
    />
  ) : (
    <div className={cn("h-full w-full", className)} />
  );
}

const excerpt = (asset: Asset, length: number) => {
  const text = (asset.text ?? asset.description).trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
};

const firstImage = (...groups: (Asset | undefined)[][]) =>
  groups.flat().find((asset) => asset?.kind === "image");

function Presentation({
  folderId,
  talk,
  focus,
  retained,
  related,
}: StageContent) {
  const visual =
    focus?.kind === "image" ? focus : firstImage(related, retained);
  const body = focus
    ? focus.kind === "text"
      ? excerpt(focus, 220)
      : focus.description
    : "";
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-[#101110] text-[#f4f3ec]"
      data-renderer="presentation"
    >
      {visual && (
        <>
          <AssetImage
            folderId={folderId}
            asset={visual}
            className={cn(
              "absolute inset-y-0 right-0",
              focus?.kind === "image" ? "w-[52%]" : "w-full opacity-35",
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101110] via-[#101110]/75 to-transparent" />
        </>
      )}
      <div className="relative flex h-full flex-col p-[6cqw]">
        <div className="flex items-center justify-between gap-[3cqw] text-[1.3cqw] font-medium tracking-[0.22em] text-white/60">
          <span className="truncate">{talk.toUpperCase()}</span>
          {focus && (
            <span className="shrink-0">{focus.kind.toUpperCase()}</span>
          )}
        </div>
        {focus ? (
          <>
            <p className="mt-auto line-clamp-3 w-[62%] text-[6.2cqw] leading-[1.04] font-semibold tracking-[-0.06em] text-balance">
              {focus.name}
            </p>
            {body && (
              <p className="mt-[3cqw] line-clamp-4 w-[52%] text-[1.85cqw] leading-relaxed text-white/70">
                {body}
              </p>
            )}
            {focus.kind === "audio" && (
              <AudioLines
                strokeWidth={1.2}
                className="mt-[3cqw] size-[7cqw] text-[#d6eea3]"
              />
            )}
          </>
        ) : (
          <p className="mt-auto w-[70%] text-[7cqw] leading-[1.02] font-semibold tracking-[-0.065em] text-balance">
            {talk}
          </p>
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

function Backdrop({ folderId, focus, retained, related }: StageContent) {
  // Backdrop only shows images; keep the last one up while a note or clip is in focus.
  const image = firstImage([focus], retained, related);
  return (
    <div
      className="relative h-full overflow-hidden bg-[#101110]"
      data-renderer="backdrop"
    >
      {image && <AssetImage folderId={folderId} asset={image} />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
    </div>
  );
}

function PanelBody({
  folderId,
  asset,
  size,
}: {
  folderId: string;
  asset: Asset;
  size: "focus" | "side";
}) {
  const focus = size === "focus";
  if (asset.kind === "image")
    return (
      <div className="relative min-h-0 flex-1">
        <AssetImage
          folderId={folderId}
          asset={asset}
          className="brightness-75 saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071114] via-transparent to-transparent" />
        {focus && (
          <div
            aria-hidden="true"
            className="absolute inset-[10%] rounded-[50%] border border-[#9de4da]/35"
          />
        )}
        <p
          className={cn(
            "absolute right-[1.5cqw] bottom-[1.5cqw] left-[1.5cqw] line-clamp-2 leading-snug text-[#bfe7df]",
            focus ? "text-[1.5cqw]" : "text-[1.2cqw]",
          )}
        >
          {asset.description}
        </p>
      </div>
    );
  return (
    <CardContent className="min-h-0 flex-1 overflow-hidden p-[2cqw]">
      {asset.kind === "audio" && (
        <AudioLines
          strokeWidth={1.2}
          className="mb-[1.5cqw] size-[4cqw] text-[#83d7d2]"
        />
      )}
      <p
        className={cn(
          "leading-[1.6] text-[#b7d3d2]/85",
          focus ? "text-[2.1cqw]" : "line-clamp-5 text-[1.35cqw]",
        )}
      >
        {excerpt(asset, focus ? 420 : 180)}
      </p>
    </CardContent>
  );
}

function Panel({
  folderId,
  asset,
  label,
  size,
  className,
}: {
  folderId: string;
  asset: Asset;
  label: string;
  size: "focus" | "side";
  className?: string;
}) {
  const { enabled } = useEffects();
  return (
    <MotionCard
      layoutId={enabled ? asset.id : undefined}
      initial={enabled ? { opacity: 0, y: 18 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 110, damping: 22 }}
      className={cn(
        "min-h-0 gap-0 overflow-hidden rounded-sm py-0 text-[#cdf2ee]",
        size === "focus"
          ? "border-[#83d7d2]/35 bg-[#0b2025]/70 shadow-[0_0_30px_#63ccc90a]"
          : "border-[#83d7d2]/25 bg-[#0c1e23]/90",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-[1cqw] border-b border-[#83d7d2]/20 px-[1.6cqw] py-[1cqw] tracking-widest text-[#83d7d2]/70",
          size === "focus" ? "text-[1.05cqw]" : "text-[0.95cqw]",
        )}
      >
        <span className="shrink-0">{label}</span>
        <span className="truncate">{asset.name.toUpperCase()}</span>
      </div>
      <PanelBody folderId={folderId} asset={asset} size={size} />
    </MotionCard>
  );
}

function Spatial({ folderId, talk, focus, retained, related }: StageContent) {
  const side = [
    ...retained.slice(0, 1).map((asset) => ({ asset, label: "RETAINED" })),
    ...related.map((asset) => ({ asset, label: "CONNECTED" })),
  ].slice(0, 2);
  return (
    <div
      className="relative flex h-full flex-col gap-[3cqw] overflow-hidden bg-[#071114] p-[5cqw] text-[#cdf2ee] @min-[540px]/stage:gap-[2.5cqw] @min-[540px]/stage:p-[4cqw]"
      data-renderer="spatial"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#77d5cf08_1px,transparent_1px),linear-gradient(to_bottom,#77d5cf08_1px,transparent_1px)] bg-[size:4cqw_4cqw]"
      />
      <div className="relative flex items-center justify-between gap-3 border-b border-[#83d7d2]/20 pb-[2cqw]">
        <div className="min-w-0">
          <p className="truncate text-[2cqw] tracking-[0.2em] text-[#83d7d2]/60 @min-[540px]/stage:text-[1.05cqw]">
            CONTEXT SPACE / {talk.toUpperCase()}
          </p>
          <p className="mt-[0.8cqw] truncate text-[5.5cqw] leading-tight font-medium tracking-[-0.035em] @min-[540px]/stage:text-[3.2cqw]">
            {focus?.name ?? "Listening for the first thought"}
          </p>
        </div>
        <ScanLine
          className="size-[5cqw] shrink-0 text-[#83d7d2]/50 @min-[540px]/stage:size-[3cqw]"
          strokeWidth={1}
        />
      </div>
      <LayoutGroup>
        <div className="relative grid min-h-0 flex-1 grid-rows-[3fr_2fr] gap-[3cqw] @min-[540px]/stage:grid-cols-[1.45fr_1fr] @min-[540px]/stage:grid-rows-1 @min-[540px]/stage:gap-[2.5cqw]">
          <AnimatePresence mode="popLayout">
            {focus && (
              <Panel
                key={focus.id}
                folderId={folderId}
                asset={focus}
                label="IN FOCUS"
                size="focus"
                className="flex flex-col"
              />
            )}
          </AnimatePresence>
          <div className="grid min-h-0 auto-rows-fr grid-cols-2 gap-[3cqw] @min-[540px]/stage:grid-cols-1 @min-[540px]/stage:gap-[2.5cqw]">
            <AnimatePresence mode="popLayout">
              {side.map(({ asset, label }) => (
                <Panel
                  key={asset.id}
                  folderId={folderId}
                  asset={asset}
                  label={label}
                  size="side"
                  className="flex flex-col"
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </LayoutGroup>
      <div className="relative hidden items-center justify-between text-[0.9cqw] tracking-[0.15em] text-[#83d7d2]/50 @min-[540px]/stage:flex">
        <span>FOCUS + CONTEXT + CONNECTIONS</span>
        <span>{retained.length > 0 ? "CONTEXT RETAINED" : "LIVE"}</span>
      </div>
    </div>
  );
}

/** The audience-facing frame of a live session. */
export function EchoStage({
  mode,
  content,
  className,
}: {
  mode: FrameMode;
  content: StageContent;
  className?: string;
}) {
  const { enabled } = useEffects();
  const key =
    mode === "spatial"
      ? mode
      : mode === "backdrop"
        ? `${mode}-${firstImage([content.focus], content.retained, content.related)?.id}`
        : `${mode}-${content.focus?.id}`;
  return (
    <div className={cn("@container/frame-stage w-full", className)}>
      <div
        className={cn(
          "@container/stage relative w-full overflow-hidden rounded-sm border border-white/10",
          mode === "spatial"
            ? "aspect-[4/5] @min-[540px]/frame-stage:aspect-[16/10]"
            : "aspect-[16/10]",
        )}
        role="img"
        aria-label={`${mode} frame: ${content.focus?.name ?? content.talk}`}
      >
        <AnimatePresence initial={false}>
          <motion.div
            className="absolute inset-0"
            key={key}
            initial={
              enabled
                ? { opacity: 0, scale: 1.025, filter: "blur(6px)" }
                : false
            }
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{
              opacity: 0,
              scale: enabled ? 0.98 : 1,
              filter: enabled ? "blur(4px)" : "none",
            }}
            transition={{ duration: enabled ? 0.65 : 0, ease }}
          >
            {mode === "presentation" ? (
              <Presentation {...content} />
            ) : mode === "backdrop" ? (
              <Backdrop {...content} />
            ) : (
              <Spatial {...content} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
