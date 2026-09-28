import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { sessionSeconds } from "@/auth";
import { PrivacyPolicy, TermsOfService } from "./legal";

// The policy makes promises about the code; keep them in step.
test("the privacy policy matches what sign-in actually does", () => {
  const text = renderToStaticMarkup(<PrivacyPolicy />);
  expect(sessionSeconds).toBe(30 * 24 * 60 * 60);
  expect(text).toContain("expires after 30 days");
  expect(text).toContain("<em>openid</em>");
  expect(text).toContain("Limited Use requirements");
  expect(text).toContain("myaccount.google.com/connections");
  expect(text).toContain("mailto:yosept.flores@gmail.com");
  // The live session's button carries the same words the policy promises.
  expect(text).toContain("“Start listening”");
});

test("both legal pages link to each other", () => {
  for (const page of [<PrivacyPolicy />, <TermsOfService />]) {
    const html = renderToStaticMarkup(page);
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
  }
});
