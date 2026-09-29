// Google sign-in without a database. The Worker runs the OAuth code flow and keeps the result in
// a signed, HttpOnly session cookie; the library itself stays on the user's device.

export type AuthEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Signs session cookies. Rotating it signs everyone out. */
  SESSION_SECRET?: string;
  /** The public origin, when the request URL doesn't show it (wrangler dev reports the route host). */
  APP_ORIGIN?: string;
  /** The origin whose callback is registered with Google. PR previews sign in through it. */
  SIGN_IN_ORIGIN?: string;
  /** Preview aliases live at `https://pr-<n>-<PREVIEW_HOST>`; only those may borrow the sign-in. */
  PREVIEW_HOST?: string;
  // Overrides for local tests against fake endpoints.
  GOOGLE_AUTH_URL?: string;
  GOOGLE_TOKEN_URL?: string;
  GOOGLE_USERINFO_URL?: string;
};

export type SessionUser = {
  /** Google's stable subject identifier. */
  id: string;
  name: string;
  email: string | null;
  picture: string | null;
};

type Session = SessionUser & { exp: number };

const sessionCookie = "ef_session";
const stateCookie = "ef_oauth_state";
// On the sign-in origin: which preview asked, and the nonce it holds.
const returnCookie = "ef_oauth_return";
// On a preview: the nonce a handoff must carry to be accepted here.
const handoffCookie = "ef_handoff";
export const sessionSeconds = 60 * 60 * 24 * 30;
const stateSeconds = 60 * 10;
const handoffSeconds = 60;

export const googleAvailable = (env: AuthEnv) =>
  Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SESSION_SECRET,
  );

const appOrigin = (request: Request, env: AuthEnv) =>
  env.APP_ORIGIN ?? new URL(request.url).origin;

/** A PR preview alias of this Worker, such as https://pr-6-echoframe-staging.example.workers.dev. */
export function isPreviewOrigin(
  origin: string | null | undefined,
  env: AuthEnv,
) {
  if (!origin || !env.PREVIEW_HOST) return false;
  try {
    const url = new URL(origin);
    return (
      url.protocol === "https:" &&
      url.origin === origin &&
      /^pr-\d+-/.test(url.host) &&
      url.host.replace(/^pr-\d+-/, "") === env.PREVIEW_HOST
    );
  } catch {
    return false;
  }
}

const randomToken = () => base64url(crypto.getRandomValues(new Uint8Array(24)));

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer | Uint8Array) {
  let text = "";
  for (const byte of new Uint8Array(bytes)) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value: string) {
  const text = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(text, (char) => char.charCodeAt(0));
}

function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: object, secret: string) {
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(body),
  );
  return `${body}.${base64url(signature)}`;
}

/** The payload of an untampered, unexpired token. */
async function verify<T extends { exp: number }>(
  token: string | undefined,
  secret: string,
  now: number,
): Promise<T | null> {
  const [payload, signature, extra] = token?.split(".") ?? [];
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const data = JSON.parse(
      new TextDecoder().decode(fromBase64url(payload)),
    ) as T;
    if (typeof data.exp !== "number" || data.exp * 1000 <= now) return null;
    return data;
  } catch {
    return null;
  }
}

const userOf = ({ id, name, email, picture }: SessionUser): SessionUser => ({
  id,
  name,
  email,
  picture,
});

export function signSession(
  user: SessionUser,
  secret: string,
  now = Date.now(),
) {
  return sign(
    { ...userOf(user), exp: Math.floor(now / 1000) + sessionSeconds },
    secret,
  );
}

export async function verifySession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<SessionUser | null> {
  const session = await verify<Session & { aud?: string }>(token, secret, now);
  // A handoff token is not a session, even though the same secret signs both.
  return session && session.aud === undefined ? userOf(session) : null;
}

type Handoff = Session & { aud: string; nonce: string };

/** A one-minute pass that signs a user in on one preview origin holding `nonce`. */
export function signHandoff(
  user: SessionUser,
  aud: string,
  nonce: string,
  secret: string,
  now = Date.now(),
) {
  return sign(
    {
      ...userOf(user),
      aud,
      nonce,
      exp: Math.floor(now / 1000) + handoffSeconds,
    },
    secret,
  );
}

export async function verifyHandoff(
  token: string | undefined,
  aud: string,
  nonce: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<SessionUser | null> {
  const handoff = await verify<Handoff>(token, secret, now);
  if (!handoff || !nonce || handoff.aud !== aud || handoff.nonce !== nonce)
    return null;
  return userOf(handoff);
}

function readCookie(request: Request, name: string) {
  for (const part of request.headers.get("Cookie")?.split(";") ?? []) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
}

function cookie(
  request: Request,
  env: AuthEnv,
  name: string,
  value: string,
  maxAge: number,
) {
  const secure = appOrigin(request, env).startsWith("https:") ? "; Secure" : "";
  // Lax, not Strict: the session must survive the redirect back from Google.
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

const redirect = (location: string | URL, cookies: string[] = []) => {
  const headers = new Headers({
    Location: String(location),
    "Cache-Control": "no-store",
  });
  for (const value of cookies) headers.append("Set-Cookie", value);
  return new Response(null, { status: 302, headers });
};

const signInError = (
  request: Request,
  env: AuthEnv,
  reason: string,
  cookies: string[] = [],
  origin = appOrigin(request, env),
) => redirect(new URL(`/app/sign-in?error=${reason}`, origin), cookies);

/** The preview a sign-in on this origin was started for, if any. */
function returnTarget(request: Request, env: AuthEnv) {
  const value = readCookie(request, returnCookie);
  if (!value) return null;
  try {
    const target = JSON.parse(new TextDecoder().decode(fromBase64url(value)));
    return isPreviewOrigin(target?.origin, env) &&
      typeof target.nonce === "string"
      ? (target as { origin: string; nonce: string })
      : null;
  } catch {
    return null;
  }
}

export async function currentUser(request: Request, env: AuthEnv) {
  if (!env.SESSION_SECRET) return null;
  return verifySession(readCookie(request, sessionCookie), env.SESSION_SECRET);
}

function startGoogle(request: Request, env: AuthEnv) {
  if (!googleAvailable(env)) return signInError(request, env, "unavailable");
  const url = new URL(request.url);

  // A PR preview can't be registered with Google, so it signs in through the sign-in origin and
  // keeps a nonce that the handoff back must carry.
  if (env.SIGN_IN_ORIGIN && isPreviewOrigin(url.origin, env)) {
    const nonce = randomToken();
    const target = new URL("/auth/google", env.SIGN_IN_ORIGIN);
    target.searchParams.set("return", url.origin);
    target.searchParams.set("nonce", nonce);
    return redirect(target, [
      cookie(request, env, handoffCookie, nonce, stateSeconds),
    ]);
  }

  const cookies: string[] = [];
  const returnTo = url.searchParams.get("return");
  const nonce = url.searchParams.get("nonce");
  if (returnTo !== null) {
    if (!isPreviewOrigin(returnTo, env) || !nonce)
      return signInError(request, env, "state");
    const target = encoder.encode(JSON.stringify({ origin: returnTo, nonce }));
    cookies.push(
      cookie(request, env, returnCookie, base64url(target), stateSeconds),
    );
  } else if (readCookie(request, returnCookie))
    // A plain sign-in must not finish an abandoned preview sign-in.
    cookies.push(cookie(request, env, returnCookie, "", 0));

  const state = randomToken();
  const google = new URL(
    env.GOOGLE_AUTH_URL ?? "https://accounts.google.com/o/oauth2/v2/auth",
  );
  google.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
  google.searchParams.set(
    "redirect_uri",
    new URL("/auth/google/callback", appOrigin(request, env)).href,
  );
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid profile email");
  google.searchParams.set("prompt", "select_account");
  google.searchParams.set("state", state);
  return redirect(google, [
    ...cookies,
    cookie(request, env, stateCookie, state, stateSeconds),
  ]);
}

type GoogleProfile = {
  sub?: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
};

async function finishGoogle(request: Request, env: AuthEnv) {
  if (!googleAvailable(env)) return signInError(request, env, "unavailable");
  const url = new URL(request.url);
  const target = returnTarget(request, env);
  const clear = [
    cookie(request, env, stateCookie, "", 0),
    ...(target ? [cookie(request, env, returnCookie, "", 0)] : []),
  ];
  const fail = (reason: string) =>
    signInError(request, env, reason, clear, target?.origin);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error")) return fail("cancelled");
  if (!code || !state || state !== readCookie(request, stateCookie))
    return fail("state");

  const token = await fetch(
    env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        code,
        redirect_uri: new URL("/auth/google/callback", appOrigin(request, env))
          .href,
        grant_type: "authorization_code",
      }),
    },
  );
  const { access_token } = token.ok
    ? ((await token.json()) as { access_token?: string })
    : {};
  if (!access_token) return fail("google");

  const profileResponse = await fetch(
    env.GOOGLE_USERINFO_URL ??
      "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } },
  );
  const profile = profileResponse.ok
    ? ((await profileResponse.json()) as GoogleProfile)
    : {};
  if (!profile.sub) return fail("google");

  const email = profile.email_verified && profile.email ? profile.email : null;
  const user: SessionUser = {
    id: profile.sub,
    name: profile.name || email || "EchoFrame speaker",
    email,
    picture: profile.picture ?? null,
  };
  if (target) {
    const handoff = new URL("/auth/handoff", target.origin);
    handoff.searchParams.set(
      "token",
      await signHandoff(user, target.origin, target.nonce, env.SESSION_SECRET!),
    );
    return redirect(handoff, clear);
  }
  return redirect(new URL("/app/", appOrigin(request, env)), [
    ...clear,
    cookie(
      request,
      env,
      sessionCookie,
      await signSession(user, env.SESSION_SECRET!),
      sessionSeconds,
    ),
  ]);
}

/** A preview accepts the sign-in finished on the sign-in origin. */
async function finishHandoff(request: Request, env: AuthEnv) {
  const url = new URL(request.url);
  const clear = cookie(request, env, handoffCookie, "", 0);
  const user =
    env.SESSION_SECRET && isPreviewOrigin(url.origin, env)
      ? await verifyHandoff(
          url.searchParams.get("token") ?? undefined,
          url.origin,
          readCookie(request, handoffCookie),
          env.SESSION_SECRET,
        )
      : null;
  if (!user) return signInError(request, env, "state", [clear]);
  return redirect(new URL("/app/", url.origin), [
    clear,
    cookie(
      request,
      env,
      sessionCookie,
      await signSession(user, env.SESSION_SECRET!),
      sessionSeconds,
    ),
  ]);
}

function signOut(request: Request, env: AuthEnv) {
  if (request.method !== "POST")
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  // Refuse cross-site form posts that would sign someone out. Compare with the request's own
  // origin, not APP_ORIGIN: wrangler dev rewrites the Origin header and the URL alike.
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return new Response("Forbidden", { status: 403 });
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookie(request, env, sessionCookie, "", 0) },
  });
}

/** Handles /auth/* and /api/session; returns null for everything else. */
export async function handleAuth(request: Request, env: AuthEnv) {
  switch (new URL(request.url).pathname) {
    case "/auth/google":
      return startGoogle(request, env);
    case "/auth/google/callback":
      return finishGoogle(request, env);
    case "/auth/handoff":
      return finishHandoff(request, env);
    case "/auth/sign-out":
      return signOut(request, env);
    case "/api/session":
      return Response.json(
        { user: await currentUser(request, env), google: googleAvailable(env) },
        { headers: { "Cache-Control": "no-store" } },
      );
    default:
      return null;
  }
}
