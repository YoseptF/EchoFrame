import { expect, test } from "bun:test";
import { zipSync } from "fflate";
import {
  BundleError,
  exportBundle,
  importBundle,
  readBundle,
  unzip,
} from "./bundle";
import { Library } from "./library";
import { memoryStore } from "./store";

const encode = (value: string) => new TextEncoder().encode(value);
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const manifest = (assets: unknown[], extra: object = {}) =>
  JSON.stringify({
    format: "echoframe.folder",
    version: 1,
    assets,
    ...extra,
  });

function files(entries: Record<string, string | Uint8Array>) {
  return new Map(
    Object.entries(entries).map(([path, data]) => [
      path,
      new Blob([data as BlobPart]),
    ]),
  );
}

test("a manifest inside one top-level directory is read with its files", async () => {
  const bundle = await readBundle(
    files({
      "mcu/echoframe.json": manifest(
        [
          {
            file: "images/iron-man.png",
            name: "Iron Man poster",
            description: "The 2008 poster.",
            tags: ["Iron Man", " phase 1 ", "iron man"],
            source: "https://example.com",
          },
          { name: "Phases", text: "Phase One ran from 2008 to 2012." },
          { file: "./notes/stones.md", tags: ["infinity stones"] },
        ],
        { name: "The MCU", config: { mode: "backdrop", holdSeconds: 999 } },
      ),
      "mcu/images/iron-man.png": png,
      "mcu/notes/stones.md": "Six stones.",
    }),
  );
  expect(bundle.name).toBe("The MCU");
  expect(bundle.config).toMatchObject({ mode: "backdrop", holdSeconds: 60 });
  expect(bundle.skipped).toEqual([]);
  expect(bundle.entries.map(({ file, ...entry }) => entry)).toEqual([
    {
      name: "Iron Man poster",
      description: "The 2008 poster.",
      tags: ["iron man", "phase 1"],
      kind: "image",
    },
    {
      name: "Phases",
      description: "",
      tags: [],
      kind: "text",
      text: "Phase One ran from 2008 to 2012.",
    },
    {
      name: "stones",
      description: "",
      tags: ["infinity stones"],
      kind: "text",
      text: "Six stones.",
    },
  ]);
  expect(bundle.entries[0]!.file).toMatchObject({
    name: "iron-man.png",
    type: "image/png",
  });
});

test("bad entries are skipped with a reason and the rest still import", async () => {
  const bundle = await readBundle(
    files({
      "echoframe.json": manifest([
        { file: "missing.jpg" },
        { file: "clip.mov" },
        { file: "../secret.png" },
        { name: "Empty" },
        { file: "ok.png", description: "Fine." },
      ]),
      "clip.mov": "x",
      "ok.png": png,
    }),
  );
  expect(bundle.entries.map((entry) => entry.name)).toEqual(["ok"]);
  expect(bundle.skipped).toEqual([
    { item: "missing.jpg", reason: "file not found" },
    { item: "clip.mov", reason: "unsupported file type" },
    { item: "../secret.png", reason: "points outside the folder" },
    { item: "Empty", reason: "has neither a file nor text" },
  ]);
});

test("a folder without a valid manifest is refused with a plain explanation", async () => {
  const refuse = (entries: Record<string, string>) =>
    readBundle(files(entries)).catch((error) => error);
  expect(await refuse({ "a.png": "x" })).toBeInstanceOf(BundleError);
  expect((await refuse({ "echoframe.json": "{" })).message).toContain(
    "isn’t valid JSON",
  );
  expect(
    (await refuse({ "echoframe.json": '{"format":"other","version":1}' }))
      .message,
  ).toContain('"format": "echoframe.folder"');
  expect(() => unzip(encode("not a zip"))).toThrow(BundleError);
});

test("zips unpack without macOS clutter", () => {
  const zipped = zipSync({
    "mcu/echoframe.json": encode("{}"),
    "mcu/images/": new Uint8Array(),
    "__MACOSX/mcu/._echoframe.json": encode("junk"),
    "mcu/.DS_Store": encode("junk"),
  });
  expect([...unzip(zipped).keys()]).toEqual(["mcu/echoframe.json"]);
});

test("export and import round-trip a folder", async () => {
  let id = 0;
  const library = new Library(memoryStore(), undefined, () => `id-${++id}`);
  const source = await library.createFolder("p", "The MCU");
  await library.updateFolder("p", source.id, {
    config: { ...source.config, mode: "presentation" },
  });
  const image = await library.addFile(
    "p",
    source.id,
    new File([png], "poster.png", { type: "image/png" }),
  );
  await library.updateAsset("p", source.id, image.id, {
    name: "Poster",
    description: "The poster.",
    tags: ["iron man"],
  });
  await library.addNote("p", source.id, {
    name: "Phases",
    text: "Phase One.",
    tags: ["phases"],
  });

  const exported = await exportBundle(library, "p", source.id);
  expect(exported.name).toBe("the-mcu.zip");
  const bundle = await readBundle(unzip(exported.data));
  expect(bundle).toMatchObject({
    name: "The MCU",
    config: { mode: "presentation" },
  });

  const copy = await library.createFolder("p", bundle.name!);
  expect(await importBundle(library, "p", copy.id, bundle)).toBe(2);
  const assets = await library.assets("p", copy.id);
  expect(
    assets.map(({ kind, name, description, tags, text }) => ({
      kind,
      name,
      description,
      tags,
      text,
    })),
  ).toEqual([
    {
      kind: "image",
      name: "Poster",
      description: "The poster.",
      tags: ["iron man"],
      text: undefined,
    },
    {
      kind: "text",
      name: "Phases",
      description: "",
      tags: ["phases"],
      text: "Phase One.",
    },
  ]);
  const bytes = await library.assetBlob("p", copy.id, assets[0]!.id);
  expect(new Uint8Array(await bytes!.arrayBuffer())).toEqual(png);
});
