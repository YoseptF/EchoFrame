import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AudioLines,
  CornerDownLeft,
  FileText,
  FolderX,
  ImageIcon,
  KeyRound,
  Maximize,
  Mic,
  MicOff,
  PenLine,
  Pin,
  PinOff,
  X,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { modeIcons } from "@/components/mode-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { candidates, type Verdict } from "@/lib/echo";
import {
  needsDescription,
  type Asset,
  type Folder,
} from "@/lib/library/library";
import { modes, type FrameMode } from "@/lib/presentation";
import { speechSupported } from "@/lib/speech";
import { PageHeader } from "../components/app-shell";
import { EchoStage } from "../components/echo-stage";
import { useAssetUrl, useLibraryData, useProfile } from "../library-context";
import { useEchoSession } from "../use-echo-session";

const kindIcons = { image: ImageIcon, audio: AudioLines, text: FileText };

export function LivePage() {
  const { folderId } = useParams<{ folderId: string }>();
  const profile = useProfile();
  const data = useLibraryData(
    async (library) => ({
      folder: await library.folder(profile.id, folderId),
      assets: await library.assets(profile.id, folderId),
      settings: await library.settings(profile.id),
    }),
    [profile.id, folderId],
  );
  const folder = data.data?.folder;
  const assets = data.data?.assets;
  const jevKey = data.data?.settings.jevKey;
  const crumbs = [
    { label: "Library", href: "/" },
    { label: folder?.name ?? "Folder", href: `/folders/${folderId}` },
    { label: "Live" },
  ];

  if (!data.data)
    return (
      <>
        <PageHeader crumbs={crumbs} />
        <div className="grid gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:px-12 xl:py-8">
          <Skeleton className="aspect-[16/10] w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </>
    );

  const gate = !folder
    ? {
        icon: FolderX,
        title: "This folder isn’t here",
        description:
          "It may have been deleted, or it belongs to another profile on this device.",
        action: { label: "Back to your library", href: "/" },
      }
    : !jevKey
      ? {
          icon: KeyRound,
          title: "Add your Jev key to go live",
          description:
            "Live sessions use your own TypeSafe key to decide which material fits what you’re saying. Check it once in Settings and every folder can go live.",
          action: { label: "Add key", href: "/settings" },
        }
      : candidates(assets ?? [], "spatial").length === 0
        ? {
            icon: PenLine,
            title: "Describe your material first",
            description:
              "Jev matches your speech against descriptions, tags, and notes. Add a note or describe an image or clip in this folder, then go live.",
            action: { label: "Open folder", href: `/folders/${folderId}` },
          }
        : null;

  if (gate || !folder || !jevKey || !assets) {
    const Icon = gate?.icon ?? FolderX;
    return (
      <>
        <PageHeader crumbs={crumbs} />
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>{gate?.title}</EmptyTitle>
            <EmptyDescription>{gate?.description}</EmptyDescription>
          </EmptyHeader>
          {gate && (
            <EmptyContent>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={gate.action.href}>{gate.action.label}</Link>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </>
    );
  }

  return (
    <LiveSession
      key={folder.id}
      folder={folder}
      assets={assets}
      jevKey={jevKey}
    />
  );
}

const verdicts: Record<Verdict, string> = {
  switched: "Brought the closest match forward.",
  same: "The frame already fits what you’re saying.",
  continuing: "Holding the frame while this thought continues.",
  holding: "A new match is waiting out the minimum hold.",
  "no-match": "Nothing in this folder fits yet, so the frame stays.",
  pinned: "Pinned by you. Release it to let Jev follow again.",
};

function LiveSession({
  folder,
  assets,
  jevKey,
}: {
  folder: Folder;
  assets: Asset[];
  jevKey: string;
}) {
  const session = useEchoSession({ folder, assets, jevKey });
  const stage = useRef<HTMLDivElement>(null);
  const byId = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets],
  );
  const { frame } = session;
  const focus = frame.focus ? byId.get(frame.focus) : undefined;
  const retained = frame.retained
    .map((id) => byId.get(id))
    .filter((asset) => asset !== undefined);
  const related = frame.related
    .map((id) => byId.get(id))
    .filter((asset) => asset !== undefined);
  const undescribed = assets.filter(needsDescription).length;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Library", href: "/" },
          { label: folder.name, href: `/folders/${folder.id}` },
          { label: "Live" },
        ]}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => stage.current?.requestFullscreen()}
            >
              <Maximize /> <span className="hidden sm:inline">Fullscreen</span>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href={`/folders/${folder.id}`}>
                <X /> End
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:px-12 xl:py-8">
        <div
          ref={stage}
          className="min-w-0 [&:fullscreen]:grid [&:fullscreen]:place-items-center [&:fullscreen]:bg-black"
        >
          <EchoStage
            mode={session.mode}
            className="mx-auto max-w-[calc((100svh-9rem)*1.6)] [:fullscreen_&]:w-[min(100vw,160svh)] [:fullscreen_&]:max-w-none"
            content={{
              folderId: folder.id,
              talk: folder.name,
              focus,
              retained,
              related,
            }}
          />
        </div>

        <aside className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SessionCard session={session} folder={folder} focus={focus} />
          <TranscriptCard
            session={session}
            windowSeconds={folder.config.windowSeconds}
          />
          <MatchesCard
            session={session}
            byId={byId}
            folderId={folder.id}
            undescribed={undescribed}
          />
        </aside>
      </div>
    </>
  );
}

type Session = ReturnType<typeof useEchoSession>;

function SessionCard({
  session,
  folder,
  focus,
}: {
  session: Session;
  folder: Folder;
  focus?: Asset;
}) {
  const [supported, setSupported] = useState(true);
  useEffect(() => setSupported(speechSupported()), []);
  const [line, setLine] = useState("");
  const audio = useAssetUrl(
    folder.id,
    focus?.kind === "audio" ? focus : undefined,
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    session.addLine(line);
    setLine("");
  }

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Session</CardTitle>
        <CardDescription>
          Jev reads the last {folder.config.windowSeconds} seconds of speech
          against {session.material.length}{" "}
          {session.material.length === 1 ? "item" : "items"} in this folder.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {session.listening ? (
          <Button onClick={session.stop} variant="outline" className="w-full">
            <MicOff /> Stop listening
          </Button>
        ) : (
          <Button
            onClick={session.start}
            disabled={!supported}
            className="w-full"
          >
            <Mic /> Start listening
          </Button>
        )}
        {!supported && (
          <p className="text-sm text-muted-foreground">
            This browser can’t turn speech into text. Type lines below, or open
            EchoFrame in Chrome, Edge, or Safari to speak.
          </p>
        )}
        {session.micError && (
          <Alert variant="destructive">
            <MicOff />
            <AlertTitle>Listening stopped</AlertTitle>
            <AlertDescription>{session.micError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={submit}>
          <InputGroup>
            <InputGroupInput
              value={line}
              onChange={(event) => setLine(event.target.value)}
              placeholder="Or type what you’d say"
              aria-label="Type a line of speech"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                size="icon-xs"
                disabled={!line.trim()}
                aria-label="Add line"
              >
                <CornerDownLeft />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <Tabs
          value={session.mode}
          onValueChange={(value) => session.setMode(value as FrameMode)}
        >
          <TabsList className="w-full">
            {modes.map((mode) => {
              const Icon = modeIcons[mode.id];
              return (
                <TabsTrigger key={mode.id} value={mode.id}>
                  <Icon /> {mode.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {audio && (
          <audio controls src={audio} className="w-full">
            <track kind="captions" />
          </audio>
        )}

        {session.jevError ? (
          <Alert variant="destructive">
            <KeyRound />
            <AlertTitle>Jev didn’t answer</AlertTitle>
            <AlertDescription>
              {session.jevError.message}
              {session.jevError.fatal && (
                <Link href="/settings" className="underline">
                  Open Settings
                </Link>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <p
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-live="polite"
          >
            {session.asking && <Spinner className="text-primary" />}
            {session.verdict
              ? verdicts[session.verdict]
              : session.listening
                ? "Listening. Material comes forward as you speak."
                : "Start listening or type a line to begin."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TranscriptCard({
  session,
  windowSeconds,
}: {
  session: Session;
  windowSeconds: number;
}) {
  const { segments, interim } = session;
  const shown = segments.slice(-8);
  const windowStart = Date.now() - windowSeconds * 1000;
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Transcript</CardTitle>
        <CardDescription>
          Brighter lines are inside the speech window.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shown.length === 0 && !interim ? (
          <p className="text-sm text-muted-foreground">
            Your words appear here as you speak.
          </p>
        ) : (
          <div className="grid max-h-64 gap-2 overflow-y-auto text-sm leading-6">
            {shown.map((segment, index) => (
              <p
                key={`${segment.at}-${index}`}
                className={
                  segment.at >= windowStart
                    ? "text-foreground"
                    : "text-muted-foreground/60"
                }
              >
                {segment.text}
              </p>
            ))}
            {interim && <p className="text-muted-foreground">{interim}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchesCard({
  session,
  byId,
  folderId,
  undescribed,
}: {
  session: Session;
  byId: Map<string, Asset>;
  folderId: string;
  undescribed: number;
}) {
  const { ranked, frame } = session;
  const top = ranked.slice(0, 5);
  return (
    <Card className="gap-3 sm:col-span-2 xl:col-span-1">
      <CardHeader>
        <CardTitle>Matches</CardTitle>
        <CardDescription>
          How closely Jev matched each item to what you’re saying. Choose one to
          pin it on stage.
        </CardDescription>
        {frame.pinned && (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={session.release}>
              <PinOff /> Release
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="grid gap-1.5">
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Matches appear once Jev has heard a line.
          </p>
        ) : (
          top.map(({ id, score }) => {
            const asset = byId.get(id);
            if (!asset) return null;
            const Icon = kindIcons[asset.kind];
            const onStage = frame.focus === id;
            return (
              <Item
                key={id}
                asChild
                size="sm"
                variant={onStage ? "outline" : "default"}
                className="cursor-pointer text-left"
              >
                <button type="button" onClick={() => session.pin(id)}>
                  <ItemMedia variant="icon">
                    <Icon />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full truncate">
                      {asset.name}
                    </ItemTitle>
                    {onStage && (
                      <ItemDescription className="flex items-center gap-1 text-primary">
                        {frame.pinned && <Pin className="size-3" />} On stage
                      </ItemDescription>
                    )}
                  </ItemContent>
                  <ItemActions>
                    <Badge variant="secondary" className="tabular-nums">
                      {Math.round(score * 100)}%
                    </Badge>
                  </ItemActions>
                </button>
              </Item>
            );
          })
        )}
        {undescribed > 0 && (
          <p className="pt-2 text-sm text-muted-foreground">
            {undescribed === 1
              ? "1 item has no description, so Jev leaves it out. "
              : `${undescribed} items have no description, so Jev leaves them out. `}
            <Link href={`/folders/${folderId}`} className="underline">
              Describe them
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
