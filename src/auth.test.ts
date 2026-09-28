import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { handleAuth, signSession, verifySession, type AuthEnv } from "./auth";

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
