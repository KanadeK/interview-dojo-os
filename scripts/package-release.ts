import archiver from "archiver";
import { createHash } from "node:crypto";
import {
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const version = process.env.npm_package_version ?? "0.1.0";
const root = "dist-release";
const packageDir = join(root, `interview-dojo-os-${version}-node`);
const questionPack = join(root, `interview-dojo-os-${version}-question-pack.zip`);
const appArchive = join(root, `interview-dojo-os-${version}-node.zip`);
rmSync(packageDir, { recursive: true, force: true });
rmSync(questionPack, { force: true });
rmSync(appArchive, { force: true });
mkdirSync(packageDir, { recursive: true });
for (const item of [
  ".next/standalone",
  ".next/static",
  "public",
  "examples",
  "README.md",
  "LICENSE",
  "package.json",
])
  if (existsSync(item))
    cpSync(
      item,
      join(
        packageDir,
        item.replace(".next/standalone", "app").replace(".next/static", "app/.next/static"),
      ),
      { recursive: true },
    );
cpSync("Dockerfile", join(packageDir, "Dockerfile"));
async function zip(output: string, add: (archive: archiver.Archiver) => void) {
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(output);
    const archive = archiver("zip", { zlib: { level: 9 } });
    stream.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(stream);
    add(archive);
    void archive.finalize();
  });
}
async function main() {
  await zip(questionPack, (archive) =>
    archive.file("examples/original-question-pack.json", { name: "original-question-pack.json" }),
  );
  await zip(appArchive, (archive) =>
    archive.directory(packageDir, `interview-dojo-os-${version}-node`),
  );
  const files = readdirSync(root).filter(
    (name) => name !== "SHA256SUMS.txt" && statSync(join(root, name)).isFile(),
  );
  writeFileSync(
    join(root, "SHA256SUMS.txt"),
    files
      .map(
        (name) =>
          `${createHash("sha256")
            .update(readFileSync(join(root, name)))
            .digest("hex")}  ${name}`,
      )
      .join("\n") + "\n",
  );
  console.log(`Packaged ${appArchive} and ${questionPack}`);
}
void main();
