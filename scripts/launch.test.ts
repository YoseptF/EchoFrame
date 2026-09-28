import { expect, test } from "bun:test";
import { COOLDOWN_DAYS, majorChangesets, parseLaunch, readyOn } from "./launch";

const words = (n: number) => "Echoframe finally does the thing it promised. ".repeat(n);
const launch = (overrides: Partial<Record<string, string>> = {}) => {
  const s = { why: words(10), changes: "Nothing breaks; 1.0 is a promise of stability.", tweet: "Echoframe 1.0 is out. Stable, documented, and here to stay.", linkedin: words(14), ...overrides };
  return `# Echoframe 1.0\n\n## Why this is a major\n\n${s.why}\n\n## What changes for people already using it\n\n${s.changes}\n\n## Tweet\n\n${s.tweet}\n\n## LinkedIn post\n\n${s.linkedin}\n`;
};

test("a complete launch file parses", () => {
  const { launch: l, errors } = parseLaunch("launches/v1.md", launch());
  expect(errors).toEqual([]);
  expect(l?.major).toBe(1);
  expect(l?.title).toBe("Echoframe 1.0");
});

test("the template is not a launch", async () => {
  const { errors } = parseLaunch("launches/v1.md", await Bun.file(`${import.meta.dir}/../launches/TEMPLATE.md`).text());
  expect(errors.length).toBeGreaterThanOrEqual(4);
});

test("short sections, long tweets and placeholders are refused", () => {
  expect(parseLaunch("launches/v1.md", launch({ why: "it is cool" })).errors[0]).toContain("at least 400");
  expect(parseLaunch("launches/v1.md", launch({ tweet: "x".repeat(281) })).errors[0]).toContain("limit is 280");
  expect(parseLaunch("launches/v1.md", launch({ linkedin: `TODO ${words(20)}` })).errors[0]).toContain("placeholder");
});

test("the file name decides the major", () => {
  expect(parseLaunch("launches/one.md", launch()).errors[0]).toContain("v<major>.md");
});

test("only major changesets for echoframe are found", () => {
  const cs = (bump: string) => `---\n"echoframe": ${bump}\n---\n\nSomething.\n`;
  expect(majorChangesets([
    { file: "a.md", text: cs("major") },
    { file: "b.md", text: cs("minor") },
    { file: "c.md", text: "---\n---\n\nmajor rework of nothing\n" },
  ])).toEqual(["a.md"]);
});

test("a launch is ready a cooldown after it was committed", () => {
  const armed = new Date("2026-10-01T12:00:00Z");
  expect(readyOn(armed)?.getTime()).toBe(armed.getTime() + COOLDOWN_DAYS * 86_400_000);
  expect(readyOn(undefined)).toBeUndefined();
});
