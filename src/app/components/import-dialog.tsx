import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AudioLines,
  FileArchive,
  FileText,
  FolderOpen,
  ImageIcon,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import {
  BundleError,
  importBundle,
  readBundle,
  unzip,
  type Bundle,
} from "@/lib/library/bundle";
import { useLibrary, useProfile } from "../library-context";

const formatUrl =
  "https://github.com/YoseptF/EchoFrame/blob/main/docs/folder-format.md";

/** Files keyed by path, from a picked .zip or a picked directory. */
export async function bundleFiles(files: File[]) {
  const zip = files.find((file) => /\.zip$/i.test(file.name));
  if (zip) return unzip(new Uint8Array(await zip.arrayBuffer()));
  return new Map(
    files.map((file) => [file.webkitRelativePath || file.name, file as Blob]),
  );
}

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

/** Imports a folder prepared in the EchoFrame folder format, into a new folder or an existing one. */
export function ImportDialog({
  folderId,
  trigger,
  open,
  onOpenChange,
  files,
  onImported,
}: {
  /** Add to this folder; without it, the import creates a new folder. */
  folderId?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Files dropped onto the page, read as soon as the dialog opens. */
  files?: File[];
  onImported?: (folderId: string) => void;
}) {
  const profile = useProfile();
  const { library, refresh } = useLibrary();
  const [ownOpen, setOwnOpen] = useState(false);
  const [bundle, setBundle] = useState<Bundle>();
  const [error, setError] = useState<string>();
  const [reading, setReading] = useState(false);
  const [done, setDone] = useState<number>();
  const zipInput = useRef<HTMLInputElement>(null);
  const dirInput = useRef<HTMLInputElement>(null);
  const isOpen = open ?? ownOpen;
  const importing = done !== undefined;

  const setOpen = (next: boolean) => {
    if (importing) return;
    setOwnOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setBundle(undefined);
      setError(undefined);
    }
  };

  async function read(picked: File[]) {
    if (!picked.length) return;
    setReading(true);
    setError(undefined);
    setBundle(undefined);
    try {
      setBundle(await readBundle(await bundleFiles(picked)));
    } catch (cause) {
      setError(
        cause instanceof BundleError
          ? cause.message
          : "These files couldn’t be read.",
      );
    } finally {
      setReading(false);
    }
  }

  useEffect(() => {
    if (isOpen && files?.length) read(files);
  }, [isOpen, files]);

  async function run() {
    if (!bundle) return;
    setDone(0);
    try {
      let target = folderId;
      if (!target) {
        const folder = await library.createFolder(
          profile.id,
          bundle.name ?? "Imported folder",
        );
        if (bundle.config)
          await library.updateFolder(profile.id, folder.id, {
            config: bundle.config,
          });
        target = folder.id;
      }
      const added = await importBundle(
        library,
        profile.id,
        target,
        bundle,
        setDone,
      );
      toast.success(`${plural(added, "asset")} imported`, {
        description: bundle.skipped.length
          ? `${plural(bundle.skipped.length, "item")} skipped.`
          : undefined,
      });
      setDone(undefined);
      setOpen(false);
      onImported?.(target);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "The import stopped.",
      );
      setDone(undefined);
    } finally {
      refresh();
    }
  }

  const count = (kind: string) =>
    bundle?.entries.filter((entry) => entry.kind === kind).length ?? 0;
  const undescribed =
    bundle?.entries.filter(
      (entry) => entry.kind !== "text" && !entry.description,
    ).length ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {folderId ? "Import into this folder" : "Import a folder"}
          </DialogTitle>
          <DialogDescription>
            Choose a folder or .zip with an <code>echoframe.json</code> that
            lists each file with its description and tags. Agents and scripts
            can prepare one;{" "}
            <a
              href={formatUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              see the format
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <input
          ref={zipInput}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(event) => {
            read([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
        <input
          ref={dirInput}
          type="file"
          hidden
          {...{ webkitdirectory: "" }}
          onChange={(event) => {
            read([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => zipInput.current?.click()}
            disabled={reading || importing}
          >
            <FileArchive /> Choose .zip
          </Button>
          <Button
            variant="outline"
            onClick={() => dirInput.current?.click()}
            disabled={reading || importing}
          >
            <FolderOpen /> Choose a folder
          </Button>
        </div>

        {reading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Reading…
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Nothing to import</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {bundle && (
          <div className="grid gap-3">
            <Item variant="outline">
              <ItemMedia variant="icon">
                <FolderOpen />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {folderId
                    ? "Adds to this folder"
                    : `Creates “${bundle.name ?? "Imported folder"}”`}
                </ItemTitle>
                <ItemDescription className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="size-3.5" />
                    {plural(count("image"), "image")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <AudioLines className="size-3.5" />
                    {plural(count("audio"), "clip")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="size-3.5" />
                    {plural(count("text"), "note")}
                  </span>
                </ItemDescription>
              </ItemContent>
            </Item>
            {undescribed > 0 && (
              <p className="text-sm text-muted-foreground">
                {plural(undescribed, "file")} without a description will need
                one before Jev can match {undescribed === 1 ? "it" : "them"}.
              </p>
            )}
            {bundle.skipped.length > 0 && (
              <Alert>
                <TriangleAlert />
                <AlertTitle>
                  {plural(bundle.skipped.length, "item")} will be skipped
                </AlertTitle>
                <AlertDescription>
                  <ul className="grid gap-0.5">
                    {bundle.skipped.slice(0, 5).map(({ item, reason }, i) => (
                      <li key={`${item}-${i}`}>
                        {item}: {reason}
                      </li>
                    ))}
                    {bundle.skipped.length > 5 && (
                      <li>and {bundle.skipped.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button onClick={run} disabled={!bundle?.entries.length || importing}>
            {importing && <Spinner />}
            {importing
              ? `Importing ${done} of ${bundle?.entries.length}…`
              : bundle?.entries.length
                ? `Import ${plural(bundle.entries.length, "item")}`
                : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
