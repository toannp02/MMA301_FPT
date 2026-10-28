# Android wall placement repair — 2026-10-27

User symptom: camera opens on Android, but artwork cannot be placed. No model, screen recording or device log was supplied. The local Android SDK's adb devices command returns an empty list. Physical reproduction remains UNVERIFIED.

## Findings and repairs

1. The installed Viro 3.0.3 plane selector filters `alignment="Vertical"` in JavaScript, but omits `alignment` on the native `ViroARPlane` it creates. Inspection of the installed Android AAR with javap confirms the native default is Horizontal (evidence/ar-fix-native-default.log). The renderer's constraint matcher rechecks alignment on anchor updates; this can detach a wall node, leaving the camera active without usable placement. `WallPlaneSelector` supplies Vertical on every rendered native plane while retaining the pinned library's plane tracking, world-to-local tap conversion and reset implementation. No node_modules or binary patch was made. The override uses the pinned selector's `_renderPlanes` method; its regression test must pass before a Viro upgrade.
2. Noninteractive instruction panels could consume touches intended for the native scene. Their parent containers now use box-none and the explanatory card uses none; actual controls remain interactive.
3. Viro reports image load completion with `nativeEvent.success`. The scene previously marked every completion as loaded, including failures. Failed completions now retain the disabled capture state and show the texture error.
4. Viro's Android availability wrapper rejects temporary TRANSIENT/UNKNOWN responses. Startup now retries these states within a bounded timeout, preserving camera/unsupported/pending errors for recovery. This is a separate startup defect; it does not by itself explain the user's already-open camera.
5. Artwork preparation now has a timeout, avoiding an indefinite pre-camera spinner.

Upstream references inspected for the native constraint behavior:

- https://github.com/ReactVision/virocore/blob/main/ViroRenderer/VROARConstraintMatcher.cpp
- https://github.com/ReactVision/virocore/blob/main/ViroRenderer/VROARDeclarativePlane.h

These explain a source-level failure path, not a physical-device pass or proof that every cause of the reported symptom is resolved.

## Actual checks

- Root strict typecheck, ESLint,76 Jest tests/14 suites, Expo Doctor and dependency compatibility: PASS; evidence/ar-fix-verification.json.
- New tests exercise the real installed selector with only native rendering leaves mocked: wall discovery, native Vertical alignment, world-space tap conversion, continued placement after anchor updates, reset, horizontal-floor rejection, anchor removal and image success/failure.
- Availability tests: transient/unknown recovery, bounded exhaustion, unsupported and unexpected errors. Existing permission denial/recovery checks also pass.
- iPhone Expo Go companion strict typecheck: PASS. No shared imports, Metro configuration or SDK versions changed.
- Android production Hermes export: PASS; evidence/ar-fix-export.log.
- Android prebuild and generated CAMERA manifest check: PASS; evidence/ar-fix-prebuild.log and ar-fix-manifest-check.log.
- Native fingerprint e0d09ec1f2708dfd8bbc1762c96210b706e24ca7 matches the corrected personal-artwork build. New APK uses EAS repack0.10.4 with embedded bundle/assets and managed signing. See ar-fix-repack-compatibility.json and ar-fix-workflow-* evidence.

Initial new-test harness attempts failed due to a string-only selector mock, untyped native component lookup names and an expected generic unsupported message. Corrected mocks/types and the expected specific error; all final checks above passed.

## Device retest

Install the new signed APK over the old app to preserve local imports/saves; do not clear app data. Close the old process, open Gallery, choose a catalogue piece and View in AR, grant camera, scan a well-lit textured vertical wall, tap its highlighted area. Check that the artwork remains placed while moving sideways. Test reset, size, change art, capture and reopening saved photos. Repeat with a personal import and Metro stopped.

Record model, Android and Google Play Services for AR versions, whether a highlighted wall appears, any error text, a nonprivate recording and logcat if the failure remains. No AR_DEVICE_PASS, capture contents, physical installation or live-cloud pass is claimed here.
