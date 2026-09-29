// Folders as plain files: an `echoframe.json` manifest beside the material, as a directory or a
// .zip. People and agents prepare folders this way; export writes the same shape.
// The format is documented in docs/folder-format.md.
import { unzipSync, zipSync, type Zippable } from "fflate";
import {
  normalizeConfig,
  normalizeTags,
  type AssetKind,
  type EchoConfig,
  type Library,
} from "./library";

export const manifestName = "echoframe.json";
const format = "echoframe.folder";
const version = 1;

const types: Record<string, { kind: AssetKind; type: string }> = {
  jpg: { kind: "image", type: "image/jpeg" },
  jpeg: { kind: "image", type: "image/jpeg" },
  png: { kind: "image", type: "image/png" },
  webp: { kind: "image", type: "image/webp" },
  gif: { kind: "image", type: "image/gif" },
  avif: { kind: "image", type: "image/avif" },
  svg: { kind: "image", type: "image/svg+xml" },
  mp3: { kind: "audio", type: "audio/mpeg" },
  m4a: { kind: "audio", type: "audio/mp4" },
  aac: { kind: "audio", type: "audio/aac" },
  wav: { kind: "audio", type: "audio/wav" },
  ogg: { kind: "audio", type: "audio/ogg" },
  oga: { kind: "audio", type: "audio/ogg" },
  opus: { kind: "audio", type: "audio/ogg" },
  flac: { kind: "audio", type: "audio/flac" },
  weba: { kind: "audio", type: "audio/webm" },
  txt: { kind: "text", type: "text/plain" },
  md: { kind: "text", type: "text/markdown" },
  markdown: { kind: "text", type: "text/markdown" },
};

const extension = (path: string) =>
  path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "";

const baseName = (path: string) => path.split("/").at(-1) ?? path;

/** The extension export writes for a stored asset's type. */
function extensionFor(mimeType: string) {
  const known = Object.entries(types).find(([, t]) => t.type === mimeType);
  return (
    known?.[0] ?? mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") ?? "bin"
  );
}

/** One item ready to add to a folder. */
export type BundleEntry = {
  name: string;
  description: string;
  tags: string[];
  kind: AssetKind;
  /** Image or audio bytes, or a text file. */
  file?: File;
  text?: string;
};

export type Bundle = {
  name?: string;
  config?: EchoConfig;
  entries: BundleEntry[];
  skipped: { item: string; reason: string }[];
};

export class BundleError extends Error {}

type ManifestAsset = {
  file?: unknown;
  text?: unknown;
  name?: unknown;
  description?: unknown;
  tags?: unknown;
};

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

/** Reads a folder from its files, keyed by path. The manifest may sit inside one top-level directory. */
export async function readBundle(files: Map<string, Blob>): Promise<Bundle> {
  const manifestPath = [...files.keys()]
    .filter((path) => baseName(path) === manifestName)
    .sort((a, b) => a.split("/").length - b.split("/").length)[0];
  if (!manifestPath)
    throw new BundleError(
      `No ${manifestName} found. Import a folder or .zip made in the EchoFrame folder format.`,
    );
  const root = manifestPath.slice(0, -manifestName.length);

  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(await files.get(manifestPath)!.text());
  } catch {
    throw new BundleError(`${manifestName} isn’t valid JSON.`);
  }
  if (manifest?.format !== format || manifest.version !== version)
    throw new BundleError(
      `${manifestName} must declare "format": "${format}" and "version": ${version}.`,
    );
  if (!Array.isArray(manifest.assets))
    throw new BundleError(`${manifestName} needs an "assets" list.`);

  const entries: BundleEntry[] = [];
  const skipped: Bundle["skipped"] = [];
  for (const [index, raw] of (manifest.assets as ManifestAsset[]).entries()) {
    const item = text(raw?.file) || text(raw?.name) || `Item ${index + 1}`;
    const common = {
      description: text(raw?.description),
      tags: Array.isArray(raw?.tags)
        ? normalizeTags(raw.tags.filter((tag) => typeof tag === "string"))
        : [],
    };
    if (typeof raw?.file === "string" && raw.file.trim()) {
      const relative = raw.file.trim().replace(/^\.\//, "");
      if (relative.split("/").includes("..") || relative.startsWith("/")) {
        skipped.push({ item, reason: "points outside the folder" });
        continue;
      }
      const blob = files.get(root + relative);
      const type = types[extension(relative)];
      if (!blob) skipped.push({ item, reason: "file not found" });
      else if (!type) skipped.push({ item, reason: "unsupported file type" });
      else {
        const name =
          text(raw.name) || baseName(relative).replace(/\.[^.]+$/, "");
        entries.push({
          ...common,
          name,
          kind: type.kind,
          ...(type.kind === "text"
            ? { text: await blob.text() }
            : {
                file: new File([blob], baseName(relative), {
                  type: type.type,
                }),
              }),
        });
      }
    } else if (typeof raw?.text === "string") {
      entries.push({
        ...common,
        name: text(raw.name) || "Note",
        kind: "text",
        text: raw.text,
      });
    } else skipped.push({ item, reason: "has neither a file nor text" });
  }

  return {
    name: text(manifest.name) || undefined,
    config:
      manifest.config && typeof manifest.config === "object"
        ? normalizeConfig(manifest.config as Partial<EchoConfig>)
        : undefined,
    entries,
    skipped,
  };
}

const ignored = (path: string) =>
  path.endsWith("/") ||
  path.startsWith("__MACOSX/") ||
  baseName(path).startsWith("._") ||
  baseName(path) === ".DS_Store";

/** The files inside a .zip, keyed by path. */
export function unzip(data: Uint8Array): Map<string, Blob> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(data);
  } catch {
    throw new BundleError("This .zip couldn’t be opened.");
  }
  const files = new Map<string, Blob>();
  for (const [path, bytes] of Object.entries(entries))
    if (!ignored(path)) files.set(path, new Blob([bytes as BlobPart]));
  return files;
}

/** Adds every entry to a folder, in order. */
export async function importBundle(
  library: Library,
  profileId: string,
  folderId: string,
  bundle: Pick<Bundle, "entries">,
  onProgress?: (done: number) => void,
) {
  let done = 0;
  for (const entry of bundle.entries) {
    const asset = entry.file
      ? await library.addFile(profileId, folderId, entry.file)
      : await library.addNote(profileId, folderId, {
          name: entry.name,
          text: entry.text ?? "",
        });
    await library.updateAsset(profileId, folderId, asset.id, {
      name: entry.name,
      description: entry.description,
      tags: entry.tags,
    });
    done++;
    onProgress?.(done);
  }
  return done;
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** A folder as a .zip: `<folder>/echoframe.json` beside `<folder>/files/…`. */
export async function exportBundle(
  library: Library,
  profileId: string,
  folderId: string,
) {
  const folder = await library.folder(profileId, folderId);
  if (!folder) throw new Error("This folder no longer exists.");
  const assets = await library.assets(profileId, folderId);
  const dir = slug(folder.name) || "folder";
  const zip: Zippable = {};
  const used = new Set<string>();
  const manifestAssets = [];
  for (const asset of assets) {
    const meta = {
      name: asset.name,
      ...(asset.description && { description: asset.description }),
      tags: asset.tags,
    };
    if (asset.kind === "text") {
      manifestAssets.push({ ...meta, text: asset.text ?? "" });
      continue;
    }
    const blob = await library.assetBlob(profileId, folderId, asset.id);
    if (!blob) continue;
    const stem = slug(asset.name) || asset.kind;
    const ext = extensionFor(asset.mimeType);
    let file = `files/${stem}.${ext}`;
    for (let n = 2; used.has(file); n++) file = `files/${stem}-${n}.${ext}`;
    used.add(file);
    // Media is already compressed; store it as is.
    zip[`${dir}/${file}`] = [
      new Uint8Array(await blob.arrayBuffer()),
      { level: 0 },
    ];
    manifestAssets.push({ file, ...meta });
  }
  const manifest = {
    format,
    version,
    name: folder.name,
    config: folder.config,
    assets: manifestAssets,
  };
  zip[`${dir}/${manifestName}`] = new TextEncoder().encode(
    JSON.stringify(manifest, null, 2),
  );
  return { name: `${dir}.zip`, data: zipSync(zip) };
}
