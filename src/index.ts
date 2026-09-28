import { version } from "../package.json";

export type Env = { ASSETS: { fetch(request: Request): Promise<Response> } };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === "/version")
      return Response.json({ version });
    return env.ASSETS.fetch(request);
  },
};
