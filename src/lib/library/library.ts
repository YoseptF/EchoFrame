import type { FrameMode } from "@/lib/presentation";
import type { FileStore } from "./store";

// On disk:
//   profiles.json
//   profiles/<profile>/settings.json
//   profiles/<profile>/folders/<folder>/folder.json
//   profiles/<profile>/folders/<folder>/assets/<asset>.json   metadata, text inline
//   profiles/<profile>/folders/<folder>/assets/<asset>.blob   image or audio bytes

/** The local library of one signed-in account on this device. */
export type Profile = {
  id: string;
  name: string;
  email: string | null;
  picture: string | null;
  createdAt: string;
};

export type Account = Pick<Profile, "id" | "name" | "email" | "picture">;

export type ProfileSettings = { jevKey?: string };

/** How a folder's material becomes an echo while someone speaks. */
export type EchoConfig = {
  mode: FrameMode;
  /** Seconds of recent speech that describe the current thought. */
  windowSeconds: number;
  /** Minimum seconds a frame stays up before it may change. */
  holdSeconds: number;
  /** Relative influence of each selection heuristic, 0–100. */
  weights: { relevance: number; recency: number; continuity: number };
  /** BCP 47 language used for speech recognition. */
  language: string;
};

export const defaultEchoConfig: EchoConfig = {
  mode: "spatial",
  windowSeconds: 12,
  holdSeconds: 5,
  weights: { relevance: 70, recency: 20, continuity: 50 },
  language: "en-US",
};

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  config: EchoConfig;
};

export type FolderSummary = Folder & {
  assetCount: number;
  /** An image asset to show on the folder card. */
  coverId?: string;
};

export type AssetKind = "image" | "audio" | "text";

export type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  /** What the asset shows or says. Jev matches speech against words, not pixels. */
  description: string;
  tags: string[];
  mimeType: string;
  size: number;
  createdAt: string;
  /** Content of a text asset. */
  text?: string;
};

export type AssetEdit = Partial<
  Pick<Asset, "name" | "description" | "tags" | "text">
>;

const textExtensions = /\.(txt|md|markdown)$/i;

export function assetKind(file: { type: string; name: string }) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("text/") || textExtensions.test(file.name))
    return "text";
  return null;
}

/** Media needs words before Jev can match it; a text asset speaks for itself. */
export function needsDescription(asset: Pick<Asset, "kind" | "description">) {
  return asset.kind !== "text" && !asset.description.trim();
}

export function normalizeTags(tags: Iterable<string>) {
  const unique = new Set<string>();
  for (const tag of tags) {
    const clean = tag.trim().replace(/\s+/g, " ").toLowerCase();
    if (clean) unique.add(clean);
  }
  return [...unique];
}

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;

/** Fills gaps and bounds values so configs written by older versions keep working. */
export function normalizeConfig(config: Partial<EchoConfig> = {}): EchoConfig {
  const defaults = defaultEchoConfig;
  const weights: Partial<EchoConfig["weights"]> = config.weights ?? {};
  return {
    mode: (["presentation", "backdrop", "spatial"] as const).includes(
      config.mode as FrameMode,
    )
      ? (config.mode as FrameMode)
      : defaults.mode,
    windowSeconds: clamp(config.windowSeconds, 5, 90, defaults.windowSeconds),
    holdSeconds: clamp(config.holdSeconds, 1, 60, defaults.holdSeconds),
    weights: {
      relevance: clamp(weights.relevance, 0, 100, defaults.weights.relevance),
      recency: clamp(weights.recency, 0, 100, defaults.weights.recency),
      continuity: clamp(
        weights.continuity,
        0,
        100,
        defaults.weights.continuity,
      ),
    },
    language:
      typeof config.language === "string" && config.language
        ? config.language
        : defaults.language,
  };
}

const cleanName = (name: string, fallback: string) =>
  name.trim().replace(/\s+/g, " ") || fallback;

export class Library {
  constructor(
    private store: FileStore,
    private now = () => new Date().toISOString(),
    private newId: () => string = () => crypto.randomUUID(),
  ) {}

  private async readJson<T>(path: string): Promise<T | null> {
    const blob = await this.store.read(path);
    return blob ? (JSON.parse(await blob.text()) as T) : null;
  }

  private writeJson(path: string, value: unknown) {
    return this.store.write(path, JSON.stringify(value, null, 2));
  }

  private folderPath(profileId: string, folderId: string) {
    return `profiles/${profileId}/folders/${folderId}`;
  }

  private assetPath(profileId: string, folderId: string, assetId: string) {
    return `${this.folderPath(profileId, folderId)}/assets/${assetId}`;
  }

  // Profiles

  async profiles() {
    return (await this.readJson<Profile[]>("profiles.json")) ?? [];
  }

  async profile(id: string) {
    return (await this.profiles()).find((profile) => profile.id === id) ?? null;
  }

  /** Creates the account's library on first sign-in and keeps its details current. */
  async saveProfile(account: Account) {
    const profiles = await this.profiles();
    const existing = profiles.find((profile) => profile.id === account.id);
    const profile: Profile = {
      ...account,
      name: cleanName(account.name, "Speaker"),
      createdAt: existing?.createdAt ?? this.now(),
    };
    if (JSON.stringify(existing) !== JSON.stringify(profile))
      await this.writeJson("profiles.json", [
        ...profiles.filter((item) => item.id !== account.id),
        profile,
      ]);
    return profile;
  }

  async removeProfile(id: string) {
    const profiles = await this.profiles();
    await this.writeJson(
      "profiles.json",
      profiles.filter((profile) => profile.id !== id),
    );
    await this.store.remove(`profiles/${id}`);
  }

  async settings(profileId: string) {
    return (
      (await this.readJson<ProfileSettings>(
        `profiles/${profileId}/settings.json`,
      )) ?? {}
    );
  }

  async saveSettings(profileId: string, settings: ProfileSettings) {
    await this.writeJson(`profiles/${profileId}/settings.json`, settings);
  }

  // Folders

  async folders(profileId: string): Promise<FolderSummary[]> {
    const entries = await this.store.list(`profiles/${profileId}/folders`);
    const summaries = await Promise.all(
      entries
        .filter((entry) => entry.kind === "directory")
        .map(async (entry) => {
          const folder = await this.folder(profileId, entry.name);
          if (!folder) return null;
          const assets = await this.assets(profileId, folder.id);
          return {
            ...folder,
            assetCount: assets.length,
            coverId: assets.find((asset) => asset.kind === "image")?.id,
          };
        }),
    );
    return summaries
      .filter((summary) => summary !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async folder(profileId: string, folderId: string) {
    const folder = await this.readJson<Folder>(
      `${this.folderPath(profileId, folderId)}/folder.json`,
    );
    return folder
      ? { ...folder, config: normalizeConfig(folder.config) }
      : null;
  }

  async createFolder(profileId: string, name: string) {
    const now = this.now();
    const folder: Folder = {
      id: this.newId(),
      name: cleanName(name, "Untitled folder"),
      createdAt: now,
      updatedAt: now,
      config: defaultEchoConfig,
    };
    await this.writeJson(
      `${this.folderPath(profileId, folder.id)}/folder.json`,
      folder,
    );
    return folder;
  }

  async updateFolder(
    profileId: string,
    folderId: string,
    edit: { name?: string; config?: EchoConfig },
  ) {
    const folder = await this.folder(profileId, folderId);
    if (!folder) throw new Error("This folder no longer exists.");
    const updated: Folder = {
      ...folder,
      name:
        edit.name === undefined
          ? folder.name
          : cleanName(edit.name, folder.name),
      config: edit.config ? normalizeConfig(edit.config) : folder.config,
      updatedAt: this.now(),
    };
    await this.writeJson(
      `${this.folderPath(profileId, folderId)}/folder.json`,
      updated,
    );
    return updated;
  }

  private touchFolder(profileId: string, folderId: string) {
    return this.updateFolder(profileId, folderId, {});
  }

  async removeFolder(profileId: string, folderId: string) {
    await this.store.remove(this.folderPath(profileId, folderId));
  }

  // Assets

  async assets(profileId: string, folderId: string) {
    const dir = `${this.folderPath(profileId, folderId)}/assets`;
    const entries = await this.store.list(dir);
    const assets = await Promise.all(
      entries
        .filter((entry) => entry.name.endsWith(".json"))
        .map((entry) => this.readJson<Asset>(`${dir}/${entry.name}`)),
    );
    return assets
      .filter((asset) => asset !== null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async addFile(profileId: string, folderId: string, file: File) {
    const kind = assetKind(file);
    if (!kind)
      throw new Error(
        `${file.name} is not an image, audio file, or text document.`,
      );
    const asset: Asset = {
      id: this.newId(),
      kind,
      name: file.name.replace(/\.[^.]+$/, "") || file.name,
      description: "",
      tags: [],
      mimeType: file.type || "text/plain",
      size: file.size,
      createdAt: this.now(),
    };
    const path = this.assetPath(profileId, folderId, asset.id);
    if (kind === "text") asset.text = await file.text();
    else await this.store.write(`${path}.blob`, file);
    await this.writeJson(`${path}.json`, asset);
    await this.touchFolder(profileId, folderId);
    return asset;
  }

  async addNote(
    profileId: string,
    folderId: string,
    note: { name: string; text: string; tags?: string[] },
  ) {
    const asset: Asset = {
      id: this.newId(),
      kind: "text",
      name: cleanName(note.name, "Note"),
      description: "",
      tags: normalizeTags(note.tags ?? []),
      mimeType: "text/plain",
      size: new Blob([note.text]).size,
      createdAt: this.now(),
      text: note.text,
    };
    await this.writeJson(
      `${this.assetPath(profileId, folderId, asset.id)}.json`,
      asset,
    );
    await this.touchFolder(profileId, folderId);
    return asset;
  }

  async updateAsset(
    profileId: string,
    folderId: string,
    assetId: string,
    edit: AssetEdit,
  ) {
    const path = `${this.assetPath(profileId, folderId, assetId)}.json`;
    const asset = await this.readJson<Asset>(path);
    if (!asset) throw new Error("This asset no longer exists.");
    const updated: Asset = {
      ...asset,
      name:
        edit.name === undefined ? asset.name : cleanName(edit.name, asset.name),
      description: edit.description?.trim() ?? asset.description,
      tags: edit.tags ? normalizeTags(edit.tags) : asset.tags,
    };
    if (asset.kind === "text" && edit.text !== undefined) {
      updated.text = edit.text;
      updated.size = new Blob([edit.text]).size;
    }
    await this.writeJson(path, updated);
    await this.touchFolder(profileId, folderId);
    return updated;
  }

  async removeAsset(profileId: string, folderId: string, assetId: string) {
    const path = this.assetPath(profileId, folderId, assetId);
    await this.store.remove(`${path}.blob`);
    await this.store.remove(`${path}.json`);
    await this.touchFolder(profileId, folderId);
  }

  assetBlob(profileId: string, folderId: string, assetId: string) {
    return this.store.read(
      `${this.assetPath(profileId, folderId, assetId)}.blob`,
    );
  }
}
