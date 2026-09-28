import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  Library,
  type Account,
  type Asset,
  type Profile,
} from "@/lib/library/library";
import { opfsStore } from "@/lib/library/store";

// The last signed-in account, so the library still opens without a connection.
const accountKey = "echoframe.account";

type LibraryState = {
  library: Library;
  /** Bumped after every change so readers reload. */
  revision: number;
  refresh: () => void;
  /** The signed-in account's library on this device. */
  profile: Profile | null;
  /** False until the session has been checked. */
  ready: boolean;
  /** Whether this deployment has Google sign-in configured. */
  google: boolean;
  /** True when the session couldn't be checked and the cached account was used. */
  offline: boolean;
  signOut: () => Promise<void>;
};

const LibraryContext = createContext<LibraryState | null>(null);

function cachedAccount(): Account | null {
  try {
    return JSON.parse(localStorage.getItem(accountKey) ?? "null");
  } catch {
    return null;
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const library = useMemo(() => new Library(opfsStore()), []);
  const [revision, setRevision] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [google, setGoogle] = useState(false);
  const [offline, setOffline] = useState(false);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    async function open(account: Account) {
      setProfile(await library.saveProfile(account));
      // Ask the browser not to evict the library under storage pressure.
      navigator.storage?.persist?.();
    }
    fetch("/api/session")
      .then(
        (response) =>
          response.json() as Promise<{ user: Account | null; google: boolean }>,
      )
      .then(async ({ user, google }) => {
        setGoogle(google);
        if (!user) return localStorage.removeItem(accountKey);
        localStorage.setItem(accountKey, JSON.stringify(user));
        await open(user);
      })
      .catch(async () => {
        const account = cachedAccount();
        setOffline(true);
        if (account) await open(account);
      })
      .finally(() => setReady(true));
  }, [library]);

  const value = useMemo<LibraryState>(
    () => ({
      library,
      revision,
      refresh,
      profile,
      ready,
      google,
      offline,
      async signOut() {
        await fetch("/auth/sign-out", { method: "POST" }).catch(() => {});
        localStorage.removeItem(accountKey);
        window.location.assign("/");
      },
    }),
    [library, revision, refresh, profile, ready, google, offline],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary needs a LibraryProvider");
  return context;
}

/** The signed-in profile. Only use below the signed-in routes. */
export function useProfile() {
  const { profile } = useLibrary();
  if (!profile) throw new Error("useProfile needs a signed-in profile");
  return profile;
}

type Data<T> = { data?: T; error?: Error; loading: boolean };

/** Reads from the library and reloads whenever anything changes. */
export function useLibraryData<T>(
  load: (library: Library) => Promise<T>,
  deps: DependencyList,
): Data<T> {
  const { library, revision } = useLibrary();
  const [state, setState] = useState<Data<T>>({ loading: true });
  useEffect(() => {
    let live = true;
    setState((current) => ({ ...current, loading: true }));
    load(library).then(
      (data) => live && setState({ data, loading: false }),
      (error: Error) => live && setState({ error, loading: false }),
    );
    return () => {
      live = false;
    };
  }, [library, revision, ...deps]);
  return state;
}

/** Runs a change, refreshes readers, and reports failure in a toast. */
export function useLibraryAction() {
  const { library, refresh } = useLibrary();
  return useCallback(
    async <T,>(
      change: (library: Library) => Promise<T>,
      success?: string,
    ): Promise<T | undefined> => {
      try {
        const result = await change(library);
        if (success) toast.success(success);
        return result;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong.",
        );
        return undefined;
      } finally {
        refresh();
      }
    },
    [library, refresh],
  );
}

/** An object URL for an image or audio asset, revoked when no longer shown. */
export function useAssetUrl(
  folderId: string,
  asset: Pick<Asset, "id" | "kind" | "mimeType"> | undefined,
) {
  const { library } = useLibrary();
  const profile = useProfile();
  const [url, setUrl] = useState<string>();
  const id = asset?.kind === "text" ? undefined : asset?.id;
  const type = asset?.mimeType;
  useEffect(() => {
    if (!id) return setUrl(undefined);
    let live = true;
    let objectUrl: string | undefined;
    library.assetBlob(profile.id, folderId, id).then((blob) => {
      if (!live || !blob) return;
      objectUrl = URL.createObjectURL(new Blob([blob], { type }));
      setUrl(objectUrl);
    });
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [library, profile.id, folderId, id, type]);
  return url;
}
