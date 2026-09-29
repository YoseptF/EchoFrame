import { AnimatePresence, motion } from "motion/react";
import { AudioLines, FileText } from "lucide-react";
import { useEffects } from "@/components/effects/motion-system";
import type { Asset } from "@/lib/library/library";
import type { FrameMode } from "@/lib/presentation";
import { cn } from "@/lib/utils";
import { useAssetUrl } from "../library-context";

// A live frame built from the folder's own material, following the same mode contracts and art
// treatment as the authored `PresentationStage`. It is for an audience: titles and imagery, never
// the descriptions Jev matches against, and it only changes when the focus does.

export type StageContent = {
  folderId: string;
  talk: string;
  focus?: Asset;
  /** Earlier focus, most recent first. */
  retained: Asset[];
  /** The closest other matches when the focus changed. */
  related: Asset[];
};

const ease = [0.22, 1, 0.36, 1] as const;

/** A note's first sentence, when it is short enough to read at a glance from the back of a room. */
function glance(asset: Asset) {
  const text = (asset.text ?? "").trim().replace(/\s+/g, " ");
  const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  return sentence.length <= 110 ? sentence : null;
}

/**
 * `contain` shows the whole image, such as a poster or a cover, over a blurred copy of itself, so
 * nothing is cropped and the area never looks empty.
 */
function AssetImage({
  folderId,
  asset,
  fit = "cover",
  className,
}: {
  folderId: string;
  asset: Asset;
  fit?: "cover" | "contain";
  className?: string;
}) {
  const url = useAssetUrl(folderId, asset);
  const { enabled } = useEffects();
  if (!url) return <div className={cn("h-full w-full", className)} />;
  const image = (
    <motion.img
      src={url}
      alt={asset.description || asset.name}
      initial={enabled ? { scale: 1.035 } : false}
      animate={{ scale: 1 }}
      transition={{ duration: enabled ? 1.6 : 0, ease }}
      className={cn(
        "relative h-full w-full",
        fit === "contain" ? "object-contain" : "object-cover",
      )}
    />
  );
  if (fit === "cover")
    return <div className={cn("overflow-hidden", className)}>{image}</div>;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
      />
      {image}
    </div>
  );
}

const firstImage = (...groups: (Asset | undefined)[][]) =>
  groups.flat().find((asset) => asset?.kind === "image");

function Presentation({ folderId, talk, focus, related }: StageContent) {
  // A note borrows the closest image from the moment it came forward, never an unrelated earlier one.
  const visual = focus?.kind === "image" ? focus : firstImage(related);
  const line = focus?.kind === "text" ? glance(focus) : null;
  return (
    <div
      className="relative flex h-full overflow-hidden bg-[#101110] text-[#f4f3ec]"
      data-renderer="presentation"
    >
      {visual && (
        <>
          <AssetImage
            folderId={folderId}
            asset={visual}
            fit="contain"
            className="absolute inset-y-0 right-0 w-[50%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101110] via-[#101110]/85 via-45% to-transparent" />
        </>
      )}
      <div className="relative flex h-full w-[56%] flex-col p-[6cqw]">
        <p className="truncate text-[1.3cqw] font-medium tracking-[0.22em] text-white/55">
          {talk.toUpperCase()}
        </p>
        <div className="mt-auto">
          <p className="line-clamp-3 pb-[0.12em] text-[5.6cqw] leading-[1.04] font-semibold tracking-[-0.06em] text-balance">
            {focus?.name ?? talk}
          </p>
          {line && (
            <p className="mt-[3cqw] text-[2.4cqw] leading-snug text-white/75">
              {line}
            </p>
          )}
          {focus?.kind === "audio" && (
            <AudioLines
              strokeWidth={1.2}
              className="mt-[3cqw] size-[6cqw] text-[#d6eea3]"
            />
          )}
        </div>
        <span className="mt-[5cqw] h-[0.5cqw] w-[6cqw] bg-[#d6eea3]" />
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
      {image && (
        <AssetImage folderId={folderId} asset={image} className="h-full" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
    </div>
  );
}

/** A quiet reminder of nearby material: a picture and its title, or a note's title. */
function ContextTile({ folderId, asset }: { folderId: string; asset: Asset }) {
  if (asset.kind !== "image")
    return (
      <div className="flex min-h-0 flex-col justify-end gap-[1.5cqw] overflow-hidden rounded-sm border border-[#83d7d2]/20 bg-[#0c1e23] p-[2.5cqw] @min-[540px]/stage:p-[1.6cqw]">
        {asset.kind === "audio" && (
          <AudioLines
            strokeWidth={1.2}
            className="size-[4cqw] text-[#83d7d2]/70 @min-[540px]/stage:size-[2.4cqw]"
          />
        )}
        <p className="line-clamp-3 text-[2.6cqw] leading-snug font-medium text-[#cdf2ee]/90 @min-[540px]/stage:text-[1.7cqw]">
          {asset.name}
        </p>
      </div>
    );
  return (
    <div className="flex min-h-0 flex-col gap-[1cqw]">
      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-[#83d7d2]/20 bg-[#0c1e23]">
        <AssetImage
          folderId={folderId}
          asset={asset}
          fit="contain"
          className="h-full opacity-85"
        />
      </div>
      <p className="truncate text-[1.9cqw] text-[#b7d3d2]/80 @min-[540px]/stage:text-[1.3cqw]">
        {asset.name}
      </p>
    </div>
  );
}

function Spatial({ folderId, talk, focus, retained, related }: StageContent) {
  // A note in focus is illustrated by the closest image from the moment it came forward.
  const visual = focus?.kind === "image" ? focus : firstImage(related);
  const line = focus?.kind === "text" ? glance(focus) : null;
  const context = [...retained.slice(0, 1), ...related]
    .filter((asset) => asset !== visual)
    .slice(0, 3);
  return (
    <div
      className="relative grid h-full grid-rows-[auto_minmax(0,3fr)_minmax(0,1fr)] gap-[3cqw] overflow-hidden bg-[#071114] p-[5cqw] text-[#cdf2ee] @min-[540px]/stage:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] @min-[540px]/stage:grid-rows-[auto_minmax(0,1fr)] @min-[540px]/stage:gap-x-[3.5cqw] @min-[540px]/stage:gap-y-[2.5cqw] @min-[540px]/stage:p-[4.5cqw]"
      data-renderer="spatial"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#77d5cf08_1px,transparent_1px),linear-gradient(to_bottom,#77d5cf08_1px,transparent_1px)] bg-[size:4cqw_4cqw]"
      />
      <div className="relative @min-[540px]/stage:col-span-2">
        <p className="line-clamp-2 pb-[0.12em] text-[6cqw] leading-[1.08] font-medium tracking-[-0.045em] text-balance @min-[540px]/stage:text-[3.6cqw]">
          {focus?.name ?? talk}
        </p>
        {line && (
          <p className="mt-[1.5cqw] text-[3.4cqw] leading-snug text-[#b7d3d2]/85 @min-[540px]/stage:mt-[1cqw] @min-[540px]/stage:text-[1.9cqw]">
            {line}
          </p>
        )}
      </div>

      <div className="relative min-h-0 overflow-hidden rounded-sm border border-[#83d7d2]/30 bg-[#0b2025]/70 shadow-[0_0_40px_#63ccc90d]">
        {visual ? (
          <AssetImage
            folderId={folderId}
            asset={visual}
            fit="contain"
            className="h-full"
          />
        ) : focus ? (
          <div className="grid h-full place-items-center">
            {focus.kind === "audio" ? (
              <AudioLines
                strokeWidth={1.2}
                className="size-[10cqw] text-[#83d7d2]/80 @min-[540px]/stage:size-[6cqw]"
              />
            ) : (
              <FileText
                strokeWidth={1}
                className="size-[10cqw] text-[#83d7d2]/40 @min-[540px]/stage:size-[6cqw]"
              />
            )}
          </div>
        ) : null}
      </div>

      {context.length > 0 && (
        <div className="relative grid min-h-0 grid-cols-3 gap-[3cqw] @min-[540px]/stage:grid-cols-1 @min-[540px]/stage:grid-rows-3 @min-[540px]/stage:gap-[2cqw]">
          {context.map((asset) => (
            <ContextTile key={asset.id} folderId={folderId} asset={asset} />
          ))}
        </div>
      )}
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
  // The whole frame changes at once, and only when what it shows changes.
  const key = `${mode}-${
    mode === "backdrop"
      ? firstImage([content.focus], content.retained, content.related)?.id
      : content.focus?.id
  }`;
  return (
    <div className={cn("@container/frame-stage w-full", className)}>
      <div
        className={cn(
          "@container/stage relative w-full overflow-hidden rounded-sm border border-white/10 bg-[#080c0d]",
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
            initial={enabled ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: enabled ? 0.9 : 0, ease }}
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
