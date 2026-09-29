import { HardDriveDownload } from "lucide-react";
import { Redirect, Route, Router, Switch } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { opfsSupported } from "@/lib/library/store";
import { AppShell } from "./components/app-shell";
import { LibraryProvider, useLibrary } from "./library-context";
import { DashboardPage } from "./pages/dashboard";
import { FolderPage } from "./pages/folder";
import { LivePage } from "./pages/live";
import { NotFoundPage } from "./pages/not-found";
import { SettingsPage } from "./pages/settings";
import { SignInPage } from "./pages/sign-in";

export function AppRoutes() {
  return (
    <TooltipProvider>
      {opfsSupported() ? (
        <LibraryProvider>
          <Router base="/app">
            <Switch>
              <Route path="/sign-in" component={SignInPage} />
              <Route>
                <SignedIn />
              </Route>
            </Switch>
          </Router>
        </LibraryProvider>
      ) : (
        <UnsupportedBrowser />
      )}
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}

function SignedIn() {
  const { profile, ready } = useLibrary();
  if (!ready)
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  if (!profile) return <Redirect to="/sign-in" replace />;
  return (
    <AppShell key={profile.id}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/folders/:folderId/live" component={LivePage} />
        <Route path="/folders/:folderId" component={FolderPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </AppShell>
  );
}

function UnsupportedBrowser() {
  return (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HardDriveDownload />
        </EmptyMedia>
        <EmptyTitle>This browser can’t hold a library</EmptyTitle>
        <EmptyDescription>
          EchoFrame keeps your folders on this device using the browser’s
          private file system. Open it in a current version of Chrome, Edge,
          Firefox, or Safari.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline" className="rounded-full">
          <a href="/">Back to echoframe</a>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
