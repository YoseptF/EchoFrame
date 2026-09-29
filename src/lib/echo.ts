// How a live session decides what the frame shows. Jev answers a few independent questions about
// the speech and the folder's material in one request; code turns those judgments into the frame
// with the folder's heuristics. See https://docs.typesafe.ai/cookbooks/semantic_find
import type { JevQuestion, JevResponse } from "@/lib/jev";
import {
  needsDescription,
  type Asset,
  type EchoConfig,
} from "@/lib/library/library";
import type { FrameMode } from "@/lib/presentation";

/** A Choice question takes at most 255 options; leave room and keep the state small. */
export const maxCandidates = 200;
const excerptLength = 600;

/** An asset Jev can point to, under a short id the model sees in place of the asset's uuid. */
export type Candidate = { key: string; asset: Asset };

/** The material Jev may bring forward in a mode. Jev reads words, so undescribed media is left out. */
export function candidates(assets: Asset[], mode: FrameMode): Candidate[] {
  return assets
    .filter((asset) => !needsDescription(asset))
    .filter((asset) => mode !== "backdrop" || asset.kind === "image")
    .slice(0, maxCandidates)
    .map((asset, index) => ({ key: `m${index + 1}`, asset }));
}

export type SpeechWindow = {
  /** Everything said inside the speech window. */
  recent: string;
  /** The latest sentence. */
  latest: string;
};

function describe({ key, asset }: Candidate) {
  const text = asset.text?.trim().replace(/\s+/g, " ");
  return {
    id: key,
    kind: asset.kind,
    name: asset.name,
    ...(asset.description && { description: asset.description }),
    ...(asset.tags.length > 0 && { tags: asset.tags }),
    ...(text && {
      text:
        text.length > excerptLength ? `${text.slice(0, excerptLength)}…` : text,
    }),
  };
}

const supports = {
  true: "The item shows, explains, or gives evidence for what the speaker is talking about.",
  false:
    "The item is about another subject, or only shares a word with the speech.",
};

function whichItem(speech: string): JevQuestion["instructions"] {
  return {
    question: `Which item in \`material\` best supports what the speaker says in ${speech}?`,
    guidance:
      "Judge by each item's name, description, tags, and text. Prefer the item an audience should see while hearing this, not one that merely repeats a word.",
  };
}

/** One request: which item fits the latest sentence, which fits the thread, whether any fits, and whether the thought on screen continues. */
export function echoRequest(
  talk: string,
  speech: SpeechWindow,
  material: Candidate[],
  onScreen?: Candidate,
): { state: unknown; questions: Record<string, JevQuestion> } {
  const options = Object.fromEntries(material.map(({ key }) => [key, null]));
  const questions: Record<string, JevQuestion> = {
    fits: {
      type: "noul",
      instructions:
        "Does any item in `material` support what the speaker is talking about in `speech.recent`?",
      criteria: {
        true: "At least one item shows, explains, or gives evidence for the speaker's current subject.",
        false:
          "No item is about the speaker's current subject; at most they share a passing word.",
      },
    },
  };
  // A Choice needs two options to compare; with one item, `fits` alone decides.
  if (material.length > 1) {
    questions.latest = {
      type: "choice",
      instructions: whichItem("`speech.latest`"),
      criteria: options,
    };
    questions.thread = {
      type: "choice",
      instructions: whichItem("`speech.recent`"),
      criteria: options,
    };
  }
  if (onScreen)
    questions.same_thought = {
      type: "noul",
      instructions:
        "Is the speaker in `speech.latest` still developing the subject of `on_screen`?",
      criteria: {
        true: "The latest speech continues, explains, or gives detail about the subject of `on_screen`.",
        false: "The latest speech has moved on to a different subject.",
      },
    };
  return {
    state: {
      talk,
      speech,
      on_screen: onScreen ? describe(onScreen) : null,
      material: material.map(describe),
    },
    questions,
  };
}

/** Jev's raw answers, keyed by asset id so they survive a change of candidate list. */
export type Judgments = {
  latest: Record<string, number>;
  thread: Record<string, number>;
  fits: number;
  sameThought: number | null;
};

export function readJudgments(
  response: JevResponse,
  material: Candidate[],
): Judgments {
  const probabilities = (id: string) => {
    const answer = response.answers[id];
    const byKey =
      answer?.type === "choice"
        ? (answer.probabilities ?? { [answer.choice]: 1 })
        : material.length === 1
          ? { [material[0]!.key]: 1 }
          : {};
    return Object.fromEntries(
      material.map(({ key, asset }) => [asset.id, byKey[key] ?? 0]),
    );
  };
  const noul = (id: string) => {
    const answer = response.answers[id];
    return answer?.type === "noul" ? answer.noul : null;
  };
  return {
    latest: probabilities("latest"),
    thread: probabilities("thread"),
    fits: noul("fits") ?? 0,
    sameThought: noul("same_thought"),
  };
}

export type Ranked = { id: string; score: number };

/**
 * How sure Jev must be that the speaker left the thought on screen before the frame moves on.
 * Continuity raises the bar: at 50 the chance they're still on it must fall below 0.3.
 */
export function changeBelow(continuity: number) {
  return 0.5 - 0.4 * (continuity / 100);
}

/**
 * Recency blends the latest sentence with the broader thread. The slider sets the blend while the
 * speaker stays on one thought; once they move on, the older speech in the window describes the
 * previous subject, so the latest sentence takes over.
 */
export function rank(
  judgments: Judgments,
  weights: EchoConfig["weights"],
): Ranked[] {
  const recency = Math.max(
    weights.recency / 100,
    judgments.sameThought === null ? 0 : 1 - judgments.sameThought,
  );
  return Object.keys(judgments.thread)
    .map((id) => ({
      id,
      score:
        recency * (judgments.latest[id] ?? 0) +
        (1 - recency) * (judgments.thread[id] ?? 0),
    }))
    .sort((a, b) => b.score - a.score);
}

/** Relevance sets how sure Jev must be that something fits before the frame changes. */
export function fitThreshold(relevance: number) {
  return 0.25 + 0.6 * (relevance / 100);
}

export type Frame = {
  /** The asset in focus, or null before anything has come forward. */
  focus: string | null;
  /** Earlier focus, most recent first, kept nearby as context. */
  retained: string[];
  /** The closest other matches when the focus changed. Fixed until the next change, so the stage stays still while the speaker talks. */
  related: string[];
  /** When the focus last changed, in milliseconds. */
  since: number;
  /** The speaker chose the focus by hand; it stays until they release it. */
  pinned: boolean;
};

export const emptyFrame: Frame = {
  focus: null,
  retained: [],
  related: [],
  since: 0,
  pinned: false,
};

export type Verdict =
  | "switched"
  | "same"
  | "pinned"
  | "holding"
  | "continuing"
  | "no-match";

const retainedLimit = 3;
const relatedLimit = 2;

export function focusOn(
  frame: Frame,
  id: string,
  now: number,
  ranked: Ranked[] = [],
): Frame {
  if (frame.focus === id) return frame;
  const retained = [frame.focus, ...frame.retained]
    .filter((item): item is string => item !== null && item !== id)
    .slice(0, retainedLimit);
  return {
    focus: id,
    retained,
    related: ranked
      .map((item) => item.id)
      .filter((item) => item !== id && !retained.includes(item))
      .slice(0, relatedLimit),
    since: now,
    pinned: false,
  };
}

/**
 * Applies one set of judgments to the frame. The frame changes only when the speaker has moved on
 * to another subject, never because a different item edged ahead while they develop the same
 * thought, and never before the audience has had the minimum hold to take it in.
 */
export function direct(
  frame: Frame,
  judgments: Judgments,
  config: Pick<EchoConfig, "weights" | "holdSeconds">,
  now: number,
): { frame: Frame; verdict: Verdict; ranked: Ranked[]; retryAt?: number } {
  const ranked = rank(judgments, config.weights);
  const best = ranked[0];
  if (frame.pinned) return { frame, verdict: "pinned", ranked };
  if (!best || judgments.fits < fitThreshold(config.weights.relevance))
    return { frame, verdict: "no-match", ranked };
  if (best.id === frame.focus) return { frame, verdict: "same", ranked };
  if (frame.focus) {
    // Without a continuity answer (the focus isn't in this mode's material), let it change.
    const stillOnIt =
      judgments.sameThought !== null &&
      judgments.sameThought >= changeBelow(config.weights.continuity);
    if (stillOnIt) return { frame, verdict: "continuing", ranked };
    const holdUntil = frame.since + config.holdSeconds * 1000;
    if (now < holdUntil)
      return { frame, verdict: "holding", ranked, retryAt: holdUntil };
  }
  return {
    frame: focusOn(frame, best.id, now, ranked),
    verdict: "switched",
    ranked,
  };
}
