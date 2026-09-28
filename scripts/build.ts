import { cp, mkdir, readdir, rm } from "node:fs/promises";
import tailwind from "bun-plugin-tailwind";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrivacyPolicy, TermsOfService } from "../src/components/legal";

// Keep the directory itself so Wrangler's asset watcher survives rebuilds.
await mkdir("dist", { recursive: true });
await Promise.all(
  (await readdir("dist")).map((file) =>
    rm(`dist/${file}`, { recursive: true, force: true }),
  ),
);
const result = await Bun.build({
  entrypoints: [
    "src/index.html",
    "src/app/index.html",
    "src/privacy.html",
    "src/terms.html",
  ],
  // Absolute asset URLs let /app deep links load the same bundle.
  publicPath: "/",
  splitting: true,
  outdir: "dist",
  target: "browser",
  minify: true,
  plugins: [tailwind],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});
if (!result.success)
  throw new AggregateError(result.logs, "Frontend build failed");
// The legal pages are documents: render them to HTML so they read without JavaScript.
for (const [page, component] of [
  ["privacy", PrivacyPolicy],
  ["terms", TermsOfService],
] as const) {
  const file = Bun.file(`dist/${page}.html`);
  const html = await file.text();
  const root = '<div id="root"></div>';
  if (!html.includes(root)) throw new Error(`No root element in ${page}.html`);
  await Bun.write(
    file,
    html.replace(
      root,
      `<div id="root">${renderToStaticMarkup(createElement(component))}</div>`,
    ),
  );
}
await cp("public", "dist", { recursive: true });
console.log(
  `Built the landing page, app, and legal pages (${result.outputs.length} bundled assets).`,
);
