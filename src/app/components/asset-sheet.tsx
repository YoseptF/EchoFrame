import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Asset } from "@/lib/library/library";
import { fileSize } from "../format";
import { useAssetUrl, useLibraryAction, useProfile } from "../library-context";
import { ConfirmDialog } from "./confirm-dialog";
import { TagInput } from "./tag-input";

const kindLabel = { image: "Image", audio: "Audio", text: "Text" };

/** Edits what an asset is called, what it means, and how it is tagged. */
export function AssetSheet({
  folderId,
  asset,
  folderTags,
  onClose,
}: {
  folderId: string;
  asset: Asset | undefined;
  folderTags: string[];
  onClose: () => void;
}) {
  const profile = useProfile();
  const act = useLibraryAction();
  const url = useAssetUrl(folderId, asset);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset only when a different asset opens, so a background refresh keeps unsaved edits.
  useEffect(() => {
    if (!asset) return;
    setName(asset.name);
    setDescription(asset.description);
    setTags(asset.tags);
    setText(asset.text ?? "");
  }, [asset?.id]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!asset) return;
    setBusy(true);
    const saved = await act(
      (library) =>
        library.updateAsset(profile.id, folderId, asset.id, {
          name,
          description,
          tags,
          ...(asset.kind === "text" ? { text } : {}),
        }),
      "Asset saved",
    );
    setBusy(false);
    if (saved) onClose();
  }

  return (
    <Sheet open={Boolean(asset)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        {asset && (
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="border-b">
              <SheetTitle className="pr-8">
                Edit {kindLabel[asset.kind].toLowerCase()}
              </SheetTitle>
              <SheetDescription>
                {kindLabel[asset.kind]} · {fileSize(asset.size)} · Added{" "}
                {new Date(asset.createdAt).toLocaleDateString()}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1">
              <FieldGroup className="p-4">
                {asset.kind === "image" && url && (
                  <img
                    src={url}
                    alt={description || name}
                    className="max-h-72 w-full rounded-lg border object-contain bg-muted"
                  />
                )}
                {asset.kind === "audio" && url && (
                  <audio src={url} controls className="w-full" />
                )}
                <Field>
                  <FieldLabel htmlFor="asset-name">Name</FieldLabel>
                  <Input
                    id="asset-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="asset-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="asset-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={
                      asset.kind === "image"
                        ? "Sunlight through a forest canopy, soil and roots below"
                        : asset.kind === "audio"
                          ? "Rain on leaves, recorded at dawn"
                          : "Why forests make their own rain"
                    }
                    rows={3}
                  />
                  <FieldDescription>
                    Say what this{" "}
                    {asset.kind === "text"
                      ? "note is about"
                      : "shows or sounds like"}
                    . Jev matches your speech against these words, not the
                    pixels.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="asset-tags">Tags</FieldLabel>
                  <TagInput
                    id="asset-tags"
                    value={tags}
                    onChange={setTags}
                    suggestions={folderTags}
                  />
                  <FieldDescription>
                    Topics this belongs to. Shared tags keep related material
                    together on stage.
                  </FieldDescription>
                </Field>
                {asset.kind === "text" && (
                  <Field>
                    <FieldLabel htmlFor="asset-text">Text</FieldLabel>
                    <Textarea
                      id="asset-text"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      rows={10}
                      className="min-h-48 font-sans"
                    />
                  </Field>
                )}
              </FieldGroup>
            </ScrollArea>
            <SheetFooter className="flex-row justify-between border-t">
              <ConfirmDialog
                title={`Delete “${asset.name}”?`}
                description="It will be removed from this folder on this device. This can’t be undone."
                action="Delete"
                onConfirm={async () => {
                  await act(
                    (library) =>
                      library.removeAsset(profile.id, folderId, asset.id),
                    "Asset deleted",
                  );
                  onClose();
                }}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                  >
                    <Trash2 /> Delete
                  </Button>
                }
              />
              <Button type="submit" disabled={busy}>
                Save changes
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
