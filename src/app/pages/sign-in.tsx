import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  FolderOpen,
  HardDrive,
  KeyRound,
  WifiOff,
} from "lucide-react";
import { useLocation } from "wouter";
import { AuroraField } from "@/components/effects/aurora-field";
import { useEffects } from "@/components/effects/motion-system";
import { Brand } from "@/components/brand";
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
  Field,
  FieldDescription,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/lib/library/library";
import { ProfileAvatar } from "../components/profile-avatar";
import {
  useLibrary,
  useLibraryAction,
  useLibraryData,
} from "../library-context";

const promises = [
  {
    icon: HardDrive,
    title: "Your library stays here",
    text: "Folders, images, audio, and notes are stored in this browser, not on a server.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    text: "Organize and tag material without a connection. Live sessions call Jev when you present.",
  },
  {
    icon: KeyRound,
    title: "Your own Jev key",
    text: "Each profile keeps its own key. Add it in Settings before your first live session.",
  },
];

export function SignInPage() {
  const { signIn } = useLibrary();
  const act = useLibraryAction();
  const [, navigate] = useLocation();
  const { enabled } = useEffects();
  const profiles = useLibraryData((library) => library.profiles(), []);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  function enter(profile: Profile) {
    signIn(profile);
    navigate("/");
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const profile = await act((library) => library.createProfile(name));
    setBusy(false);
    if (profile) enter(profile);
  }

  const existing = profiles.data ?? [];

  return (
    <main>
      <section
        aria-label="Sign in to EchoFrame"
        className="relative isolate grid min-h-svh lg:grid-cols-[1.1fr_0.9fr]"
      >
        <AuroraField />
        <div className="flex flex-col justify-between gap-12 px-5 pt-6 pb-10 sm:px-8 xl:px-12">
          <a
            href="/"
            className="w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Brand />
          </a>
          <div>
            <Badge
              variant="outline"
              className="gap-2 rounded-full border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] tracking-[0.12em] text-primary"
            >
              <FolderOpen className="size-3" /> YOUR LIBRARY, YOUR DEVICE
            </Badge>
            <motion.h1
              initial={
                enabled ? { opacity: 0, y: 30, filter: "blur(8px)" } : false
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-3xl text-[clamp(2.4rem,4.6vw,5.5rem)] leading-[1.04] font-medium tracking-[-0.06em]"
            >
              Gather the material.{" "}
              <span className="bg-gradient-to-r from-primary via-[#a7f5bf] to-[#66d7e6] bg-clip-text text-transparent">
                Let your voice arrange it.
              </span>
            </motion.h1>
          </div>
          <ItemGroup className="grid gap-3 sm:grid-cols-3">
            {promises.map(({ icon: Icon, title, text }) => (
              <Item
                key={title}
                variant="muted"
                className="items-start bg-card/60 backdrop-blur"
              >
                <ItemMedia variant="icon">
                  <Icon className="text-primary" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{title}</ItemTitle>
                  <ItemDescription className="line-clamp-none">
                    {text}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </div>

        <div className="flex items-center px-5 pb-12 sm:px-8 lg:py-12 xl:px-12">
          <Card className="w-full max-w-lg bg-card/85 backdrop-blur-md lg:ml-auto">
            <CardHeader>
              <CardTitle className="text-2xl tracking-[-0.04em]">
                {existing.length ? "Who’s presenting?" : "Create your profile"}
              </CardTitle>
              <CardDescription>
                {existing.length
                  ? "Choose a profile on this device, or start a new one."
                  : "A profile keeps your folders and Jev key separate from anyone else using this device."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {profiles.loading && !profiles.data ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                existing.length > 0 && (
                  <ItemGroup className="gap-2">
                    {existing.map((profile) => (
                      <Item key={profile.id} variant="outline" asChild>
                        <button
                          type="button"
                          onClick={() => enter(profile)}
                          className="w-full text-left transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ItemMedia>
                            <ProfileAvatar
                              name={profile.name}
                              className="size-10"
                            />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{profile.name}</ItemTitle>
                            <ItemDescription>
                              Since{" "}
                              {new Date(profile.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </ItemActions>
                        </button>
                      </Item>
                    ))}
                  </ItemGroup>
                )
              )}
              {existing.length > 0 && <FieldSeparator>or</FieldSeparator>}
              <form onSubmit={create} className="grid gap-4">
                <Field>
                  <FieldLabel htmlFor="profile-name">
                    {existing.length ? "New profile" : "Your name"}
                  </FieldLabel>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                    required
                  />
                  <FieldDescription>
                    Shown in your library. Nothing leaves this device.
                  </FieldDescription>
                </Field>
                <Button
                  type="submit"
                  disabled={busy || !name.trim()}
                  className="h-11 rounded-full"
                >
                  Create profile <ArrowRight />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
