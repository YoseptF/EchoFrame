import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  AudioLines,
  FileText,
  ImageIcon,
  NotebookPen,
  Search,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  assetKind,
  needsDescription,
  type Asset,
  type AssetKind,
} from "@/lib/library/library";
import { cn } from "@/lib/utils";
import { useAssetUrl, useLibraryAction, useProfile } from "../library-context";
import { AssetSheet } from "./asset-sheet";
import { TagInput } from "./tag-input";

const accept = "image/*,audio/*,text/plain,text/markdown,.md,.markdown,.txt";
const kindIcons = { image: ImageIcon, audio: AudioLines, text: FileText };

function matches(asset: Asset, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [
    asset.name,
    asset.description,
    asset.text ?? "",
    ...asset.tags,
  ]
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export function AssetLibrary({
  folderId,
  assets,
}: {
  folderId: string;
  assets: Asset[];
}) {
  const profile = useProfile();
  const act = useLibraryAction();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AssetKind | "all">("all");
  const [editingId, setEditingId] = useState<string>();

  const folderTags = useMemo(
    () => [...new Set(assets.flatMap((asset) => asset.tags))].sort(),
    [assets],
  );
  const visible = assets.filter(
    (asset) => (kind === "all" || asset.kind === kind) && matches(asset, query),
  );
  const undescribed = assets.filter(needsDescription).length;

  async function upload(files: File[]) {
    const accepted = files.filter((file) => assetKind(file));
    const rejected = files.length - accepted.length;
    if (rejected)
      toast.error(
        `${rejected === 1 ? "1 file was" : `${rejected} files were`} skipped. Add images, audio, or text documents.`,
      );
    if (!accepted.length) return;
    setUploading(accepted.length);
    let added = 0;
    for (const file of accepted) {
      const asset = await act((library) =>
        library.addFile(profile.id, folderId, file),
      );
      if (asset) added++;
      setUploading((count) => count - 1);
    }
    if (added)
      toast.success(added === 1 ? "1 asset added" : `${added} assets added`, {
        description:
          "Describe and tag them so Jev can find them while you speak.",
      });
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    upload([...event.dataTransfer.files]);
  }

  const dropProps = {
    onDragOver(event: DragEvent) {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave(event: DragEvent) {
      if (!event.currentTarget.contains(event.relatedTarget as Node))
        setDragging(false);
    },
    onDrop: drop,
  };

  const addButtons = (
    <>
      <Button onClick={() => input.current?.click()} disabled={uploading > 0}>
        {uploading ? <Spinner /> : <Upload />}
        {uploading ? `Adding ${uploading}…` : "Add files"}
      </Button>
      <NoteDialog folderId={folderId} folderTags={folderTags} />
    </>
  );

  return (
    <div
      {...dropProps}
      className={cn(
        "relative grid gap-5 rounded-xl transition-shadow",
        dragging && "ring-2 ring-primary ring-offset-4 ring-offset-background",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(event) => {
          upload([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
      {assets.length === 0 ? (
        <Empty
          className={cn(
            "border border-dashed py-16 transition-colors",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Upload />
            </EmptyMedia>
            <EmptyTitle>Drop your material here</EmptyTitle>
            <EmptyDescription>
              Images, audio, and text notes. Everything stays in this folder on
              this device.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            {addButtons}
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <InputGroup className="w-full sm:w-72">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search names, descriptions, tags"
                aria-label="Search assets"
              />
            </InputGroup>
            <ToggleGroup
              type="single"
              variant="outline"
              value={kind}
              onValueChange={(value) =>
                setKind((value || "all") as AssetKind | "all")
              }
              aria-label="Asset type"
            >
              <ToggleGroupItem value="all" className="px-3">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="image" aria-label="Images">
                <ImageIcon />
              </ToggleGroupItem>
              <ToggleGroupItem value="audio" aria-label="Audio">
                <AudioLines />
              </ToggleGroupItem>
              <ToggleGroupItem value="text" aria-label="Text">
                <FileText />
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="flex flex-wrap gap-2 sm:ml-auto">{addButtons}</div>
          </div>
          {undescribed > 0 && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <TriangleAlert className="size-4 text-primary" />
              {undescribed === 1
                ? "1 asset needs a description before Jev can match it to your speech."
                : `${undescribed} assets need descriptions before Jev can match them to your speech.`}
            </p>
          )}
          {visible.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visible.map((asset) => (
                <li key={asset.id}>
                  <AssetCard
                    folderId={folderId}
                    asset={asset}
                    onOpen={() => setEditingId(asset.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyTitle>Nothing matches</EmptyTitle>
                <EmptyDescription>
                  Try another word or asset type.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </>
      )}
      <AssetSheet
        folderId={folderId}
        asset={assets.find((asset) => asset.id === editingId)}
        folderTags={folderTags}
        onClose={() => setEditingId(undefined)}
      />
    </div>
  );
}

function AssetCard({
  folderId,
  asset,
  onOpen,
}: {
  folderId: string;
  asset: Asset;
  onOpen: () => void;
}) {
  const url = useAssetUrl(folderId, asset);
  const Icon = kindIcons[asset.kind];
  return (
    <Card className="group relative h-full gap-0 overflow-hidden py-0 transition-colors focus-within:border-primary/50 hover:border-primary/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {asset.kind === "image" && url ? (
          <img
            src={url}
            alt={asset.description || asset.name}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : asset.kind === "text" ? (
          <p className="line-clamp-6 px-5 pt-12 pb-5 text-sm leading-6 whitespace-pre-line text-muted-foreground">
            {asset.text}
          </p>
        ) : (
          <div className="grid size-full place-items-center bg-[radial-gradient(ellipse_at_50%_60%,#15637440,transparent_65%)]">
            <Icon className="size-10 text-primary/80" />
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute top-3 left-3 gap-1 bg-background/80 backdrop-blur"
        >
          <Icon /> {asset.kind}
        </Badge>
      </div>
      <CardHeader className="gap-1.5 pt-4">
        <CardTitle className="truncate">
          <button
            type="button"
            onClick={onOpen}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {asset.name}
          </button>
        </CardTitle>
        <CardDescription
          className={cn(
            "line-clamp-2",
            needsDescription(asset) && "text-primary/80",
          )}
        >
          {needsDescription(asset)
            ? "Add a description"
            : asset.description || "Text note"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5 pt-3 pb-4">
        {asset.tags.length ? (
          asset.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
      </CardContent>
    </Card>
  );
}

function NoteDialog({
  folderId,
  folderTags,
}: {
  folderId: string;
  folderTags: string[];
}) {
  const profile = useProfile();
  const act = useLibraryAction();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const note = await act(
      (library) => library.addNote(profile.id, folderId, { name, text, tags }),
      "Note added",
    );
    if (!note) return;
    setOpen(false);
    setName("");
    setText("");
    setTags([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <NotebookPen /> Write a note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={save} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Write a note</DialogTitle>
            <DialogDescription>
              A definition, quote, or explanation that can appear beside your
              visuals.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="note-name">Title</FieldLabel>
              <Input
                id="note-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Transpiration"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="note-text">Note</FieldLabel>
              <Textarea
                id="note-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Trees pull water from the soil and release it through their leaves."
                rows={6}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="note-tags">Tags</FieldLabel>
              <TagInput
                id="note-tags"
                value={tags}
                onChange={setTags}
                suggestions={folderTags}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || !text.trim()}>
              Add note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
