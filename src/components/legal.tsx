import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Rendered to static HTML at build time (scripts/build.ts), so these pages read without
// JavaScript. Keep every statement true to what the code does; update them together.

export const legalUpdated = "September 28, 2026";
const contact = "yosept.flores@gmail.com";

function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-primary underline-offset-4 hover:underline"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      <div className="grid gap-3 text-base leading-7 text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:grid [&_ul]:gap-2">
        {children}
      </div>
    </section>
  );
}

function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8 xl:px-12">
        <a href="/" aria-label="EchoFrame home">
          <Brand />
        </a>
        <Button asChild variant="ghost" className="rounded-full text-xs">
          <a href="/">
            <ArrowLeft /> Back to EchoFrame
          </a>
        </Button>
      </header>
      <main className="grid gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,46rem)_minmax(0,1fr)] xl:px-12">
        <article className="grid gap-10 lg:col-start-2">
          <div className="grid gap-4">
            <h1 className="text-[clamp(2.4rem,5vw,4rem)] leading-[1.05] font-medium tracking-[-0.055em]">
              {title}
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">{summary}</p>
            <p className="text-sm text-muted-foreground">
              Last updated {legalUpdated}
            </p>
          </div>
          <Separator />
          {children}
        </article>
      </main>
      <footer className="px-5 py-8 sm:px-8 xl:px-12">
        <Separator className="mb-6" />
        <nav
          aria-label="Legal"
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          <a href="/privacy" className="hover:text-foreground">
            Privacy
          </a>
          <a href="/terms" className="hover:text-foreground">
            Terms
          </a>
          <a href="/app" className="hover:text-foreground">
            Open EchoFrame
          </a>
        </nav>
      </footer>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy policy"
      summary="EchoFrame keeps your material on your device. Google tells us who you are; your files never reach our servers."
    >
      <Section title="What EchoFrame is">
        <p>
          EchoFrame is a web app at echoframe.yosept.me that turns a library of
          images, audio, and notes into visuals that follow a speaker. This
          policy explains what information it handles and where that information
          goes.
        </p>
      </Section>

      <Section title="Signing in with Google">
        <p>
          When you choose “Continue with Google”, Google shares your{" "}
          <strong>name</strong>, <strong>email address</strong>,{" "}
          <strong>profile photo</strong>, and a{" "}
          <strong>Google account ID</strong> with EchoFrame. We ask only for the
          basic <em>openid</em>, <em>email</em>, and <em>profile</em>{" "}
          permissions.
        </p>
        <ul>
          <li>
            We use this information only to sign you in, to keep your library
            separate from other accounts on the same device, and to show your
            name and photo in the app.
          </li>
          <li>
            EchoFrame has no user database. Your sign-in is kept in a signed,
            HttpOnly cookie in your browser that expires after 30 days or when
            you sign out.
          </li>
          <li>
            A copy of your name, email, and photo address is also kept in your
            browser so your library can open offline.
          </li>
        </ul>
        <p>
          EchoFrame’s use of information received from Google APIs adheres to
          the{" "}
          <External href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </External>
          , including the Limited Use requirements. We do not use it for
          advertising, do not sell it, and do not share it with anyone.
        </p>
      </Section>

      <Section title="Your library stays on your device">
        <p>
          Folders, images, audio, notes, descriptions, tags, and echo settings
          are stored in your browser’s private storage on the device you use.
          They are not uploaded to EchoFrame or anyone else. Clearing your
          browser’s site data, or using “Remove library” in Settings, deletes
          them from that device. We cannot recover them for you.
        </p>
      </Section>

      <Section title="Your Jev API key and requests to TypeSafe">
        <p>
          Live features use Jev, a model made by TypeSafe, with{" "}
          <strong>your own API key</strong>. The key is stored in your browser.
          When EchoFrame checks your key or asks Jev a question, the request
          passes through EchoFrame’s server on its way to TypeSafe, because
          TypeSafe doesn’t accept requests directly from browsers. That server
          forwards the request and keeps neither your key nor its contents.
        </p>
        <p>
          Requests to Jev contain the text needed for the decision, such as what
          you just said and the descriptions and tags of your material. TypeSafe
          handles them under its own terms and privacy policy, and usage is
          billed to your TypeSafe account.
        </p>
      </Section>

      <Section title="Live sessions and your microphone">
        <p>
          A live session listens only after you choose “Start listening”, and
          stops when you stop it or leave the session. EchoFrame uses your
          browser’s built-in speech recognition to turn speech into text. Your
          browser may send the audio to its maker to do this, for example Google
          for Chrome or Apple for Safari, under that company’s own privacy
          terms. EchoFrame never receives or records the audio.
        </p>
        <p>
          The resulting transcript stays in the page while the session is open
          and is not saved. The last few seconds of it are sent to Jev, as
          described above, to choose what the frame shows.
        </p>
      </Section>

      <Section title="Hosting and logs">
        <p>
          EchoFrame runs on Cloudflare. Like any website, Cloudflare processes
          your IP address and request details to deliver the site and keeps
          short-lived operational logs, such as which address was requested and
          when. EchoFrame has no advertising, analytics, or tracking cookies.
        </p>
      </Section>

      <Section title="Your choices">
        <ul>
          <li>Sign out at any time from the app’s account menu or Settings.</li>
          <li>
            Delete your library on a device with Settings → Remove library.
          </li>
          <li>
            Remove EchoFrame’s access to your Google account at{" "}
            <External href="https://myaccount.google.com/connections">
              myaccount.google.com/connections
            </External>
            .
          </li>
        </ul>
      </Section>

      <Section title="Children">
        <p>EchoFrame is not directed at children under 13.</p>
      </Section>

      <Section title="Changes and contact">
        <p>
          If this policy changes, the new version will be posted here with a new
          date. Questions or requests:{" "}
          <External href={`mailto:${contact}`}>{contact}</External>.
        </p>
      </Section>
    </LegalPage>
  );
}

export function TermsOfService() {
  return (
    <LegalPage
      title="Terms of service"
      summary="The short version: your material stays yours, your Jev key and its usage are yours, and EchoFrame is provided as is."
    >
      <Section title="Using EchoFrame">
        <p>
          By signing in to or using EchoFrame at echoframe.yosept.me, you agree
          to these terms. If you don’t agree, don’t use EchoFrame.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          You sign in with a Google account. Keep that account secure; activity
          in EchoFrame under your sign-in is your responsibility.
        </p>
      </Section>

      <Section title="Your material">
        <p>
          You keep all rights to the images, audio, notes, and other material
          you add. It stays on your device, and you are responsible for having
          the right to use and present it. Because it is stored only in your
          browser, keep your own copies of anything important.
        </p>
      </Section>

      <Section title="Your Jev key">
        <p>
          Live features require your own TypeSafe API key. Your use of Jev is
          also subject to TypeSafe’s terms, and any usage charges are between
          you and TypeSafe.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Don’t use EchoFrame to break the law, to infringe others’ rights, or
          to interfere with the service, including by abusing the request relay
          to TypeSafe.
        </p>
      </Section>

      <Section title="Availability and changes">
        <p>
          EchoFrame may change, pause, or stop features at any time. We may
          update these terms and will post the new version here with a new date.
          Continuing to use EchoFrame after a change means you accept it.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          EchoFrame is provided “as is”, without warranties of any kind. To the
          fullest extent the law allows, we are not liable for lost data, missed
          presentations, or indirect or consequential damages arising from your
          use of EchoFrame.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms:{" "}
          <External href={`mailto:${contact}`}>{contact}</External>.
        </p>
      </Section>
    </LegalPage>
  );
}
