// The library is stored as plain folders and files so the same layout can later live on a real
// disk in the installed app. The browser uses the Origin Private File System; tests use memory.

export type Entry = { name: string; kind: "file" | "directory" };

export interface FileStore {
  read(path: string): Promise<Blob | null>;
  write(path: string, data: Blob | string): Promise<void>;
  /** Removes a file or a directory with everything in it. Missing paths are ignored. */
  remove(path: string): Promise<void>;
  /** Lists a directory. A missing directory is empty. */
  list(path: string): Promise<Entry[]>;
}

const segments = (path: string) => path.split("/").filter(Boolean);

export function memoryStore(): FileStore {
  const files = new Map<string, Blob>();
  const key = (path: string) => segments(path).join("/");
  return {
    async read(path) {
      return files.get(key(path)) ?? null;
    },
    async write(path, data) {
      files.set(key(path), typeof data === "string" ? new Blob([data]) : data);
    },
    async remove(path) {
      const target = key(path);
      for (const name of [...files.keys()])
        if (name === target || name.startsWith(`${target}/`))
          files.delete(name);
    },
    async list(path) {
      const prefix = key(path) ? `${key(path)}/` : "";
      const entries = new Map<string, Entry>();
      for (const name of files.keys()) {
        if (!name.startsWith(prefix)) continue;
        const [first, ...rest] = name.slice(prefix.length).split("/");
        if (first)
          entries.set(first, {
            name: first,
            kind: rest.length ? "directory" : "file",
          });
      }
      return [...entries.values()];
    },
  };
}

export function opfsSupported() {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.storage?.getDirectory === "function" &&
    typeof FileSystemFileHandle !== "undefined" &&
    "createWritable" in FileSystemFileHandle.prototype
  );
}

export function opfsStore(root = "echoframe"): FileStore {
  const isNotFound = (error: unknown) =>
    error instanceof DOMException &&
    (error.name === "NotFoundError" || error.name === "TypeMismatchError");

  async function directory(parts: string[], create: boolean) {
    let dir = await navigator.storage.getDirectory();
    for (const part of [root, ...parts])
      dir = await dir.getDirectoryHandle(part, { create });
    return dir;
  }

  async function orNull<T>(work: () => Promise<T>) {
    try {
      return await work();
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  return {
    async read(path) {
      const parts = segments(path);
      const name = parts.pop()!;
      return orNull(async () => {
        const dir = await directory(parts, false);
        return (await dir.getFileHandle(name)).getFile();
      });
    },
    async write(path, data) {
      const parts = segments(path);
      const name = parts.pop()!;
      const dir = await directory(parts, true);
      const writable = await (
        await dir.getFileHandle(name, { create: true })
      ).createWritable();
      await writable.write(data);
      await writable.close();
    },
    async remove(path) {
      const parts = segments(path);
      const name = parts.pop()!;
      await orNull(async () =>
        (await directory(parts, false)).removeEntry(name, { recursive: true }),
      );
    },
    async list(path) {
      const dir = await orNull(() => directory(segments(path), false));
      if (!dir) return [];
      const entries: Entry[] = [];
      for await (const handle of dir.values())
        entries.push({ name: handle.name, kind: handle.kind });
      return entries;
    },
  };
}
