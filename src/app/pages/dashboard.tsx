import { useState } from "react";
import {
  ArrowRight,
  Folder,
  FolderPlus,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { modeIcons } from "@/components/mode-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import type { FolderSummary } from "@/lib/library/library";
import { modes } from "@/lib/presentation";
import { PageHeader } from "../components/app-shell";
import { ConfirmDialog } from "../components/confirm-dialog";
import {
  NewFolderDialog,
  RenameFolderDialog,
} from "../components/folder-dialogs";
import { relativeTime } from "../format";
import {
  useAssetUrl,
  useLibraryAction,
  useLibraryData,
  useProfile,
} from "../library-context";

export function DashboardPage() {
  const profile = useProfile();
  const [, navigate] = useLocation();
  const folders = useLibraryData(
    (library) => library.folders(profile.id),
    [profile.id],
  );
  const settings = useLibraryData(
    (library) => library.settings(profile.id),
    [profile.id],
  );
  const openFolder = (folder: { id: string }) =>
    navigate(`/folders/${folder.id}`);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Library" }]}
        actions={
          <NewFolderDialog
            onCreated={openFolder}
            trigger={
              <Button size="sm" className="rounded-full">
                <Plus /> New folder
              </Button>
            }
          />
        }
      />
      <div className="grid gap-8 px-5 py-8 sm:px-8 xl:px-12 xl:py-12">
        <div>
          <h1 className="text-[clamp(2rem,3.4vw,3.5rem)] leading-[1.05] font-medium tracking-[-0.055em]">
            Welcome back, {profile.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Each folder is the material for one talk: the images, audio, and
            notes your voice can call up, and how the echo is composed.
          </p>
        </div>

        {settings.data && !settings.data.jevKey && (
          <Item variant="outline" className="border-primary/25 bg-primary/5">
            <ItemMedia variant="icon">
              <KeyRound className="text-primary" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Add your Jev key to present live</ItemTitle>
              <ItemDescription>
                Organizing works without it. Live sessions use your own key to
                decide which material fits what you’re saying.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                <Link href="/settings">
                  Add key <ArrowRight />
                </Link>
              </Button>
            </ItemActions>
          </Item>
        )}

        {folders.data?.length === 0 ? (
          <Empty className="border border-dashed py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderPlus />
              </EmptyMedia>
              <EmptyTitle>Start your first folder</EmptyTitle>
              <EmptyDescription>
                Create a folder for a talk, then add the photos, recordings, and
                notes you might want on screen while you speak.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <NewFolderDialog
                onCreated={openFolder}
                trigger={
                  <Button className="rounded-full">
                    <Plus /> New folder
                  </Button>
                }
              />
            </EmptyContent>
          </Empty>
        ) : (
          <section
            aria-label="Folders"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            {folders.data
              ? folders.data.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))
              : Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="aspect-[4/3] rounded-xl" />
                ))}
          </section>
        )}
      </div>
    </>
  );
}

function FolderCard({ folder }: { folder: FolderSummary }) {
  const profile = useProfile();
  const act = useLibraryAction();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cover = useAssetUrl(
    folder.id,
    folder.coverId
      ? { id: folder.coverId, kind: "image", mimeType: "" }
      : undefined,
  );
  const mode = modes.find((item) => item.id === folder.config.mode)!;
  const ModeIcon = modeIcons[mode.id];

  return (
    <Card className="group relative gap-0 overflow-hidden py-0 transition-colors focus-within:border-primary/50 hover:border-primary/30">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center bg-[radial-gradient(ellipse_at_30%_30%,#3a694533,transparent_60%),radial-gradient(ellipse_at_80%_70%,#15637433,transparent_60%)]">
            <Folder className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader className="py-5">
        <CardTitle className="truncate text-lg tracking-[-0.03em]">
          <Link
            href={`/folders/${folder.id}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {folder.name}
          </Link>
        </CardTitle>
        <CardDescription>
          {folder.assetCount === 1 ? "1 asset" : `${folder.assetCount} assets`}{" "}
          · Updated {relativeTime(folder.updatedAt)}
        </CardDescription>
        <CardAction className="relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${folder.name} options`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                <Pencil /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleting(true)}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardFooter className="pb-5">
        <Badge variant="secondary" className="gap-1.5">
          <ModeIcon /> {mode.name}
        </Badge>
      </CardFooter>
      <RenameFolderDialog
        folder={folder}
        open={renaming}
        onOpenChange={setRenaming}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete “${folder.name}”?`}
        description={`This removes the folder and its ${folder.assetCount === 1 ? "asset" : `${folder.assetCount} assets`} from this device. It can’t be undone.`}
        action="Delete folder"
        onConfirm={() =>
          act(
            (library) => library.removeFolder(profile.id, folder.id),
            "Folder deleted",
          )
        }
      />
    </Card>
  );
}
