import { motion } from "motion/react";
import { CircleAlert, HardDrive, KeyRound, WifiOff } from "lucide-react";
import { Redirect, useSearchParams } from "wouter";
import { AuroraField } from "@/components/effects/aurora-field";
import { useEffects } from "@/components/effects/motion-system";
import { Brand } from "@/components/brand";
import { GoogleIcon } from "@/components/google-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { useLibrary } from "../library-context";

const promises = [
  {
    icon: HardDrive,
    title: "Kept on this device",
    text: "Your images, audio, and notes stay in this browser. Google only confirms who you are.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    text: "Once you’ve signed in, your library opens and stays editable without a connection.",
  },
  {
    icon: KeyRound,
    title: "Your own Jev key",
    text: "Add it in Settings before your first live session.",
  },
];

const errors: Record<string, string> = {
  cancelled: "Sign-in was cancelled. Choose an account to continue.",
  state: "That sign-in attempt expired. Try again.",
  google: "Google couldn’t confirm your account. Try again in a moment.",
  unavailable: "Google sign-in isn’t set up on this server yet.",
};

export function SignInPage() {
  const { profile, ready, google, offline } = useLibrary();
  const { enabled } = useEffects();
  const [params] = useSearchParams();
  const error = errors[params.get("error") ?? ""];

  if (ready && profile && !offline) return <Redirect to="/" replace />;

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
          <motion.h1
            initial={
              enabled ? { opacity: 0, y: 30, filter: "blur(8px)" } : false
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl text-[clamp(2.4rem,4.6vw,5.5rem)] leading-[1.04] font-medium tracking-[-0.06em]"
          >
            Gather the material.{" "}
            <span className="bg-gradient-to-r from-primary via-[#a7f5bf] to-[#66d7e6] bg-clip-text text-transparent">
              Let your voice arrange it.
            </span>
          </motion.h1>
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
                Sign in to EchoFrame
              </CardTitle>
              <CardDescription>
                Use your Google account to open your library.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {error && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertTitle>Couldn’t sign you in</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {offline && (
                <Alert>
                  <WifiOff />
                  <AlertTitle>You’re offline</AlertTitle>
                  <AlertDescription>
                    Connect to the internet to sign in. After that, your library
                    opens offline too.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                asChild={google && !offline}
                disabled={!google || offline}
                variant="outline"
                className="h-12 w-full rounded-full bg-background/60 text-sm"
              >
                {google && !offline ? (
                  <a href="/auth/google">
                    <GoogleIcon className="size-5" /> Continue with Google
                  </a>
                ) : (
                  <>
                    <GoogleIcon className="size-5" /> Continue with Google
                  </>
                )}
              </Button>
              {ready && !google && !offline && !error && (
                <p className="text-center text-sm text-muted-foreground">
                  Google sign-in isn’t set up on this server yet.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs leading-5 text-muted-foreground">
                EchoFrame uses your name, email, and photo to label your
                library. Your files are never uploaded.
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>
    </main>
  );
}
