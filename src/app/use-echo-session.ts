import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  candidates,
  direct,
  echoRequest,
  emptyFrame,
  focusOn,
  readJudgments,
  type Frame,
  type Judgments,
  type Ranked,
  type Verdict,
} from "@/lib/echo";
import { askJev, JevError } from "@/lib/jev";
import type { Asset, Folder } from "@/lib/library/library";
import type { FrameMode } from "@/lib/presentation";
import { listen, speechWindow, type Segment } from "@/lib/speech";

// How often Jev may be asked while speech keeps changing, and how long to back off when busy.
const askEveryMs = 800;
const retryBusyMs = 2500;
const transcriptLength = 40;

/** A live session: speech in, Jev judgments, and the frame they produce. */
export function useEchoSession({
  folder,
  assets,
  jevKey,
}: {
  folder: Folder;
  assets: Asset[];
  jevKey: string;
}) {
  const [mode, setMode] = useState<FrameMode>(folder.config.mode);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string>();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [interim, setInterim] = useState("");
  const [frame, setFrame] = useState<Frame>(emptyFrame);
  const [verdict, setVerdict] = useState<Verdict>();
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [asking, setAsking] = useState(false);
  const [jevError, setJevError] = useState<{
    message: string;
    fatal: boolean;
  }>();

  const material = useMemo(() => candidates(assets, mode), [assets, mode]);
  const speech = speechWindow(
    segments,
    interim,
    folder.config.windowSeconds,
    Date.now(),
  );

  // The ask loop reads the newest values through a ref so a slow response never acts on stale input.
  const live = useRef({ speech, material, frame, config: folder.config });
  live.current = { speech, material, frame, config: folder.config };
  const judgments = useRef<Judgments>(undefined);
  const inFlight = useRef(false);
  const again = useRef(false);
  // A rejected key or an ended sign-in won't fix itself; stop asking until the page reloads.
  const blocked = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stopListening = useRef<() => void>(undefined);

  const apply = useCallback((next: Judgments) => {
    clearTimeout(holdTimer.current);
    const { frame, config } = live.current;
    const result = direct(frame, next, config, Date.now());
    live.current.frame = result.frame;
    setFrame(result.frame);
    setVerdict(result.verdict);
    setRanked(result.ranked);
    // The judgments stay valid while the hold runs out; reapply them rather than asking again.
    if (result.retryAt)
      holdTimer.current = setTimeout(
        () => judgments.current && apply(judgments.current),
        result.retryAt - Date.now(),
      );
  }, []);

  const ask = useCallback(async () => {
    if (inFlight.current) {
      again.current = true;
      return;
    }
    const { speech, material, frame } = live.current;
    if (blocked.current || !speech.recent || material.length === 0) return;
    inFlight.current = true;
    setAsking(true);
    let wait = 0;
    try {
      const onScreen = material.find((item) => item.asset.id === frame.focus);
      const response = await askJev(
        jevKey,
        echoRequest(folder.name, speech, material, onScreen),
      );
      // The mode may have changed the material while Jev was answering.
      if (live.current.material !== material) again.current = true;
      else {
        judgments.current = readJudgments(response, material);
        apply(judgments.current);
      }
      setJevError(undefined);
    } catch (error) {
      const status = error instanceof JevError ? error.status : 0;
      const fatal = status === 401 || status === 403;
      setJevError({
        message:
          error instanceof Error ? error.message : "Jev couldn’t be reached.",
        fatal,
      });
      if (fatal) {
        blocked.current = true;
        stopListening.current?.();
      } else wait = retryBusyMs;
    } finally {
      inFlight.current = false;
      setAsking(false);
      if (again.current) {
        again.current = false;
        setTimeout(ask, wait);
      }
    }
  }, [apply, folder.name, jevKey]);

  // Ask at most every `askEveryMs` while the speech window changes.
  const askTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!speech.recent || askTimer.current) return;
    askTimer.current = setTimeout(() => {
      askTimer.current = undefined;
      ask();
    }, askEveryMs);
  }, [speech.recent, ask]);

  // New material for a new mode: judge the same speech again.
  useEffect(() => {
    ask();
  }, [material, ask]);

  useEffect(
    () => () => {
      clearTimeout(askTimer.current);
      clearTimeout(holdTimer.current);
      stopListening.current?.();
    },
    [],
  );

  const addLine = useCallback((text: string) => {
    const clean = text.trim();
    if (clean)
      setSegments((current) =>
        [...current, { text: clean, at: Date.now() }].slice(-transcriptLength),
      );
  }, []);

  const start = useCallback(() => {
    setMicError(undefined);
    setListening(true);
    stopListening.current = listen({
      language: folder.config.language,
      onFinal: addLine,
      onInterim: setInterim,
      onError: setMicError,
      onEnd: () => {
        stopListening.current = undefined;
        setListening(false);
      },
    });
  }, [addLine, folder.config.language]);

  const stop = useCallback(() => stopListening.current?.(), []);

  const pin = useCallback((id: string) => {
    clearTimeout(holdTimer.current);
    const next = {
      ...focusOn(live.current.frame, id, Date.now()),
      pinned: true,
    };
    live.current.frame = next;
    setFrame(next);
    setVerdict("pinned");
  }, []);

  const release = useCallback(() => {
    const next = { ...live.current.frame, pinned: false };
    live.current.frame = next;
    setFrame(next);
    setVerdict(undefined);
    if (judgments.current) apply(judgments.current);
  }, [apply]);

  return {
    mode,
    setMode,
    material,
    speech,
    segments,
    interim,
    listening,
    micError,
    start,
    stop,
    addLine,
    frame,
    verdict,
    ranked,
    asking,
    jevError,
    pin,
    release,
  };
}
