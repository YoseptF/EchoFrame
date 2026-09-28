// Major versions are launches. A launch is a file launches/v<major>.md that says why this is a
// major and carries the posts that announce it. It is the only way to get a major bump, it arrives
// in a pull request of its own, and it ships no sooner than COOLDOWN_DAYS after it last changed.
// See launches/README.md.
//
//   bun scripts/launch.ts check       launch files, launch PR rules and major changesets (PRs into release)
//   bun scripts/launch.ts status      markdown for the release preview comment
//   bun scripts/launch.ts gate        fail when breaking changes are pending but no launch can ship them
//   bun scripts/launch.ts apply       if the armed launch is ready, write its major changeset
//   bun scripts/launch.ts notes <v>   the launch's why, if <v> is a launch version
//   bun scripts/launch.ts posts <v>   the launch's tweet and LinkedIn post, if <v> is a launch version
import { $ } from "bun";
import { appendFileSync } from "node:fs";

export const COOLDOWN_DAYS = 7;
const PACKAGE = "echoframe";
const DAY = 24 * 60 * 60 * 1000;

export const SECTIONS = {
  why: { heading: "Why this is a major", min: 400, max: Infinity },
  changes: { heading: "What changes for people already using it", min: 40, max: Infinity },
  tweet: { heading: "Tweet", min: 40, max: 280 },
  linkedin: { heading: "LinkedIn post", min: 600, max: Infinity },
} as const;
type Section = keyof typeof SECTIONS;

export type Launch = { file: string; major: number; title: string; sections: Record<Section, string> };

export function parseLaunch(file: string, text: string): { launch?: Launch; errors: string[] } {
  const errors: string[] = [];
  const major = Number(file.match(/v(\d+)\.md$/)?.[1]);
  if (!major) errors.push(`${file}: launch files are named v<major>.md, like launches/v1.md`);
  const body = text.replace(/<!--[\s\S]*?-->/g, "");
  const title = body.match(/^# (.+)$/m)?.[1]?.trim() ?? "";
  if (!title) errors.push(`${file}: needs a "# <title>" line, the name of the launch`);
  const found = new Map<string, string>();
  for (const part of body.split(/^## /m).slice(1)) {
    const [heading = "", ...rest] = part.split("\n");
    found.set(heading.trim().toLowerCase(), rest.join("\n").trim());
  }
  const sections = {} as Record<Section, string>;
  for (const [key, { heading, min, max }] of Object.entries(SECTIONS) as [Section, (typeof SECTIONS)[Section]][]) {
    const content = found.get(heading.toLowerCase()) ?? "";
    sections[key] = content;
    if (!found.has(heading.toLowerCase())) errors.push(`${file}: missing "## ${heading}"`);
    else if (/\b(TODO|TBD|FIXME|lorem ipsum)\b/i.test(content)) errors.push(`${file}: "## ${heading}" still has a placeholder`);
    else if (content.length < min) errors.push(`${file}: "## ${heading}" is ${content.length} characters, a launch needs at least ${min}`);
    else if (content.length > max) errors.push(`${file}: "## ${heading}" is ${content.length} characters, the limit is ${max}`);
  }
  return errors.length ? { errors } : { launch: { file, major, title, sections }, errors };
}

export function majorChangesets(files: { file: string; text: string }[]): string[] {
  const bump = new RegExp(`^\\s*["']?${PACKAGE}["']?\\s*:\\s*major\\s*$`, "m");
  return files.filter(({ text }) => bump.test(text.split(/^---$/m)[1] ?? "")).map(({ file }) => file);
}

export function readyOn(armedAt: Date | undefined): Date | undefined {
  return armedAt && new Date(armedAt.getTime() + COOLDOWN_DAYS * DAY);
}

const day = (d: Date) => d.toISOString().slice(0, 10);

async function read(pattern: string, dir: string) {
  const files = [];
  for await (const name of new Bun.Glob(pattern).scan(dir)) {
    const file = `${dir}/${name}`;
    files.push({ file, text: await Bun.file(file).text() });
  }
  return files;
}

async function state() {
  const version: string = (await Bun.file("package.json").json()).version;
  const current = Number(version.split(".")[0]);
  const errors: string[] = [];
  const launches: Launch[] = [];
  for (const { file, text } of await read("v*.md", "launches")) {
    const parsed = parseLaunch(file, text);
    errors.push(...parsed.errors);
    if (parsed.launch) launches.push(parsed.launch);
    const major = parsed.launch?.major ?? 0;
    if (major > current + 1)
      errors.push(`${file}: echoframe is ${version}, so the only launch that can be armed is v${current + 1}`);
  }
  const armed = launches.find((l) => l.major === current + 1);
  const armedAt = armed && (await $`git log -1 --format=%cI -- ${armed.file}`.nothrow().quiet().text()).trim();
  const ready = readyOn(armedAt ? new Date(armedAt) : undefined);
  const changesets = await read("*.md", ".changeset");
  const majors = majorChangesets(changesets.filter(({ file }) => !file.endsWith("README.md")));
  return { version, current, errors, launches, armed, ready, isReady: !!ready && ready <= new Date(), majors };
}

async function changedFiles(): Promise<string[] | undefined> {
  let base = process.env.BASE_SHA;
  const head = process.env.HEAD_SHA ?? "HEAD";
  if (!base) {
    const mergeBase = await $`git merge-base HEAD origin/release`.nothrow().quiet();
    if (mergeBase.exitCode !== 0) return undefined;
    base = mergeBase.text().trim();
  }
  return (await $`git diff --name-only ${base} ${head}`.quiet().text()).split("\n").filter(Boolean);
}

async function check() {
  const s = await state();
  const errors = [...s.errors];
  const changed = await changedFiles();
  if (changed) {
    const touched = changed.filter((f) => /^launches\/v\d+\.md$/.test(f));
    for (const file of touched) {
      const major = Number(file.match(/v(\d+)/)?.[1]);
      if (major <= s.current) errors.push(`${file}: v${major} has shipped, its launch file is history and does not change`);
    }
    const others = changed.filter((f) => !f.startsWith("launches/"));
    if (touched.length && others.length)
      errors.push(`a launch is its own pull request: this one also changes ${others.join(", ")}`);
  }
  if (s.majors.length && !s.armed) {
    const hint = s.current === 0 ? " While echoframe is 0.x a breaking change is a minor." : " Keep the old behaviour working and deprecate it (minor); the removal waits for the next launch.";
    errors.push(`${s.majors.join(", ")} asks for a major, and majors only come with a launch (launches/README.md).${hint}`);
  }
  for (const e of errors) console.log(`::error::${e}`);
  if (errors.length) process.exit(1);
  console.log(s.armed ? `launch v${s.armed.major} is armed${s.ready ? `, ready on ${day(s.ready)}` : ", ready 7 days after it is committed"}` : "no launch armed");
}

async function status() {
  const s = await state();
  if (!s.armed) {
    console.log(`No launch armed. This merge cannot change the major version (echoframe ${s.version}).`);
    return;
  }
  const v = `${s.armed.major}.0.0`;
  if (s.isReady) {
    console.log(`## THIS MERGE LAUNCHES ${s.armed.title} (v${v})\n`);
    console.log(`Merging tags v${v} and publishes the release. Be ready to post:\n`);
    console.log(`**Tweet**\n\n> ${s.armed.sections.tweet.replace(/\n/g, "\n> ")}\n`);
    console.log(`<details><summary>LinkedIn post</summary>\n\n${s.armed.sections.linkedin}\n\n</details>`);
    return;
  }
  const when = s.ready ? day(s.ready) : "7 days after it is committed";
  console.log(`Launch v${s.armed.major} (${s.armed.title}) is armed and cooling down until ${when}. This merge does not launch it.`);
  if (s.majors.length) console.log(`\n**Blocked:** breaking changes are pending (${s.majors.join(", ")}), so nothing ships until the launch does.`);
}

async function gate() {
  const s = await state();
  for (const e of s.errors) console.log(`::error::${e}`);
  if (s.errors.length) process.exit(1);
  if (!s.majors.length) return console.log("no breaking changes pending");
  if (!s.armed) {
    console.log(`::error::${s.majors.join(", ")} asks for a major but no launch is armed`);
    process.exit(1);
  }
  if (!s.isReady) {
    console.log(`::error::breaking changes are waiting on launch v${s.armed.major}, which can ship on ${s.ready ? day(s.ready) : "7 days after it is committed"}`);
    process.exit(1);
  }
  console.log(`breaking changes ship with launch v${s.armed.major}`);
}

async function apply() {
  const s = await state();
  if (!s.armed || !s.isReady || s.errors.length) return console.log("no launch ready");
  const lead = s.armed.sections.why.split(/\n\s*\n/)[0]!.replace(/\s+/g, " ");
  await Bun.write(`.changeset/launch-v${s.armed.major}.md`, `---\n"${PACKAGE}": major\n---\n\n${s.armed.title}. ${lead}\n`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${s.armed.major}.0.0\n`);
  console.log(`launching v${s.armed.major}`);
}

async function launchFor(version = "") {
  const major = version.match(/^(\d+)\.0\.0$/)?.[1];
  const file = `launches/v${major}.md`;
  if (!major || !(await Bun.file(file).exists())) return undefined;
  return parseLaunch(file, await Bun.file(file).text()).launch;
}

if (import.meta.main) {
  const [command, arg] = process.argv.slice(2);
  switch (command) {
    case "check": await check(); break;
    case "status": await status(); break;
    case "gate": await gate(); break;
    case "apply": await apply(); break;
    case "notes": {
      const l = await launchFor(arg);
      if (l) console.log(`## ${l.title}\n\n${l.sections.why}`);
      break;
    }
    case "posts": {
      const l = await launchFor(arg);
      if (l) console.log(`## Echoframe ${arg} is out. Post it.\n\n### Tweet\n\n${l.sections.tweet}\n\n### LinkedIn\n\n${l.sections.linkedin}`);
      break;
    }
    default:
      console.error("usage: bun scripts/launch.ts check|status|gate|apply|notes <version>|posts <version>");
      process.exit(2);
  }
}
