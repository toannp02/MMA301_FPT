import { mkdirSync, writeFileSync } from "node:fs";
import { Buffer } from "node:buffer";
const base = process.argv[2] || "http://localhost:8082";
const request = async (url, headers) => {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok)
    throw new Error(
      `HTTP ${response.status}: ${(await response.text()).slice(0, 1800)}`,
    );
  return response;
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
  if (client.sdkVersion !== "58.0.0" || client.extra.expoGoPreview !== true)
    throw new Error("Not the SDK58 Expo Go preview manifest");
  const query = "?platform=ios&dev=true&hot=true&minify=false";
  const bundleResponse = await request(
    `${base}/node_modules/expo-router/entry.bundle${query}`,
  );
  const bundle = await bundleResponse.text();
  const artworkAssets = [
    ...bundle.matchAll(
      /registerAsset\((\{\s*"__packager_asset"[\s\S]*?\})\);/g,
    ),
  ]
    .map((match) => JSON.parse(match[1]))
    .filter((asset) => /^art-\d{2}$/.test(asset.name));
  if (artworkAssets.length !== 12)
    throw new Error(
      `Expected 12 bundled catalogue images, found ${artworkAssets.length}`,
    );
  const imageChecks = await Promise.all(
    artworkAssets.map(async (asset) => {
      const uri = new URL(
        `${asset.httpServerLocation}/${asset.name}.${asset.type}`,
        base,
      );
      uri.searchParams.set("platform", "ios");
      uri.searchParams.set("hash", asset.hash);
      const image = await request(uri);
      const bytes = (await image.arrayBuffer()).byteLength;
      if (!image.headers.get("content-type")?.startsWith("image/") || !bytes)
        throw new Error(`Invalid artwork image: ${asset.name}`);
      return { id: asset.name, status: image.status, bytes };
    }),
  );
  const map = await (
    await request(`${base}/node_modules/expo-router/entry.map${query}`)
  ).json();
  const collectSources = (part) => [
    ...(part.sources || []),
    ...(part.sections || []).flatMap((section) => collectSources(section.map)),
  ];
  const sources = [
    ...new Set(
      collectSources(map).map((source) => source.replaceAll("\\", "/")),
    ),
  ];
  const forbidden = sources.filter((source) =>
    /react-viro|\/features\/ar\/|\/screens\/ARScreen\.tsx/.test(source),
  );
  const react = sources.filter((source) =>
    /node_modules\/react\/index\.js$/.test(source),
  );
  const reactNative = sources.filter((source) =>
    /node_modules\/react-native\/index\.js$/.test(source),
  );
  const cameraSources = sources.filter((source) =>
    source.includes("/expo-camera/"),
  );
  const previewSources = sources.filter((source) =>
    /Preview2D(Screen|CameraScreen)\.tsx/.test(source),
  );
  if (
    !cameraSources.length ||
    previewSources.length !== 2 ||
    !bundle.includes("Capture room") ||
    !bundle.includes("Add your artwork")
  )
    throw new Error(
      "2D camera preview route or camera implementation missing from iOS bundle",
    );
  const studioSources = sources.filter((source) =>
    /\/(SpaceEditorScreen|SpacesScreen|SpaceCanvas|ForegroundPainter)\.tsx$/.test(
      source,
    ),
  );
  if (
    studioSources.length !== 4 ||
    !bundle.includes("Protect foreground objects") ||
    !bundle.includes("Edit & save this wall") ||
    !bundle.includes("Export / share PNG")
  )
    throw new Error(
      "Persistent wall studio, foreground painting or export missing from iOS graph",
    );
  const reloadGuardSource = sources.find((source) =>
    source.endsWith("/ui/studio/useUnsavedReloadGuard.ts"),
  );
  if (!reloadGuardSource)
    throw new Error(
      "Native-safe unsaved reload guard is missing from iOS bundle",
    );
  const roomFlowFiles = [
    "/screens/ViewOnRoomScreen.tsx",
    "/studio/photoAssist.ts",
    "/studio/maskPng.ts",
    "/studio/placeArtwork.ts",
    "/infra/analyzeRoomPhoto.ts",
    "/studio/styleEditing.ts",
    "/studio/useDirectManipulation.ts",
    "/studio/directManipulation.ts",
    "/studio/FramePicker.tsx",
    "/studio/ArtworkDimensions.tsx",
  ];
  const roomFlowSources = roomFlowFiles.map((file) =>
    sources.find((source) => source.endsWith(file)),
  );
  if (
    roomFlowSources.some((source) => !source) ||
    !bundle.includes("View on room") ||
    !bundle.includes("Shadow offset") ||
    !bundle.includes("Occlusion on") ||
    !bundle.includes("Tap artwork to edit") ||
    !bundle.includes("Shadow softness") ||
    !bundle.includes("Apply artwork size")
  )
    throw new Error(
      "View-on-room photo assistance or style controls missing from iOS graph",
    );
  if (forbidden.length || react.length !== 1 || reactNative.length !== 1)
    throw new Error(
      `Unexpected native/duplicate runtime modules: ${JSON.stringify({ forbidden, react, reactNative })}`,
    );
  const launch = await request(manifest.launchAsset.url);
  const launchBytes = (await launch.arrayBuffer()).byteLength;
  const report = {
    pass: true,
    sdkVersion: client.sdkVersion,
    expoGoPreview: true,
    bundleBytes: Buffer.byteLength(bundle),
    sources: sources.length,
    viroSources: forbidden,
    react,
    reactNative,
    cameraSources: cameraSources.length,
    previewSources,
    studioSources,
    reloadGuardSource,
    roomFlowSources,
    imageChecks,
    launchStatus: launch.status,
    launchBytes,
  };
  writeFileSync(
    "docs/evidence/expo-go-bundle-check.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  writeFileSync(
    "docs/evidence/expo-go-bundle-check.json",
    JSON.stringify({ pass: false, error: String(error) }, null, 2),
  );
  console.error(error);
  process.exitCode = 1;
}
