import { useState } from "react";
import { FolderX, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "../components/app-shell";
import { AssetLibrary } from "../components/asset-library";
import { ConfirmDialog } from "../components/confirm-dialog";
import { EchoConfigForm } from "../components/echo-config-form";
import { RenameFolderDialog } from "../components/folder-dialogs";
import {
  useLibraryAction,
  useLibraryData,
  useProfile,
} from "../library-context";

export function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const profile = useProfile();
  const act = useLibraryAction();
  const [, navigate] = useLocation();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const data = useLibraryData(
    async (library) => ({
      folder: await library.folder(profile.id, folderId),
      assets: await library.assets(profile.id, folderId),
    }),
    [profile.id, folderId],
  );
  const folder = data.data?.folder;
  const assets = data.data?.assets ?? [];

  if (data.data && !folder)
    return (
      <>
        <PageHeader
          crumbs={[
            { label: "Library", href: "/" },
            { label: "Missing folder" },
          ]}
        />
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderX />
            </EmptyMedia>
            <EmptyTitle>This folder isn’t here</EmptyTitle>
            <EmptyDescription>
              It may have been deleted, or it belongs to another profile on this
              device.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/">Back to your library</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </>
    );

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Library", href: "/" },
          { label: folder?.name ?? "Folder" },
        ]}
        actions={
          folder && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Folder options"
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
                  <Trash2 /> Delete folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />
      <div className="grid gap-6 px-5 py-8 sm:px-8 xl:px-12 xl:py-10">
        {folder ? (
          <h1 className="text-[clamp(1.9rem,3vw,3rem)] leading-[1.05] font-medium tracking-[-0.05em] break-words">
            {folder.name}
          </h1>
        ) : (
          <Skeleton className="h-12 w-80 max-w-full" />
        )}
        <Tabs defaultValue="assets" className="gap-6">
          <TabsList>
            <TabsTrigger value="assets">
              Assets{" "}
              <Badge variant="secondary" className="ml-1 px-1.5">
                {assets.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="echo">Echo settings</TabsTrigger>
          </TabsList>
          <TabsContent value="assets">
            {folder ? (
              <AssetLibrary folderId={folder.id} assets={assets} />
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </TabsContent>
          <TabsContent value="echo">
            {folder && <EchoConfigForm folder={folder} />}
          </TabsContent>
        </Tabs>
      </div>
      {folder && (
        <>
          <RenameFolderDialog
            folder={folder}
            open={renaming}
            onOpenChange={setRenaming}
          />
          <ConfirmDialog
            open={deleting}
            onOpenChange={setDeleting}
            title={`Delete “${folder.name}”?`}
            description={`This removes the folder and its ${assets.length === 1 ? "asset" : `${assets.length} assets`} from this device. It can’t be undone.`}
            action="Delete folder"
            onConfirm={async () => {
              await act(
                (library) => library.removeFolder(profile.id, folder.id),
                "Folder deleted",
              );
              navigate("/");
            }}
          />
        </>
      )}
    </>
  );
}
