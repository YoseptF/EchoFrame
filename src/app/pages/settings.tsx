import { useEffect, useState, type FormEvent } from "react";
import {
  CircleCheck,
  Eye,
  EyeOff,
  HardDrive,
  KeyRound,
  MoveUpRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { checkJevKey } from "@/lib/jev";
import { PageHeader } from "../components/app-shell";
import { ConfirmDialog } from "../components/confirm-dialog";
import { fileSize } from "../format";
import {
  useLibrary,
  useLibraryAction,
  useLibraryData,
  useProfile,
} from "../library-context";

export function SettingsPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Settings" }]} />
      <div className="grid gap-5 px-5 py-8 sm:px-8 xl:grid-cols-2 xl:px-12 xl:py-10">
        <h1 className="text-[clamp(1.9rem,3vw,3rem)] leading-[1.05] font-medium tracking-[-0.05em] xl:col-span-2">
          Settings
        </h1>
        <JevKeyCard />
        <ProfileCard />
        <DeviceCard />
        <DeleteProfileCard />
      </div>
    </>
  );
}

function JevKeyCard() {
  const profile = useProfile();
  const act = useLibraryAction();
  const settings = useLibraryData(
    (library) => library.settings(profile.id),
    [profile.id],
  );
  const savedKey = settings.data?.jevKey ?? "";
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => setKey(savedKey), [savedKey]);

  async function check(value: string) {
    setChecking(true);
    try {
      const model = await checkJevKey(value);
      toast.success("Your Jev key works", {
        description: `Answered by ${model}.`,
      });
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Jev could not be reached.",
      );
      return false;
    } finally {
      setChecking(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const value = key.trim();
    if (!(await check(value))) return;
    await act((library) =>
      library.saveSettings(profile.id, { ...settings.data, jevKey: value }),
    );
  }

  return (
    <Card className="xl:row-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" /> Jev API key
        </CardTitle>
        <CardDescription>
          Live sessions use your own key to decide which material fits what
          you’re saying.
        </CardDescription>
        <CardAction>
          {savedKey ? (
            <Badge className="gap-1">
              <CircleCheck /> Saved
            </Badge>
          ) : (
            <Badge variant="outline">Not set</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        <form id="jev-key" onSubmit={save}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="jev-key-input">API key</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="jev-key-input"
                  type={visible ? "text" : "password"}
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  placeholder="Paste your key"
                  autoComplete="off"
                  spellCheck={false}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={visible ? "Hide key" : "Show key"}
                    onClick={() => setVisible((value) => !value)}
                  >
                    {visible ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>
                Stored only in this profile on this device. During a session it
                travels to TypeSafe through EchoFrame’s relay, which forwards it
                and keeps nothing.
              </FieldDescription>
            </Field>
            <Item variant="muted">
              <ItemContent>
                <ItemTitle>Don’t have a key yet?</ItemTitle>
                <ItemDescription className="line-clamp-none">
                  Create one in the TypeSafe console. The quickstart explains
                  what Jev does with your requests.
                </ItemDescription>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <a
                      href="https://console.typesafe.ai/keys"
                      target="_blank"
                      rel="noreferrer"
                    >
                      TypeSafe keys <MoveUpRight />
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                  >
                    <a
                      href="https://docs.typesafe.ai/introduction/quickstart"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Jev quickstart <MoveUpRight />
                    </a>
                  </Button>
                </div>
              </ItemContent>
            </Item>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="mt-auto flex-wrap gap-2 border-t">
        <Button
          type="submit"
          form="jev-key"
          disabled={checking || !key.trim() || key.trim() === savedKey}
        >
          {checking && <Spinner />} Check and save
        </Button>
        {savedKey && (
          <>
            <Button
              variant="outline"
              disabled={checking}
              onClick={() => check(savedKey)}
            >
              Test saved key
            </Button>
            <Button
              variant="ghost"
              className="ml-auto text-destructive"
              onClick={() =>
                act(
                  (library) =>
                    library.saveSettings(profile.id, {
                      ...settings.data,
                      jevKey: undefined,
                    }),
                  "Jev key removed",
                )
              }
            >
              Remove key
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

function ProfileCard() {
  const profile = useProfile();
  const act = useLibraryAction();
  const [name, setName] = useState(profile.name);
  useEffect(() => setName(profile.name), [profile.name]);

  async function save(event: FormEvent) {
    event.preventDefault();
    await act(
      (library) => library.renameProfile(profile.id, name),
      "Profile updated",
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>How you appear in this library.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="profile" onSubmit={save}>
          <Field>
            <FieldLabel htmlFor="profile-name">Name</FieldLabel>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </Field>
        </form>
      </CardContent>
      <CardFooter className="border-t">
        <Button
          type="submit"
          form="profile"
          disabled={!name.trim() || name.trim() === profile.name}
        >
          Save name
        </Button>
      </CardFooter>
    </Card>
  );
}

function DeviceCard() {
  const [usage, setUsage] = useState<{ used: number; persisted: boolean }>();
  useEffect(() => {
    Promise.all([
      navigator.storage.estimate(),
      navigator.storage.persisted?.() ?? Promise.resolve(false),
    ]).then(([estimate, persisted]) =>
      setUsage({ used: estimate.usage ?? 0, persisted }),
    );
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>This device</CardTitle>
        <CardDescription>
          Your library lives in this browser’s private storage, so it works
          offline and never uploads your files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <HardDrive />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {usage ? `${fileSize(usage.used)} used` : "Measuring…"}
            </ItemTitle>
            <ItemDescription className="line-clamp-none">
              {usage?.persisted
                ? "The browser will keep this library even when space runs low."
                : "The browser may clear this library if the device runs out of space. Clearing site data also removes it."}
            </ItemDescription>
          </ItemContent>
        </Item>
      </CardContent>
    </Card>
  );
}

function DeleteProfileCard() {
  const profile = useProfile();
  const { signOut } = useLibrary();
  const act = useLibraryAction();
  const [, navigate] = useLocation();
  return (
    <Card className="border-destructive/30 xl:col-start-2">
      <CardHeader>
        <CardTitle>Delete profile</CardTitle>
        <CardDescription>
          Removes {profile.name}, every folder and asset, and the saved Jev key
          from this device.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <ConfirmDialog
          title={`Delete ${profile.name}?`}
          description="All folders, assets, and settings for this profile are removed from this device. This can’t be undone."
          action="Delete profile"
          onConfirm={async () => {
            await act(
              (library) => library.removeProfile(profile.id),
              "Profile deleted",
            );
            signOut();
            navigate("/sign-in");
          }}
          trigger={
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive"
            >
              <Trash2 /> Delete profile
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}
