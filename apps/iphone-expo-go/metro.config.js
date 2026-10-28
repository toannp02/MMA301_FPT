const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const projectRoot = __dirname;
const repositoryRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

// Two intentionally isolated SDKs share TypeScript/screens, never native deps.
// This is not a hoisted npm workspace: all shared imports must use SDK58 here.
config.watchFolders = [repositoryRoot];
config.resolver.nodeModulesPaths = [path.join(projectRoot, "node_modules")];
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Shared files live beside SDK57, but bare imports belong to this SDK58 app.
  const bare = !moduleName.startsWith(".") && !path.isAbsolute(moduleName);
  const scopedContext = bare
    ? { ...context, originModulePath: path.join(projectRoot, "package.json") }
    : context;
  const result = (resolveRequest || context.resolveRequest)(
    scopedContext,
    moduleName,
    platform,
  );
  if (result.type === "sourceFile") {
    const rootModules = path.join(repositoryRoot, "node_modules") + path.sep;
    if (result.filePath.startsWith(rootModules)) {
      throw new Error(
        `SDK isolation: ${moduleName} resolved outside the Expo Go app. Install it in apps/iphone-expo-go.`,
      );
    }
  }
  return result;
};
module.exports = config;
