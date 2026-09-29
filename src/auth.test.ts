import { afterEach, expect, mock, spyOn, test } from "bun:test";
import {
  handleAuth,
  isPreviewOrigin,
  signHandoff,
  signSession,
  verifyHandoff,
  verifySession,
  type AuthEnv,
} from "./auth";

afterEach(() => mock.restore());

const env: AuthEnv = {
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  SESSION_SECRET: "session-secret",
};
const ada = {
  id: "1234",
  name: "Ada Lovelace",
  email: "ada@example.com",
  picture: null,
};
const origin = "https://echoframe.yosept.me";

const cookieValue = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((value) => value.startsWith(`${name}=`))
    ?.split(";")[0]!
    .slice(name.length + 1);

test("sessions round-trip, and tampered or expired sessions are refused", async () => {
  const token = await signSession(ada, "secret", Date.UTC(2026, 0, 1));
  expect(await verifySession(token, "secret", Date.UTC(2026, 0, 2))).toEqual(
    ada,
  );
  expect(await verifySession(token, "other", Date.UTC(2026, 0, 2))).toBeNull();
  expect(await verifySession(token, "secret", Date.UTC(2026, 1, 1))).toBeNull();
  const [payload, signature] = token.split(".");
  const forged = btoa(JSON.stringify({ ...ada, id: "evil", exp: 9e9 })).replace(
    /=+$/,
    "",
  );
  expect(await verifySession(`${forged}.${signature}`, "secret")).toBeNull();
  expect(await verifySession(`${payload}`, "secret")).toBeNull();
  expect(await verifySession("not.a.token", "secret")).toBeNull();
  expect(await verifySession(undefined, "secret")).toBeNull();
});

test("signing in with Google sets a session the app can read", async () => {
  const start = (await handleAuth(new Request(`${origin}/auth/google`), env))!;
  expect(start.status).toBe(302);
  const google = new URL(start.headers.get("Location")!);
  expect(google.origin + google.pathname).toBe(
    "https://accounts.google.com/o/oauth2/v2/auth",
  );
  expect(google.searchParams.get("redirect_uri")).toBe(
    `${origin}/auth/google/callback`,
  );
  expect(google.searchParams.get("scope")).toBe("openid profile email");
  const state = google.searchParams.get("state")!;
  expect(cookieValue(start, "ef_oauth_state")).toBe(state);
  expect(start.headers.get("Set-Cookie")).toContain("HttpOnly; SameSite=Lax");

  const upstream = spyOn(globalThis, "fetch").mockImplementation((async (
    input: RequestInfo | URL,
  ) =>
    String(input).includes("token")
      ? Response.json({ access_token: "google-token" })
      : Response.json({
          sub: "1234",
          name: "Ada Lovelace",
          email: "ada@example.com",
          email_verified: true,
          picture: "https://lh3.googleusercontent.com/a/ada",
        })) as typeof fetch);
  const callback = (await handleAuth(
    new Request(`${origin}/auth/google/callback?code=abc&state=${state}`, {
      headers: { Cookie: `ef_oauth_state=${state}` },
    }),
    env,
  ))!;
  expect(callback.headers.get("Location")).toBe(`${origin}/app/`);
  const [, tokenInit] = upstream.mock.calls[0]!;
  expect(String(tokenInit?.body)).toContain("client_secret=client-secret");
  expect(upstream.mock.calls[1]![1]?.headers).toEqual({
    Authorization: "Bearer google-token",
  });

  const session = cookieValue(callback, "ef_session")!;
  expect(cookieValue(callback, "ef_oauth_state")).toBe("");
  const me = (await handleAuth(
    new Request(`${origin}/api/session`, {
      headers: { Cookie: `ef_session=${session}` },
    }),
    env,
  ))!;
  expect(await me.json()).toEqual({
    user: { ...ada, picture: "https://lh3.googleusercontent.com/a/ada" },
    google: true,
  });
});

test("a callback without the matching state is refused before calling Google", async () => {
  const upstream = spyOn(globalThis, "fetch");
  const response = (await handleAuth(
    new Request(`${origin}/auth/google/callback?code=abc&state=forged`, {
      headers: { Cookie: "ef_oauth_state=real" },
    }),
    env,
  ))!;
  expect(response.headers.get("Location")).toBe(
    `${origin}/app/sign-in?error=state`,
  );
  expect(upstream).not.toHaveBeenCalled();
});

test("cancelling at Google and Google failures return to sign-in with a reason", async () => {
  const cancelled = (await handleAuth(
    new Request(`${origin}/auth/google/callback?error=access_denied&state=s`, {
      headers: { Cookie: "ef_oauth_state=s" },
    }),
    env,
  ))!;
  expect(cancelled.headers.get("Location")).toBe(
    `${origin}/app/sign-in?error=cancelled`,
  );

  spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("nope", { status: 400 }),
  );
  const failed = (await handleAuth(
    new Request(`${origin}/auth/google/callback?code=abc&state=s`, {
      headers: { Cookie: "ef_oauth_state=s" },
    }),
    env,
  ))!;
  expect(failed.headers.get("Location")).toBe(
    `${origin}/app/sign-in?error=google`,
  );
});

test("a configured app origin replaces the request host", async () => {
  const local = { ...env, APP_ORIGIN: "http://localhost:8787" };
  const start = (await handleAuth(
    new Request(`${origin}/auth/google`),
    local,
  ))!;
  const google = new URL(start.headers.get("Location")!);
  expect(google.searchParams.get("redirect_uri")).toBe(
    "http://localhost:8787/auth/google/callback",
  );
  expect(start.headers.get("Set-Cookie")).not.toContain("Secure");
});

test("signing out accepts same-origin posts", async () => {
  const out = (await handleAuth(
    new Request(`${origin}/auth/sign-out`, {
      method: "POST",
      headers: { Origin: origin },
    }),
    env,
  ))!;
  expect(out.status).toBe(204);
});

test("Google sign-in reports itself unavailable until it is configured", async () => {
  const session = (await handleAuth(new Request(`${origin}/api/session`), {}))!;
  expect(await session.json()).toEqual({ user: null, google: false });
  const start = (await handleAuth(new Request(`${origin}/auth/google`), {}))!;
  expect(start.headers.get("Location")).toBe(
    `${origin}/app/sign-in?error=unavailable`,
  );
});

test("signing out clears the session and refuses cross-site posts", async () => {
  const out = (await handleAuth(
    new Request(`${origin}/auth/sign-out`, { method: "POST" }),
    env,
  ))!;
  expect(out.status).toBe(204);
  expect(out.headers.get("Set-Cookie")).toStartWith(
    "ef_session=; Path=/; HttpOnly",
  );
  const forged = (await handleAuth(
    new Request(`${origin}/auth/sign-out`, {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    }),
    env,
  ))!;
  expect(forged.status).toBe(403);
  expect(
    (await handleAuth(new Request(`${origin}/auth/sign-out`), env))!.status,
  ).toBe(405);
});

const staging = "https://echoframe-staging.yosept.me";
const preview = "https://pr-7-echoframe-staging.example.workers.dev";
const previewEnv: AuthEnv = {
  ...env,
  SIGN_IN_ORIGIN: staging,
  PREVIEW_HOST: "echoframe-staging.example.workers.dev",
};

test("only this Worker's PR preview aliases count as previews", () => {
  expect(isPreviewOrigin(preview, previewEnv)).toBe(true);
  for (const origin of [
    staging,
    "http://pr-7-echoframe-staging.example.workers.dev",
    "https://pr-x-echoframe-staging.example.workers.dev",
    "https://pr-7-echoframe-staging.example.workers.dev.evil.example",
    "https://pr-7-evil.example",
    `${preview}/path`,
    "not a url",
  ])
    expect(isPreviewOrigin(origin, previewEnv)).toBe(false);
  expect(isPreviewOrigin(preview, env)).toBe(false);
});

test("a preview signs in through the sign-in origin and gets its own session", async () => {
  // The preview sends the visitor to staging, keeping a nonce.
  const start = (await handleAuth(
    new Request(`${preview}/auth/google`),
    previewEnv,
  ))!;
  const toStaging = new URL(start.headers.get("Location")!);
  expect(toStaging.origin + toStaging.pathname).toBe(`${staging}/auth/google`);
  expect(toStaging.searchParams.get("return")).toBe(preview);
  const nonce = toStaging.searchParams.get("nonce")!;
  expect(cookieValue(start, "ef_handoff")).toBe(nonce);

  // Staging runs the usual Google flow with its own registered callback.
  const stagingStart = (await handleAuth(new Request(toStaging), previewEnv))!;
  const google = new URL(stagingStart.headers.get("Location")!);
  expect(google.searchParams.get("redirect_uri")).toBe(
    `${staging}/auth/google/callback`,
  );
  const state = google.searchParams.get("state")!;
  const returnTo = cookieValue(stagingStart, "ef_oauth_return")!;

  spyOn(globalThis, "fetch").mockImplementation((async (
    input: RequestInfo | URL,
  ) =>
    String(input).includes("token")
      ? Response.json({ access_token: "google-token" })
      : Response.json({
          sub: "1234",
          name: "Ada Lovelace",
          email: "ada@example.com",
          email_verified: true,
        })) as typeof fetch);
  const callback = (await handleAuth(
    new Request(`${staging}/auth/google/callback?code=abc&state=${state}`, {
      headers: {
        Cookie: `ef_oauth_state=${state}; ef_oauth_return=${returnTo}`,
      },
    }),
    previewEnv,
  ))!;
  // Staging signs nobody in itself; it hands a one-minute token back to the preview.
  expect(cookieValue(callback, "ef_session")).toBeUndefined();
  expect(cookieValue(callback, "ef_oauth_return")).toBe("");
  const back = new URL(callback.headers.get("Location")!);
  expect(back.origin + back.pathname).toBe(`${preview}/auth/handoff`);

  const handoff = (await handleAuth(
    new Request(back, { headers: { Cookie: `ef_handoff=${nonce}` } }),
    previewEnv,
  ))!;
  expect(handoff.headers.get("Location")).toBe(`${preview}/app/`);
  const session = cookieValue(handoff, "ef_session")!;
  expect(await verifySession(session, "session-secret")).toEqual(ada);

  // The same token is useless without the nonce the preview kept.
  const stolen = (await handleAuth(new Request(back), previewEnv))!;
  expect(stolen.headers.get("Location")).toBe(
    `${preview}/app/sign-in?error=state`,
  );
  expect(cookieValue(stolen, "ef_session")).toBeUndefined();
});

test("the sign-in origin refuses to return to anything but a preview", async () => {
  const response = (await handleAuth(
    new Request(
      `${staging}/auth/google?return=${encodeURIComponent("https://evil.example")}&nonce=n`,
    ),
    previewEnv,
  ))!;
  expect(response.headers.get("Location")).toBe(
    `${staging}/app/sign-in?error=state`,
  );
});

test("handoff tokens are bound to one preview and nonce, expire, and are not sessions", async () => {
  const token = await signHandoff(ada, preview, "nonce", "secret", 0);
  expect(
    await verifyHandoff(token, preview, "nonce", "secret", 30_000),
  ).toEqual(ada);
  expect(await verifyHandoff(token, preview, "other", "secret", 0)).toBeNull();
  expect(
    await verifyHandoff(token, "https://pr-8-x.example", "nonce", "secret", 0),
  ).toBeNull();
  expect(
    await verifyHandoff(token, preview, "nonce", "secret", 61_000),
  ).toBeNull();
  expect(await verifySession(token, "secret", 0)).toBeNull();
});

test("a failed preview sign-in returns to the preview with the reason", async () => {
  const returnTo = btoa(JSON.stringify({ origin: preview, nonce: "n" }));
  const cancelled = (await handleAuth(
    new Request(`${staging}/auth/google/callback?error=access_denied&state=s`, {
      headers: { Cookie: `ef_oauth_state=s; ef_oauth_return=${returnTo}` },
    }),
    previewEnv,
  ))!;
  expect(cancelled.headers.get("Location")).toBe(
    `${preview}/app/sign-in?error=cancelled`,
  );
});
