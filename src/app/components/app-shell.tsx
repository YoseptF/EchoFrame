import { Fragment, useEffect, type ReactNode } from "react";
import {
  ChevronsUpDown,
  Folder,
  FolderPlus,
  LayoutGrid,
  LogOut,
  MoveUpRight,
  Settings,
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { Brand } from "@/components/brand";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLibrary, useLibraryData, useProfile } from "../library-context";
import { NewFolderDialog } from "./folder-dialogs";
import { ProfileAvatar } from "./profile-avatar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const profile = useProfile();
  const { signOut, offline } = useLibrary();
  const [location, navigate] = useLocation();
  const { setOpenMobile } = useSidebar();
  const [onDashboard] = useRoute("/");
  const [onSettings] = useRoute("/settings");
  const [, folderRoute] = useRoute("/folders/:folderId/*?");
  const folders = useLibraryData(
    (library) => library.folders(profile.id),
    [profile.id],
  );

  // On phones the sidebar is a sheet; close it once a link has taken you somewhere.
  useEffect(() => setOpenMobile(false), [location, setOpenMobile]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-4 group-data-[collapsible=icon]:px-2">
        <Link
          href="/"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:[&_span_span]:hidden"
        >
          <Brand />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={onDashboard}
                tooltip="Library"
              >
                <Link href="/">
                  <LayoutGrid />
                  <span>Library</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <NewFolderDialog
            trigger={
              <SidebarGroupAction title="New folder">
                <FolderPlus />
                <span className="sr-only">New folder</span>
              </SidebarGroupAction>
            }
            onCreated={(folder) => navigate(`/folders/${folder.id}`)}
          />
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.data
                ? folders.data.map((folder) => (
                    <SidebarMenuItem key={folder.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={folderRoute?.folderId === folder.id}
                      >
                        <Link href={`/folders/${folder.id}`}>
                          <Folder />
                          <span>{folder.name}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>{folder.assetCount}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  ))
                : Array.from({ length: 3 }, (_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={onSettings}
                tooltip="Settings"
              >
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="echoframe.yosept.me">
                <a href="/">
                  <MoveUpRight />
                  <span>About EchoFrame</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <ProfileAvatar
                    name={profile.name}
                    picture={profile.picture}
                    className="size-8"
                  />
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">
                      {profile.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {offline
                        ? "Offline"
                        : (profile.email ?? "Google account")}
                    </span>
                  </span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              >
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                  Signed in with Google
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/settings")}>
                  <Settings /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export type Crumb = { label: string; href?: string };

/** The sticky bar at the top of every signed-in page. */
export function PageHeader({
  crumbs,
  actions,
}: {
  crumbs: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur sm:px-5">
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="mr-1 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((crumb, index) => (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="min-w-0">
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
