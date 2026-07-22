import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
function run(command: string, args: string[]) {
  return execFileSync(command, args, { encoding: "utf8" });
}
function fail(message: string): never {
  throw new Error(message);
}
if (run("git", ["status", "--porcelain"]).trim()) fail("Working tree is not clean");
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
if (pkg.version !== "0.1.0") fail("package version must be 0.1.0");
if (!readFileSync("CHANGELOG.md", "utf8").includes("v0.1.0")) fail("CHANGELOG is missing v0.1.0");
if (!existsSync("dist-release/SHA256SUMS.txt")) fail("Release checksums are missing");
if (!readdirSync("dist-release").some((name) => name.startsWith("interview-dojo-os-0.1.0")))
  fail("Release package is missing");
const forbidden = run("git", [
  "grep",
  "-nE",
  "TODO|FIXME|NotImplemented|placeholder|coming soon|lorem ipsum",
  "--",
  ":!docs/ROADMAP.md",
]).trim();
if (forbidden) fail(`Forbidden marker found:\n${forbidden}`);
const authors = run("git", ["log", "--format=%an <%ae>"]).trim().split("\n").filter(Boolean);
if (
  authors.some(
    (author) => !author.startsWith("KanadeK <121669563+KanadeK@users.noreply.github.com>"),
  )
)
  fail("Unexpected git author found");
console.log("Release checks passed.");
