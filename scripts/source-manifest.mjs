import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const walk = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = join(folder, entry.name);
    return entry.isDirectory() ? walk(file) : [file.replaceAll("\\", "/")];
  });
const files = [
  ...walk("src"),
  ...walk("app"),
  ...walk("assets"),
  "app.config.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "eas.json",
  "metro.config.js",
]
  .sort()
  .map((path) => ({ path, sha256: hash(readFileSync(path)) }));
const manifest = {
  deliveryBuildId: process.argv[2] || null,
  note: "Runtime source/config/assets snapshot at generation time. Build association must be verified separately; this manifest does not claim device acceptance.",
  sha256: hash(files.map((file) => `${file.path}:${file.sha256}\n`).join("")),
  files,
};
writeFileSync(
  "docs/evidence/runtime-source-manifest.json",
  JSON.stringify(manifest, null, 2),
);
console.log(`${files.length} source/config/assets files: ${manifest.sha256}`);
