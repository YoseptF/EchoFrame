import { expect, test } from "bun:test";
import { matchStory } from "./stories";

test("matches complete words regardless of case or punctuation", () => {
  expect(matchStory("Look at that NEBULA!")?.story.id).toBe("space");
  expect(matchStory("Forestry is interesting")).toBeUndefined();
});

test("chooses the scene with the most relevant tags", () => {
  const result = matchStory("Leave the city for the forest and green trees.");
  expect(result?.story.id).toBe("wild");
  expect(result?.sceneIndex).toBe(0);
});

test("empty or unrelated text has no match", () => {
  expect(matchStory("")).toBeUndefined();
  expect(matchStory("Tell me about cooking")).toBeUndefined();
});
