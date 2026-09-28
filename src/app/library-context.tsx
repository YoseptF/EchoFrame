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
import { Library, type Asset, type Profile } from "@/lib/library/library";
import { opfsStore } from "@/lib/library/store";

const sessionKey = "echoframe.profile";

type LibraryState = {
  library: Library;
  /** Bumped after every change so readers reload. */
  revision: number;
  refresh: () => void;
  profile: Profile | null;
  /** False until the remembered profile has been checked. */
  ready: boolean;
  signIn: (profile: Profile) => void;
  signOut: () => void;
};

const LibraryContext = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const library = useMemo(() => new Library(opfsStore()), []);
  const [revision, setRevision] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const id = localStorage.getItem(sessionKey);
    if (!id) return setReady(true);
    library
      .profile(id)
      .then(setProfile)
      .finally(() => setReady(true));
  }, [library]);

  // Keep the signed-in profile's name current after a rename.
  useEffect(() => {
    if (profile)
      library.profile(profile.id).then((current) => {
        if (current && current.name !== profile.name) setProfile(current);
      });
  }, [library, revision, profile]);

  const value = useMemo<LibraryState>(
    () => ({
      library,
      revision,
      refresh,
      profile,
      ready,
      signIn(next) {
        localStorage.setItem(sessionKey, next.id);
        // Ask the browser not to evict the library under storage pressure.
        navigator.storage?.persist?.();
        setProfile(next);
      },
      signOut() {
        localStorage.removeItem(sessionKey);
        setProfile(null);
      },
    }),
    [library, revision, refresh, profile, ready],
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
