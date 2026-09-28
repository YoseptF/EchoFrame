import { cp, mkdir, readdir, rm } from "node:fs/promises";
import tailwind from "bun-plugin-tailwind";

// Keep the directory itself so Wrangler's asset watcher survives rebuilds.
await mkdir("dist", { recursive: true });
await Promise.all(
  (await readdir("dist")).map((file) =>
    rm(`dist/${file}`, { recursive: true, force: true }),
  ),
);
const result = await Bun.build({
  entrypoints: ["src/index.html", "src/app/index.html"],
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
await cp("public", "dist", { recursive: true });
console.log(
  `Built the landing page and app (${result.outputs.length} bundled assets).`,
);
