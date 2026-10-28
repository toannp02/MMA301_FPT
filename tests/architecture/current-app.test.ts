import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function sourceFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = join(folder, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.tsx?$/.test(file)
        ? [file]
        : [];
  });
}

test("one root SDK58 app starts Expo Go and has no native AR/cloud companion dependencies", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  expect(pkg.dependencies.expo).toMatch(/^58\./);
  expect(pkg.scripts.start).toContain("--go");
  expect(pkg.main).toBe("expo-router/entry");
  for (const name of ["@reactvision/react-viro", "expo-dev-client", "firebase"])
    expect(pkg.dependencies[name]).toBeUndefined();
  expect(existsSync("apps/iphone-expo-go/package.json")).toBe(false);
});

test("active routes and source imports do not retain retired AR/account/preview branches", () => {
  const files = [...sourceFiles("src"), ...sourceFiles("app")];
  for (const file of files) {
    expect(readFileSync(file, "utf8")).not.toMatch(
      /@reactvision|config\/runtime|features\/ar\/|infra\/firebase|apps\/iphone-expo-go/,
    );
  }
  for (const file of [
    "app/ar/[id].tsx",
    "app/login.tsx",
    "app/register.tsx",
    "app/preview-2d/[id].tsx",
  ])
    expect(existsSync(file)).toBe(false);
});
