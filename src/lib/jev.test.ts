import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { askJev, checkJevKey, JevError } from "./jev";

afterEach(() => mock.restore());

test("requests go to the relay with the trimmed key and the latest model", async () => {
  const fetch = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ model: "jev-1.13.0", answers: {}, usage: {} }),
  );
  expect(await checkJevKey("  ts_key \n")).toBe("jev-1.13.0");
  const [url, init] = fetch.mock.calls[0]!;
  expect(url).toBe("/api/jev");
  expect((init?.headers as Record<string, string>).Authorization).toBe(
    "Bearer ts_key",
  );
  expect(JSON.parse(init?.body as string)).toMatchObject({
    model: "jev-latest",
  });
});

test("errors explain what the speaker can do", async () => {
  spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("", { status: 401 }),
  );
  const error = await askJev("bad", { state: "", questions: {} }).catch(
    (e) => e,
  );
  expect(error).toBeInstanceOf(JevError);
  expect(error).toMatchObject({ status: 401 });
  expect(error.message).toContain("didn’t accept this key");
});
