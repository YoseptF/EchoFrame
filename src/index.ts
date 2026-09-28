import { version } from "../package.json";

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>echoframe</title>
<style>
  :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
  body { margin: 0; min-height: 100vh; display: grid; place-content: center; text-align: center; }
  h1 { font-size: clamp(2.5rem, 8vw, 5rem); margin: 0; letter-spacing: -0.04em; }
  p { opacity: 0.6; margin: 0.5rem 0 0; }
</style>
</head>
<body>
<h1>echoframe</h1>
<p>v${version}</p>
</body>
</html>`;

export default {
  fetch(request: Request): Response {
    const { pathname } = new URL(request.url);
    if (pathname === "/version") return Response.json({ version });
    if (pathname !== "/") return new Response("Not found", { status: 404 });
    return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
