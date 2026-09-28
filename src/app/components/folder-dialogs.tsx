import { useEffect, useState, type FormEvent, type ReactNode } from "react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Folder } from "@/lib/library/library";
import { useLibraryAction, useProfile } from "../library-context";

function NameDialog({
  title,
  description,
  submit,
  initialName = "",
  trigger,
  open,
  onOpenChange,
  onSubmit,
}: {
  title: string;
  description: string;
  submit: string;
  initialName?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  const [ownOpen, setOwnOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const isOpen = open ?? ownOpen;
  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const done = await onSubmit(name);
    setBusy(false);
    if (done) setOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="folder-name">Folder name</FieldLabel>
            <Input
              id="folder-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="The forest is a water engine"
              autoComplete="off"
              autoFocus
              required
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={busy || !name.trim()}>
              {submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewFolderDialog({
  trigger,
  onCreated,
}: {
  trigger: ReactNode;
  onCreated?: (folder: Folder) => void;
}) {
  const profile = useProfile();
  const act = useLibraryAction();
  return (
    <NameDialog
      title="New folder"
      description="A folder holds the images, audio, and notes for one talk, and how its echo is formed."
      submit="Create folder"
      trigger={trigger}
      onSubmit={async (name) => {
        const folder = await act((library) =>
          library.createFolder(profile.id, name),
        );
        if (folder) onCreated?.(folder);
        return Boolean(folder);
      }}
    />
  );
}

export function RenameFolderDialog({
  folder,
  open,
  onOpenChange,
}: {
  folder: Pick<Folder, "id" | "name">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profile = useProfile();
  const act = useLibraryAction();
  return (
    <NameDialog
      title="Rename folder"
      description="The new name appears in your library and during sessions."
      submit="Save name"
      initialName={folder.name}
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={async (name) =>
        Boolean(
          await act((library) =>
            library.updateFolder(profile.id, folder.id, { name }),
          ),
        )
      }
    />
  );
}
