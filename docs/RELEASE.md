# Release and demo

## Latest candidate - style, sizes and zoom

Current source adds shadow angle/softness, visual frame presets, explicit artwork width/height and separate room/art zoom. See STYLE_ZOOM.md. Root TS/lint/151 tests in25 suites/Doctor/dependency checks PASS; companion TS/Doctor/dependencies/iOS graph and Android Hermes export PASS. Native two-finger gestures/filter fidelity/device installation still need phone retesting.

[Current packaging workflow01a17e3e-9f2e-7260-841e-e96fbcee7c8b](https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/workflows/01a17e3e-9f2e-7260-841e-e96fbcee7c8b) uses verified matching native base15a939d0 and embeds corrected current JS/assets. Source131-file SHA2560bfaa0ad841948db39ac29d76302a6309677a817de097fa71c4a68bd10bd9f9d. No runtime edits after upload. Prior queued text-fix candidate bd8d036d was canceled as superseded by these requested features; older sections below are historical. Current status: evidence/style-workflow-status.json. No current APK download/signature/install pass until an artifact is actually available. No background monitor.

## Latest candidate - native Text boundary repair

Removed a raw JSX space from the Add your room modal that Fabric rejected outside Text. Root TS/lint/146 tests in24 suites/Doctor/dependencies PASS; companion TS/Doctor/dependencies and iOS graph PASS. Reload Expo Go on8082 for the fix. Physical phone retest remains pending.

[Replacement workflow01a17e33-b9bd-787f-8da5-fe46aded1ca9](https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/workflows/01a17e33-b9bd-787f-8da5-fe46aded1ca9) uploaded corrected source128 files SHA2560da1f6c62b5c1ba49165cadb89f4efb9ab3958408a3398b05e052187ed2ccc4a. No current artifact/signature/install pass yet. Candidate cff492fd was canceled because it contains the raw-space bug; never deliver it. Previous sections below are historical snapshots. No runtime changes after this replacement upload.

## Current source - persistent photo studio

The latest source adds reusable wall spaces, manual perspective/calibration, multiple artwork layouts, frames/mounts/colour, manual foreground masks, own-image duplicate review and PNG export. See PLACED_STUDIO.md for implemented scope and remaining parity. SDK58 Expo Go on8082 serves the photo studio; native Android retains Viro AR separately.

## Latest screenshot-flow candidate

Artworks/Interiors/Saved, View on room automatic active-room application, local photo wall/tone/mask suggestions, resize handles, eight visual layouts and Style Image/Light are included in workflow [01a17e26-2f84-7c8b-86ef-e0aab76d36fd](https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/workflows/01a17e26-2f84-7c8b-86ef-e0aab76d36fd). Source128 files SHA2568b43d5cde402585188e428321e8c97384adda54f64117aba744e01f85a841dd9. No runtime source changes after upload.

Managed repack is allowed here because current native fingerprint6fb75628d3441f13dc27d34f39d80d8482bf9dce matches finished native base15a939d0. The base APK lacks this latest flow and must not be presented as this candidate. Current workflow state is evidence/view-room-workflow-status.json; until the repack finishes, no current download/signature/device pass is claimed. Use scripts/verify-studio-apk.ps1 on the completed candidate; it requires the new View on room/Shadow offset/Occlusion markers. Automated root checks143 tests/23 suites and Android Hermes export PASS; actual camera/AR/install/share require hardware.

## Prior studio native base - finished, superseded by screenshot-flow source

Full managed preview build15a939d0-80a0-49ac-bb1a-37f3f9fadc86 includes the native-safe unsaved-change reload guard. Previous queued build03caa09a-cf50-4129-8f43-e5eabd238d9c was canceled after a real iPhone Expo Go report exposed a DOM event call on native window; it must not be delivered. The earlier compact-layout candidateca4d0221-ae30-4402-b856-0990a9ef6599 was also canceled.

[Corrected build status](https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/builds/15a939d0-80a0-49ac-bb1a-37f3f9fadc86)

Actual latest state is in evidence/placed-build-status.json. No new APK download/signature/device pass is claimed until a completed artifact is available. Verification after download: `./scripts/verify-studio-apk.ps1 -Apk artifacts/artspace-placed-studio.apk`. Native dependencies/configuration remain unchanged by this JavaScript repair; the previous historical e0d09 fingerprint is still incompatible with studio dependencies.

Root TS/lint/131 tests in20 suites/Doctor/dependency checks, companion TS and new iOS bundle with native-safe hook PASS; Android Hermes export PASS. Expo Go can Reload the fixed source now. Physical phone retest remains open. Source snapshot:119 files,18d3383d777010ce58d283c5731812171f58aa82ed505d50554b2742a4bbf437.

## Previous APK - Android wall placement repair (2026-10-27)

- [Download the new signed APK](https://expo.dev/artifacts/eas/vWg7AJbObaYP2Dtx19mqo7Khe-0Lpjrea58QjyYEa2M.apk).
- Local copy: `artifacts/artspace-ar-wall-fix.apk` (139558827 bytes).
- EAS build `1746908e-f999-4617-89f5-89b77883fffa`: FINISHED. Workflow `01a17d47-70f9-7991-bb07-3fb40af1412b` packages current JS/assets against the verified matching native fingerprint `e0d09ec1f2708dfd8bbc1762c96210b706e24ca7`.
- Fixes native wall-plane alignment, instruction-overlay touch interception, texture success validation and transient AR startup checks. Includes the Gallery nested-button repair and personal imports. See AR_FLOW_REPAIR.md for findings and limits.
- SHA256: `9EB6B87A22A40065D2E2F0E87B1521BB9124A99A86621232F5A2C75A0FFD48AC`.
- apksigner verification: exit0, v2/v3 PASS; signing certificate matches the prior personal-import APK. Package/version remain `com.artspacear.mma301`/1.0.0/versionCode1. Install over the old app to preserve local data.
- Confirmed CAMERA, embedded JS repair markers, and ARM Viro/ARCore libraries. Evidence: ar-fix-apk-* and ar-fix-build-status.json. Snapshot91 runtime/config/asset files, no changes after upload: ar-fix-runtime-source-manifest.json.
- Root typecheck/lint,76 tests/14 suites, Doctor/dependency check, Android Hermes export/prebuild and manifest check PASS; companion typecheck PASS. User-reported physical placement failure still needs retesting with this APK. AR_DEVICE_UNVERIFIED, capture contents, installed Metro-off launch and live Firebase remain UNVERIFIED.

## Earlier personal artwork import APK (superseded)

- [Download the current signed APK](https://expo.dev/artifacts/eas/c-90TAKW9ulmVqhm0g6DfhYJNijQbOgcAHghf8pbPVU.apk).
- Local copy: `artifacts/artspace-ar-import-preview.apk` (139290276 bytes).
- Build `c1acfa9a-ec2d-4d72-bb83-614bc145d28b`: EAS status rechecked as FINISHED. All 85 recorded source/config/asset hashes match the current files.
- SHA256: `60AC80D97B4E3F0B95684AAFCEEE209CE699DB3E08C4B61594342F1B9811A75F`.
- Android apksigner verification rerun: PASS, v2 signature. Includes personal artwork import, embedded JS, Viro native libraries and CAMERA permission.
- Physical installation, Metro-off launch, AR/capture and live Firebase remain UNVERIFIED.

## Earlier MVP deliverable (superseded by the APK above)

- [Download the final signed preview APK](https://expo.dev/artifacts/eas/JKvA-rzDSrP5GXXCno6b2AzMlJcfwqJDA9BThIOBqcc.apk)
- Local copy: `artifacts/artspace-ar-preview.apk` (139341027 bytes, ignored by Git).
- SHA256: `4C24C8498222C7EC6D10FB6F77378F53148B4E62933D131D142A77649F334C97`.
- Package: `com.artspacear.mma301`, version 1.0.0, versionCode 1, minSdk24/targetSdk36.
- Android apksigner: v2 and v3 verification PASS (exit 0). Archive contains embedded JS bundle and ARM Viro/ARCore native libraries; metadata contains launch activity and correct app label. See final-apk-* evidence files.
- [Final EAS delivery build](https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/builds/68b6812f-5158-4bdc-ad19-33ec96c76b25).
- [Successful final packaging workflow](https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/workflows/01a17bc8-ce8a-752b-afe6-6626f34a7202).

**APK_BUILD_PASS; RELEASE_VERIFIED remains UNVERIFIED** because no phone was available for installation or Metro-off launch. AR_DEVICE_UNVERIFIED and CLOUD_UNVERIFIED remain separate gates. No acceptance/release tag created.

The APK deliberately uses the labeled bundled catalogue and local saves: no Firebase environment was configured on EAS. Sign-in offers an honest setup state. It contains the actual native AR implementation, not simulated camera placement. Physical tracking, orientation and camera+art screenshot contents remain unverified.

## Build provenance

Existing authenticated Expo account: nguyenphutoan1. Project: artspace-ar / 189b9e68-6e66-4aae-b46c-77d7ab9a588b. EAS created a real remote Android keystore; no signing key material was exported or committed and no billing configuration changed.

Full native builds ffeec95e-2929-4021-ae8f-7096b8f13d92 and 2a3fc186-e2b3-4481-98dd-6b19481cf7ef both FINISHED. The first artifact is retained locally as an earlier snapshot, not the final submission. The final native identity is `285d3654ee24b6a734d230cfc3694da5c80daf7f`.

After a clean install changed the first fingerprint, a full native rebuild was used. The last changes were JavaScript-only profile creation transactions and optimistic favorite rollback. Their fingerprint matches the final native build (evidence/repack-compatibility.json). EAS Workflows used @expo/repack-app 0.10.4 to embed the final bundle/assets and managed signing. The last workflow reused the matching prior repack build e8ee3625-321e-43d4-a6aa-a308ccbc3220, whose native base is 2a3fc186-e2b3-4481-98dd-6b19481cf7ef. No repack was used across a fingerprint mismatch. Runtime source/config/asset hashes are recorded in evidence/runtime-source-manifest.json; no runtime edits occurred after final workflow upload.

EAS metadata's Git commit is the scaffold baseline because the CLI uploaded the working tree including new source. Use the source manifest and final workflow/build IDs for this snapshot rather than interpreting the baseline commit as the full implementation.

Local universal and ARM64 Gradle attempts reached native compilation but exhausted this 8GB Windows host's RAM. They were intentionally terminated; no local native APK is claimed. Gradle downloaded 9.3.1 and installed NDK 27.1.12297006/CMake under existing SDK licences. See local-build-blocker.log and native attempt logs. Prefer EAS or a machine with more free RAM.

## Reproduce and install

```powershell
npm ci
node scripts/verify.mjs
# with JDK >=21 on PATH:
npm run test:rules
npx eas-cli@26.0.0 build --platform android --profile preview
```

Preview uses internal APK distribution and embeds JS. Development profile is a different artifact for Metro/dev client. Configure real Firebase env before rebuilding cloud mode, and enable Storage only after owner authorisation and actual cloud tests.

```powershell
adb install -r artifacts/artspace-ar-preview.apk
# Stop Metro, then launch ArtSpace AR from the Android launcher.
```

The final APK and earlier preview use the same managed signing identity/versionCode. EAS artifact links have retention limits; the local final copy is already saved. Keep a submission copy outside Git.

The manual `.eas/workflows/final-preview.yml` is only for reviewed JS-only changes. Recompute/compare native identity before using it after any config, dependency or native change. A mismatch requires a full build; do not blindly reuse its pinned native hash. No store submission or OTA update was performed.

## 3–5 minute demo script

1. 0:00–0:40: Explain choosing wall art. Browse twelve original pieces; search Terracotta, show empty results, filter Earth, open detail/dimensions.
2. 0:40–2:10: On verified Android hardware, scan a bright textured wall, tap, step sideways, resize, reset and change painting. Explain approximate scale, one painting and no persistent anchor.
3. 2:10–3:00: Capture, inspect camera+painting, retake once, save locally, open Saved, delete with confirmation. Explain local-only/current-account scope.
4. 3:00–4:00: With configured Firebase, sign in, toggle favorites, update profile and explain owner isolation. Otherwise show the setup state and explain the cloud verification blocker.
5. 4:00–5:00: Show five-module architecture, test evidence and open physical/cloud gates. Demonstrate standalone launch only after an actual Metro-off install test.

Record real app footage. Catalogue assets or generated mock images are not AR screenshots.

## Personal artwork native build — 2026-10-27

Feature source: IMPORT_ARTWORK.md. Added ImagePicker57.0.20 and ImageManipulator57.0.21; Expo Go companion uses SDK58-matched packages independently. Existing native fingerprint is incompatible with these additions, so a full preview build was submitted (no old-native repack):

- Build8d2837ba-3e43-43a3-9a4c-e1f44a6a2aa2, project artspace-ar, profile preview/internal Android APK.
- https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/builds/8d2837ba-3e43-43a3-9a4c-e1f44a6a2aa2
- Native fingerprint ce84c5c3531bc8649f5fef53aca2d2f750c687d3. Runtime snapshot: evidence/import-runtime-source-manifest.json.
- Actual build status: evidence/import-eas-status.json; submission log: evidence/import-eas-build.log. Status at initial observation IN_PROGRESS (RUN_GRADLEW). No successful artifact/install inferred from submission.
- Remote existing keystore reused; no billing or store submission changed. No EAS Firebase env configured, so catalogue/demo and imported images/local captures work without cloud setup.
- Earlier APK links are historical MVP snapshots and do not include import. Source includes the Expo Go and web repairs plus personal imports. All physical AR/picker/install gates remain UNVERIFIED.

The initial import build8d2837ba-3e43-43a3-9a4c-e1f44a6a2aa2 was CANCELED before delivery after generated manifest inspection caught cameraPermission:false removing the AR CAMERA declaration. The corrected plugin retains CAMERA for AR; prebuild and scripts/check-android-manifest.mjs PASS. Replacement full native build submission: evidence/import-eas-build-final.log. Historical initial build status/fingerprint/source snapshot above do not identify the corrected artifact; see the final follow-up entry below.

## Corrected personal-artwork preview

Replacement build: c1acfa9a-ec2d-4d72-bb83-614bc145d28b.
Build page: https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/builds/c1acfa9a-ec2d-4d72-bb83-614bc145d28b
Native fingerprint: e0d09ec1f2708dfd8bbc1762c96210b706e24ca7.
Corrected runtime source/config snapshot: evidence/import-runtime-source-manifest.json (85 files; SHA256 460375935bb68ee0346919ab1b029f47a096f11d45c8bb3bc28085bd4377b2e2). Initial canceled snapshot is retained separately as import-initial-runtime-source-manifest.json.
Actual final status is in evidence/import-final-build.json. The canceled submission must not be installed or used as acceptance evidence. No runtime source edits after the replacement upload; subsequent changes are documentation/check tooling only.

Latest verified state2026-10-27T16:22Z: candidate build cff492fd-643f-4e12-a916-71d90e48f809 IN_QUEUE, artifacts empty. [Candidate build status](https://expo.dev/accounts/nguyenphutoan1/projects/artspace-ar/builds/cff492fd-643f-4e12-a916-71d90e48f809). Do not install the earlier base expecting View on room. Patched SDK58 companion TS/Doctor20/20/dependency/iOS bundle graph checks PASS; root runtime snapshot remains unchanged.
