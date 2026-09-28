import { expect, test } from "bun:test";
import {
  Library,
  assetKind,
  defaultEchoConfig,
  normalizeConfig,
  normalizeTags,
} from "./library";
import { memoryStore } from "./store";

function library() {
  let clock = 0;
  let id = 0;
  const store = memoryStore();
  return {
    store,
    library: new Library(
      store,
      () => new Date(Date.UTC(2026, 0, 1, 0, 0, clock++)).toISOString(),
      () => `id-${++id}`,
    ),
  };
}

test("profiles keep separate libraries", async () => {
  const { library: lib } = library();
  const ada = await lib.createProfile("  Ada   Lovelace ");
  const grace = await lib.createProfile("Grace");
  expect(ada.name).toBe("Ada Lovelace");
  await lib.createFolder(ada.id, "Forest talk");
  expect(await lib.folders(ada.id)).toHaveLength(1);
  expect(await lib.folders(grace.id)).toHaveLength(0);

  await lib.removeProfile(ada.id);
  expect((await lib.profiles()).map((p) => p.name)).toEqual(["Grace"]);
  expect(await lib.folders(ada.id)).toHaveLength(0);
});

test("settings belong to one profile", async () => {
  const { library: lib } = library();
  const profile = await lib.createProfile("Ada");
  expect(await lib.settings(profile.id)).toEqual({});
  await lib.saveSettings(profile.id, { jevKey: "ts_123" });
  expect(await lib.settings(profile.id)).toEqual({ jevKey: "ts_123" });
});

test("folders summarize their assets and sort by recent activity", async () => {
  const { library: lib } = library();
  const { id: profile } = await lib.createProfile("Ada");
  const older = await lib.createFolder(profile, "Older");
  const newer = await lib.createFolder(profile, "");
  expect(newer.name).toBe("Untitled folder");
  expect(newer.config).toEqual(defaultEchoConfig);

  const image = await lib.addFile(
    profile,
    older.id,
    new File([new Uint8Array([1, 2, 3])], "canopy.webp", {
      type: "image/webp",
    }),
  );
  const [first, second] = await lib.folders(profile);
  expect(first).toMatchObject({
    id: older.id,
    assetCount: 1,
    coverId: image.id,
  });
  expect(second).toMatchObject({ id: newer.id, assetCount: 0 });
  expect(second!.coverId).toBeUndefined();
});

test("files become typed assets; text is stored inline and media as a blob", async () => {
  const { library: lib, store } = library();
  const { id: profile } = await lib.createProfile("Ada");
  const { id: folder } = await lib.createFolder(profile, "Forest");
  const bytes = new Uint8Array([9, 8, 7]);

  const audio = await lib.addFile(
    profile,
    folder,
    new File([bytes], "rain.mp3", { type: "audio/mpeg" }),
  );
  const text = await lib.addFile(
    profile,
    folder,
    new File(["Trees move water."], "notes.md"),
  );

  expect(audio).toMatchObject({ kind: "audio", name: "rain", size: 3 });
  expect(text).toMatchObject({ kind: "text", text: "Trees move water." });
  const blob = await lib.assetBlob(profile, folder, audio.id);
  expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(bytes);
  expect(await lib.assetBlob(profile, folder, text.id)).toBeNull();

  await expect(
    lib.addFile(
      profile,
      folder,
      new File(["x"], "deck.pdf", { type: "application/pdf" }),
    ),
  ).rejects.toThrow("not an image, audio file, or text document");

  await lib.removeAsset(profile, folder, audio.id);
  expect((await lib.assets(profile, folder)).map((a) => a.id)).toEqual([
    text.id,
  ]);
  expect(
    await store.list(`profiles/${profile}/folders/${folder}/assets`),
  ).toEqual([{ name: `${text.id}.json`, kind: "file" }]);
});

test("asset edits normalize tags and keep content for text only", async () => {
  const { library: lib } = library();
  const { id: profile } = await lib.createProfile("Ada");
  const { id: folder } = await lib.createFolder(profile, "Forest");
  const note = await lib.addNote(profile, folder, {
    name: "Evaporation",
    text: "Leaves release water.",
    tags: ["Water", "water ", "  leaf  cycle"],
  });
  expect(note.tags).toEqual(["water", "leaf cycle"]);

  const edited = await lib.updateAsset(profile, folder, note.id, {
    description: "  Why forests make rain  ",
    text: "Leaves release a lot of water.",
    tags: ["Rain"],
  });
  expect(edited).toMatchObject({
    description: "Why forests make rain",
    text: "Leaves release a lot of water.",
    tags: ["rain"],
  });
});

test("folder config is normalized on read and write", async () => {
  const { library: lib } = library();
  const { id: profile } = await lib.createProfile("Ada");
  const folder = await lib.createFolder(profile, "Forest");
  const updated = await lib.updateFolder(profile, folder.id, {
    name: "Water engine",
    config: {
      ...defaultEchoConfig,
      mode: "backdrop",
      holdSeconds: 900,
      weights: { relevance: -4, recency: 40, continuity: 60 },
    },
  });
  expect(updated.name).toBe("Water engine");
  expect(updated.config).toMatchObject({
    mode: "backdrop",
    holdSeconds: 60,
    weights: { relevance: 0, recency: 40, continuity: 60 },
  });
  expect(normalizeConfig({ mode: "carousel" as never }).mode).toBe("spatial");
});

test("helpers classify files and clean tags", () => {
  expect(assetKind({ type: "image/png", name: "a.png" })).toBe("image");
  expect(assetKind({ type: "", name: "Talk.MD" })).toBe("text");
  expect(assetKind({ type: "video/mp4", name: "a.mp4" })).toBeNull();
  expect(normalizeTags(["", " A  B ", "a b"])).toEqual(["a b"]);
});
