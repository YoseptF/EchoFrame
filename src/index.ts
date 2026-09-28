import { version } from "../package.json";
import { jevEndpoint } from "./lib/jev";

export type Env = { ASSETS: { fetch(request: Request): Promise<Response> } };

const maxJevBody = 512 * 1024;

// TypeSafe does not accept browser origins, so the app sends Jev requests here. The visitor's
// own key passes through in the Authorization header and is never stored or logged.
async function relayJev(request: Request) {
  if (request.method !== "POST")
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer "))
    return Response.json({ error: "Add your Jev API key." }, { status: 401 });
  const body = await request.arrayBuffer();
  if (body.byteLength > maxJevBody)
    return Response.json({ error: "Request too large." }, { status: 413 });
  const upstream = await fetch(jevEndpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body,
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/version") return Response.json({ version });
    if (url.pathname === "/api/jev") return relayJev(request);
    // Every /app address is the same single-page app.
    if (url.pathname === "/app" || url.pathname.startsWith("/app/"))
      return env.ASSETS.fetch(new Request(new URL("/app/", url), request));
    return env.ASSETS.fetch(request);
  },
};
