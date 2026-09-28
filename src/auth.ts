// Google sign-in without a database. The Worker runs the OAuth code flow and keeps the result in
// a signed, HttpOnly session cookie; the library itself stays on the user's device.

export type AuthEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Signs session cookies. Rotating it signs everyone out. */
  SESSION_SECRET?: string;
  /** The public origin, when the request URL doesn't show it (wrangler dev reports the route host). */
  APP_ORIGIN?: string;
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
const sessionSeconds = 60 * 60 * 24 * 30;
const stateSeconds = 60 * 10;

export const googleAvailable = (env: AuthEnv) =>
  Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SESSION_SECRET,
  );

const appOrigin = (request: Request, env: AuthEnv) =>
  env.APP_ORIGIN ?? new URL(request.url).origin;

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

export async function signSession(
  user: SessionUser,
  secret: string,
  now = Date.now(),
) {
  const payload = base64url(
    encoder.encode(
      JSON.stringify({ ...user, exp: Math.floor(now / 1000) + sessionSeconds }),
    ),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(payload),
  );
  return `${payload}.${base64url(signature)}`;
}

export async function verifySession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<SessionUser | null> {
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
    const session = JSON.parse(
      new TextDecoder().decode(fromBase64url(payload)),
    ) as Session;
    if (typeof session.exp !== "number" || session.exp * 1000 <= now)
      return null;
    return {
      id: session.id,
      name: session.name,
      email: session.email,
      picture: session.picture,
    };
  } catch {
    return null;
  }
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
) =>
  redirect(
    new URL(`/app/sign-in?error=${reason}`, appOrigin(request, env)),
    cookies,
  );

export async function currentUser(request: Request, env: AuthEnv) {
  if (!env.SESSION_SECRET) return null;
  return verifySession(readCookie(request, sessionCookie), env.SESSION_SECRET);
}

function startGoogle(request: Request, env: AuthEnv) {
  if (!googleAvailable(env)) return signInError(request, env, "unavailable");
  const state = base64url(crypto.getRandomValues(new Uint8Array(24)));
  const url = new URL(
    env.GOOGLE_AUTH_URL ?? "https://accounts.google.com/o/oauth2/v2/auth",
  );
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
  url.searchParams.set(
    "redirect_uri",
    new URL("/auth/google/callback", appOrigin(request, env)).href,
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  return redirect(url, [
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
  const clearState = cookie(request, env, stateCookie, "", 0);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error"))
    return signInError(request, env, "cancelled", [clearState]);
  if (!code || !state || state !== readCookie(request, stateCookie))
    return signInError(request, env, "state", [clearState]);

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
  if (!access_token) return signInError(request, env, "google", [clearState]);

  const profileResponse = await fetch(
    env.GOOGLE_USERINFO_URL ??
      "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } },
  );
  const profile = profileResponse.ok
    ? ((await profileResponse.json()) as GoogleProfile)
    : {};
  if (!profile.sub) return signInError(request, env, "google", [clearState]);

  const email = profile.email_verified && profile.email ? profile.email : null;
  const user: SessionUser = {
    id: profile.sub,
    name: profile.name || email || "EchoFrame speaker",
    email,
    picture: profile.picture ?? null,
  };
  return redirect(new URL("/app/", appOrigin(request, env)), [
    clearState,
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
