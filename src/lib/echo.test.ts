import { expect, test } from "bun:test";
import {
  candidates,
  direct,
  echoRequest,
  emptyFrame,
  fitThreshold,
  focusOn,
  rank,
  readJudgments,
  type Judgments,
} from "./echo";
import type { JevResponse } from "./jev";
import { defaultEchoConfig, type Asset } from "./library/library";
import { speechWindow } from "./speech";

const asset = (id: string, edit: Partial<Asset> = {}): Asset => ({
  id,
  kind: "image",
  name: id,
  description: `A photo of ${id}`,
  tags: [],
  mimeType: "image/webp",
  size: 1,
  createdAt: "2026-09-28T00:00:00.000Z",
  ...edit,
});

const forest = asset("forest", { tags: ["trees"] });
const river = asset("river");
const note = asset("note", {
  kind: "text",
  description: "",
  mimeType: "text/plain",
  text: "Transpiration moves water from roots to leaves.",
});

test("only material Jev can read is offered, and backdrop takes images", () => {
  const assets = [forest, asset("blank", { description: "" }), note];
  expect(candidates(assets, "spatial").map((c) => c.asset.id)).toEqual([
    "forest",
    "note",
  ]);
  expect(candidates(assets, "backdrop").map((c) => c.key)).toEqual(["m1"]);
});

test("one request asks which item fits, whether any fits, and whether the thought continues", () => {
  const material = candidates([forest, river, note], "spatial");
  const { state, questions } = echoRequest(
    "The living forest",
    { recent: "Forests move water.", latest: "Forests move water." },
    material,
    material[0],
  );
  expect(Object.keys(questions).sort()).toEqual([
    "fits",
    "latest",
    "same_thought",
    "thread",
  ]);
  expect(questions.latest).toMatchObject({
    type: "choice",
    criteria: { m1: null, m2: null, m3: null },
  });
  expect(state).toMatchObject({
    on_screen: { id: "m1", name: "forest", tags: ["trees"] },
    material: [
      { id: "m1" },
      { id: "m2" },
      { id: "m3", kind: "text", text: note.text },
    ],
  });
});

test("a single item needs no Choice and nothing on screen needs no continuity check", () => {
  const { questions } = echoRequest(
    "Talk",
    { recent: "", latest: "" },
    candidates([forest], "spatial"),
  );
  expect(Object.keys(questions)).toEqual(["fits"]);
});

test("answers are read back onto asset ids", () => {
  const material = candidates([forest, river], "spatial");
  const response: JevResponse = {
    model: "jev-1.13.0",
    usage: { input_tokens: 1, output_tokens: 1 },
    answers: {
      fits: { type: "noul", noul: 0.9 },
      latest: {
        type: "choice",
        choice: "m2",
        confidence: 0.8,
        probabilities: { m1: 0.1, m2: 0.9 },
      },
      thread: {
        type: "choice",
        choice: "m1",
        confidence: 0.5,
        probabilities: { m1: 0.7, m2: 0.3 },
      },
    },
  };
  expect(readJudgments(response, material)).toEqual({
    latest: { forest: 0.1, river: 0.9 },
    thread: { forest: 0.7, river: 0.3 },
    fits: 0.9,
    sameThought: null,
  });
});

const judged = (edit: Partial<Judgments> = {}): Judgments => ({
  latest: { forest: 0.1, river: 0.9 },
  thread: { forest: 0.6, river: 0.4 },
  fits: 0.95,
  sameThought: null,
  ...edit,
});

test("recency decides between the latest sentence and the thread", () => {
  const weights = defaultEchoConfig.weights;
  expect(rank(judged(), { ...weights, recency: 100 })[0]?.id).toBe("river");
  expect(rank(judged(), { ...weights, recency: 0 })[0]?.id).toBe("forest");
});

const config = {
  holdSeconds: 6,
  weights: { relevance: 70, recency: 100, continuity: 50 },
};

test("the first good match comes forward; a weak one waits", () => {
  const first = direct(emptyFrame, judged(), config, 1000);
  expect(first.verdict).toBe("switched");
  expect(first.frame).toMatchObject({ focus: "river", since: 1000 });
  expect(fitThreshold(70)).toBeGreaterThan(0.6);
  expect(direct(emptyFrame, judged({ fits: 0.4 }), config, 0).verdict).toBe(
    "no-match",
  );
});

test("the minimum hold delays a change and says when to try again", () => {
  const frame = focusOn(emptyFrame, "forest", 0);
  const early = direct(frame, judged(), config, 2000);
  expect(early).toMatchObject({ verdict: "holding", retryAt: 6000 });
  expect(early.frame.focus).toBe("forest");
  const later = direct(frame, judged(), config, 6000);
  expect(later.frame).toMatchObject({ focus: "river", retained: ["forest"] });
});

test("continuity keeps the frame while the thought continues", () => {
  const frame = focusOn(emptyFrame, "forest", 0);
  const close = judged({ latest: { forest: 0.45, river: 0.55 } });
  expect(
    direct(frame, { ...close, sameThought: 0.95 }, config, 60_000).verdict,
  ).toBe("continuing");
  expect(
    direct(frame, { ...close, sameThought: 0.05 }, config, 60_000).verdict,
  ).toBe("switched");
});

test("a pinned frame stays until released", () => {
  const frame = { ...focusOn(emptyFrame, "forest", 0), pinned: true };
  expect(direct(frame, judged(), config, 60_000).frame).toBe(frame);
});

test("the speech window keeps recent speech and the sentence in progress", () => {
  const segments = [
    { text: "Old news.", at: 0 },
    { text: "Forests move water.", at: 25_000 },
  ];
  expect(speechWindow(segments, "into the air", 20, 30_000)).toEqual({
    recent: "Forests move water. into the air",
    latest: "Forests move water. into the air",
  });
});

const defaults = {
  holdSeconds: 6,
  weights: { relevance: 70, recency: 20, continuity: 50 },
};

test("once the speaker moves on, the latest sentence leads whatever the recency slider says", () => {
  // The window still holds the old subject; the latest sentence is about the new one.
  const moved = judged({
    latest: { forest: 0.1, river: 0.8 },
    thread: { forest: 0.6, river: 0.3 },
    sameThought: 0.05,
  });
  expect(rank(moved, defaults.weights)[0]?.id).toBe("river");
  expect(rank({ ...moved, sameThought: 0.95 }, defaults.weights)[0]?.id).toBe(
    "forest",
  );
});

test("a clear change of subject cuts the minimum hold short", () => {
  const frame = focusOn(emptyFrame, "forest", 0);
  const moved = judged({ latest: { forest: 0.1, river: 0.9 } });
  expect(
    direct(frame, { ...moved, sameThought: 0.05 }, defaults, 2000).verdict,
  ).toBe("switched");
  expect(
    direct(frame, { ...moved, sameThought: 0.05 }, defaults, 1000),
  ).toMatchObject({ verdict: "holding", retryAt: 1500 });
});

test("talking at a normal pace, each change of subject lands on the next sentence", () => {
  const subjects = [
    "comics",
    "comics",
    "iron man",
    "iron man",
    "disney",
    "disney",
  ];
  const all = ["comics", "iron man", "disney"];
  let frame = emptyFrame;
  subjects.forEach((subject, index) => {
    const previous = subjects[Math.max(0, index - 2)]!;
    const fresh = index === 0 || subjects[index - 1] !== subject;
    const spread = (main: string, second: string, a: number, b: number) =>
      Object.fromEntries(
        all.map((id) => [id, id === main ? a : id === second ? b : 0.05]),
      );
    const judgments: Judgments = {
      latest: spread(subject, "", 0.85, 0),
      // Right after a change the window is still mostly the previous subject.
      thread: fresh
        ? spread(previous, subject, 0.6, 0.3)
        : spread(subject, previous, 0.6, 0.3),
      fits: 0.95,
      sameThought: frame.focus ? (frame.focus === subject ? 0.9 : 0.1) : null,
    };
    // One sentence every two and a half seconds, no pauses.
    frame = direct(frame, judgments, defaults, index * 2500).frame;
    expect(frame.focus).toBe(subject);
  });
});
