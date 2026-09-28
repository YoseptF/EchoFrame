import { afterEach, expect, mock, spyOn, test } from "bun:test";
import worker from "./index";
import { jevEndpoint } from "./lib/jev";
import { signSession } from "./auth";
import { version } from "../package.json";

test("the version endpoint bypasses static assets", async () => {
  const fetch = mock(async () => new Response("asset"));
  const response = await worker.fetch(
    new Request("https://echoframe.yosept.me/version"),
    { ASSETS: { fetch } },
  );
  expect(await response.json()).toEqual({ version });
  expect(fetch).not.toHaveBeenCalled();
});

test("page and asset requests preserve the asset service response", async () => {
  for (const [path, status, body] of [
    ["/", 200, "landing page"],
    ["/images/forest.webp", 200, "image"],
    ["/nope", 404, "Not found"],
  ] as const) {
    const request = new Request(`https://echoframe.yosept.me${path}`);
    const fetch = mock(async () => new Response(body, { status }));
    const response = await worker.fetch(request, { ASSETS: { fetch } });
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response.status).toBe(status);
    expect(await response.text()).toBe(body);
  }
});

test("every app address serves the app shell", async () => {
  for (const path of ["/app", "/app/", "/app/folders/abc", "/app/settings"]) {
    const fetch = mock(async (request: Request) => new Response(request.url));
    const response = await worker.fetch(
      new Request(`https://echoframe.yosept.me${path}`),
      { ASSETS: { fetch } },
    );
    expect(await response.text()).toBe("https://echoframe.yosept.me/app/");
  }
});

afterEach(() => mock.restore());

const noAssets = {
  ASSETS: { fetch: mock(async () => new Response()) },
  SESSION_SECRET: "session-secret",
};
const signedIn = async () =>
  `ef_session=${await signSession(
    { id: "1", name: "Ada", email: null, picture: null },
    "session-secret",
  )}`;

test("the Jev relay forwards the visitor's key and body to TypeSafe", async () => {
  const upstream = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ answers: {} }, { status: 200 }),
  );
  const body = JSON.stringify({
    model: "jev-latest",
    state: "hi",
    questions: {},
  });
  const response = await worker.fetch(
    new Request("https://echoframe.yosept.me/api/jev", {
      method: "POST",
      headers: { Authorization: "Bearer ts_key", Cookie: await signedIn() },
      body,
    }),
    noAssets,
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({ answers: {} });
  const [url, init] = upstream.mock.calls[0]!;
  expect(url).toBe(jevEndpoint);
  expect(init?.headers).toEqual({
    Authorization: "Bearer ts_key",
    "Content-Type": "application/json",
  });
  expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe(body);
});

test("the Jev relay passes TypeSafe errors through", async () => {
  spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ detail: "Invalid key" }, { status: 401 }),
  );
  const response = await worker.fetch(
    new Request("https://echoframe.yosept.me/api/jev", {
      method: "POST",
      headers: { Authorization: "Bearer wrong", Cookie: await signedIn() },
      body: "{}",
    }),
    noAssets,
  );
  expect(response.status).toBe(401);
});

test("the Jev relay refuses requests it should not forward", async () => {
  const upstream = spyOn(globalThis, "fetch");
  const relay = (init: RequestInit) =>
    worker.fetch(
      new Request("https://echoframe.yosept.me/api/jev", init),
      noAssets,
    );
  const cookie = await signedIn();
  expect((await relay({ method: "GET" })).status).toBe(405);
  expect(
    (
      await relay({
        method: "POST",
        headers: { Authorization: "Bearer k" },
        body: "{}",
      })
    ).status,
  ).toBe(403);
  expect(
    (await relay({ method: "POST", headers: { Cookie: cookie }, body: "{}" }))
      .status,
  ).toBe(401);
  expect(
    (
      await relay({
        method: "POST",
        headers: { Authorization: "Bearer k", Cookie: cookie },
        body: "x".repeat(512 * 1024 + 1),
      })
    ).status,
  ).toBe(413);
  expect(upstream).not.toHaveBeenCalled();
});
