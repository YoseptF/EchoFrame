// The browser's own speech recognition, kept as a rolling window of what was just said.
import type { SpeechWindow } from "@/lib/echo";

export type Segment = { text: string; at: number };

const latestWords = 40;

/** What was said inside the window, and the sentence being spoken now. */
export function speechWindow(
  segments: Segment[],
  interim: string,
  windowSeconds: number,
  now: number,
): SpeechWindow {
  const recent = segments.filter(
    (segment) => now - segment.at <= windowSeconds * 1000,
  );
  const last = recent.at(-1)?.text ?? "";
  const latest = `${interim ? `${last} ${interim}` : last}`
    .trim()
    .split(/\s+/)
    .slice(-latestWords)
    .join(" ");
  return {
    recent: [...recent.map((segment) => segment.text), interim]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
    latest,
  };
}

// The Web Speech API is not in TypeScript's DOM library; this is the part EchoFrame uses.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<RecognitionResult>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

function recognitionClass(): (new () => Recognition) | undefined {
  if (typeof window === "undefined") return undefined;
  const scope = window as unknown as Record<string, unknown>;
  return (scope.SpeechRecognition ?? scope.webkitSpeechRecognition) as
    (new () => Recognition) | undefined;
}

export function speechSupported() {
  return recognitionClass() !== undefined;
}

const errors: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in the address bar.",
  "service-not-allowed":
    "This browser won’t run speech recognition for this page.",
  "audio-capture": "No microphone was found.",
  network: "Speech recognition needs a connection in this browser.",
  "language-not-supported":
    "This browser can’t recognize speech in the folder’s language.",
};

/** Listens until stopped, restarting when the browser ends recognition after a pause. */
export function listen({
  language,
  onFinal,
  onInterim,
  onError,
  onEnd,
}: {
  language: string;
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}) {
  const Recognition = recognitionClass();
  if (!Recognition) {
    onError("This browser can’t turn speech into text.");
    onEnd();
    return () => {};
  }
  let wanted = true;
  let recognition: Recognition;
  const start = () => {
    recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const text = result[0].transcript.trim();
        if (!text) continue;
        if (result.isFinal) onFinal(text);
        else interim += ` ${text}`;
      }
      onInterim(interim.trim());
    };
    recognition.onerror = ({ error }) => {
      if (error === "no-speech" || error === "aborted") return;
      wanted = false;
      onError(errors[error] ?? `Speech recognition stopped (${error}).`);
    };
    recognition.onend = () => {
      onInterim("");
      if (wanted) start();
      else onEnd();
    };
    recognition.start();
  };
  start();
  return () => {
    wanted = false;
    recognition.stop();
  };
}
