import { mkdirSync, writeFileSync } from "node:fs";
import { Buffer } from "node:buffer";
const base = process.argv[2] || "http://localhost:8082";
let phase = "manifest";
const request = async (url, headers) => {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(120000) });
  if (!r.ok)
    throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 1000)}`);
  return r;
};
mkdirSync("docs/evidence", { recursive: true });
try {
  const manifest = await (
    await request(`${base}/`, {
      accept: "application/expo+json",
      "expo-platform": "ios",
    })
  ).json();
  const client = manifest.extra.expoClient;
  if (client.sdkVersion !== "58.0.0")
    throw new Error("Expected the unified SDK58 app");
  phase = "iOS bundle";
  const query = "?platform=ios&dev=true&hot=false&minify=false";
  const bundle = await (
    await request(`${base}/node_modules/expo-router/entry.bundle${query}`)
  ).text();
  phase = "source map";
  const map = await (
    await request(`${base}/node_modules/expo-router/entry.map${query}`)
  ).json();
  const collect = (p) => [
    ...(p.sources || []),
    ...(p.sections || []).flatMap((s) => collect(s.map)),
  ];
  const sources = [
    ...new Set(collect(map).map((s) => s.replaceAll("\\", "/"))),
  ];
  const forbidden = sources.filter((s) =>
    /react-viro|\/features\/ar\/|\/screens\/ARScreen|apps\/iphone-expo-go|\/firebase\//.test(
      s,
    ),
  );
  const react = sources.filter((s) =>
    /node_modules\/react\/index\.js$/.test(s),
  );
  const reactNative = sources.filter((s) =>
    /node_modules\/react-native\/index\.js$/.test(s),
  );
  if (forbidden.length || react.length !== 1 || reactNative.length !== 1)
    throw new Error(
      `Unexpected app graph: ${JSON.stringify({ forbidden, react, reactNative })}`,
    );
  const requiredFiles = [
    "/app/index.tsx",
    "/screens/GalleryScreen.tsx",
    "/screens/SpacesScreen.tsx",
    "/screens/SpaceEditorScreen.tsx",
    "/screens/ImportArtworkScreen.tsx",
    "/screens/ViewOnRoomScreen.tsx",
    "/studio/ArtworkStylePanel.tsx",
    "/studio/StudioControl.tsx",
    "/studio/useDirectManipulation.ts",
    "/studio/useUnsavedReloadGuard.ts",
    "/studio/rendering.ts",
    "/infra/analyzeRoomPhoto.ts",
  ];
  const coreSources = requiredFiles.map((file) =>
    sources.find((s) => s.endsWith(file)),
  );
  if (coreSources.some((s) => !s))
    throw new Error(
      `Missing core sources: ${requiredFiles.filter((_, i) => !coreSources[i])}`,
    );
  for (const marker of [
    "Tap artwork to edit",
    "Shadow softness",
    "Artwork depth (cm)",
    "Apply artwork size",
    "Export / share PNG",
    "Add your room",
    "View on room",
    "Take a Photo",
    "Choose from Photos",
  ]) {
    if (!bundle.includes(marker)) throw new Error(`Missing feature: ${marker}`);
  }
  const pickerSources = sources.filter((s) =>
    s.includes("/expo-image-picker/"),
  );
  if (!pickerSources.length)
    throw new Error("Room/art camera and photo picker missing");
  phase = "catalogue assets";
  const assets = [
    ...bundle.matchAll(
      /registerAsset\((\{\s*"__packager_asset"[\s\S]*?\})\);/g,
    ),
  ]
    .map((m) => JSON.parse(m[1]))
    .filter((a) => /^art-\d{2}$/.test(a.name));
  if (assets.length !== 12)
    throw new Error(`Expected12 catalogue assets, got ${assets.length}`);
  const imageChecks = await Promise.all(
    assets.map(async (asset) => {
      const uri = new URL(
        `${asset.httpServerLocation}/${asset.name}.${asset.type}`,
        base,
      );
      uri.searchParams.set("platform", "ios");
      uri.searchParams.set("hash", asset.hash);
      const r = await request(uri);
      const bytes = (await r.arrayBuffer()).byteLength;
      if (!r.headers.get("content-type")?.startsWith("image/") || !bytes)
        throw new Error(`Invalid image ${asset.name}`);
      return { id: asset.name, status: r.status, bytes };
    }),
  );
  phase = "launch asset";
  const launch = await request(manifest.launchAsset.url);
  const report = {
    pass: true,
    utc: new Date().toISOString(),
    sdkVersion: client.sdkVersion,
    name: client.name,
    hostUri: client.hostUri,
    bundleBytes: Buffer.byteLength(bundle),
    sources: sources.length,
    forbidden,
    react,
    reactNative,
    coreSources,
    pickerSources: pickerSources.length,
    imageChecks,
    launchStatus: launch.status,
    launchBytes: (await launch.arrayBuffer()).byteLength,
    physicalDevice: "UNVERIFIED",
  };
  writeFileSync(
    "docs/evidence/expo-go-bundle-check.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  writeFileSync(
    "docs/evidence/expo-go-bundle-check.json",
    JSON.stringify({ pass: false, phase, error: String(error) }, null, 2),
  );
  console.error(phase, error);
  process.exitCode = 1;
}
