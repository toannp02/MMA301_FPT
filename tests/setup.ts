import { AssetRegistry } from "react-native";

// Expo's Jest asset transformer emits ID1. RN0.88's public AssetRegistry now
// owns its own registry, separately from jest-expo's secondary-entry mock.
// Register fixture metadata, as Metro does at runtime. Real assets are checked
// independently against the served iOS bundle by scripts/check-expo-go.mjs.
AssetRegistry.registerAsset({
  fileSystemLocation: "/tests/assets",
  httpServerLocation: "/assets/tests",
  width: 1200,
  height: 900,
  scales: [1],
  hash: "test-fixture",
  name: "fixture",
  type: "png",
});
