import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("docs/evidence", { recursive: true });
const checks = [
  ["typecheck", "npm", ["run", "typecheck"]],
  ["lint", "npm", ["run", "lint"]],
  ["unit-tests", "npm", ["test", "--", "--runInBand"]],
  ["doctor", "npm", ["run", "doctor"]],
  ["dependency-check", "npx", ["expo", "install", "--check"]],
];
const report = [];
for (const [name, cmd, args] of checks) {
  const result = spawnSync(
    process.platform === "win32" ? `${cmd}.cmd` : cmd,
    args,
    {
      encoding: "utf8",
      shell: process.platform === "win32",
      env: { ...process.env, CI: "1" },
    },
  );
  writeFileSync(
    `docs/evidence/${name}.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}\nEXIT_CODE=${result.status}\n`,
  );
  report.push({
    name,
    exitCode: result.status,
    error: result.error?.message ?? null,
  });
  console.log(`${name}: ${result.status === 0 ? "PASS" : "FAIL"}`);
}
writeFileSync(
  "docs/evidence/verification.json",
  JSON.stringify({ utc: new Date().toISOString(), checks: report }, null, 2),
);
process.exitCode = report.every((c) => c.exitCode === 0) ? 0 : 1;
