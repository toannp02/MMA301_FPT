# Current release state — SDK58 photo studio

Native AR/Viro and the separate iPhone companion were removed by explicit user choice. `npm start` now runs the root SDK58 app directly in Expo Go. See README.md and PROGRESS.md for actual verification.

Previous APKs/build links under historical evidence contain the old SDK57 native implementation and do not represent this runtime. Never repack the new SDK58 JavaScript onto those APKs. If a standalone APK is requested, use a full native preview build with the new SDK58 fingerprint:

```powershell
npx eas-cli@26.0.0 build --platform android --profile preview
```

The Android package/EAS project identity remains unchanged. No store submission, OTA update, Apple credential creation or new standalone release is implied by the SDK consolidation. Expo Go needs Metro and is not a standalone iPhone download.

Before delivering any future APK, verify its signature/package, camera-only permissions, embedded current photo-studio markers and absence of Viro/ARCore native libraries, then install/run without Metro on a real Android device. Camera, native pinch/filter fidelity, native data continuity and OS sharing remain hardware-unverified until real evidence is recorded.
