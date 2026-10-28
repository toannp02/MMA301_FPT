const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// Captures, migration backups and build outputs are never app modules/assets.
config.resolver.blockList = [/[/\\]artifacts[/\\].*/];
module.exports = config;
