import { expect, test } from "bun:test";
import worker from "./index";
import { version } from "../package.json";

const get = (path: string) => worker.fetch(new Request(`https://echoframe.yosept.me${path}`));

test("the home page shows the version", async () => {
  const res = get("/");
  expect(res.headers.get("content-type")).toContain("text/html");
  expect(await res.text()).toContain(`v${version}`);
});

test("the version is served as json", async () => {
  expect(await get("/version").json()).toEqual({ version });
});

test("anything else is not found", () => {
  expect(get("/nope").status).toBe(404);
});
