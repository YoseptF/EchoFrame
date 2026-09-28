import { expect, mock, test } from "bun:test";
import worker from "./index";
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
