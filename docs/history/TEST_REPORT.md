# Verification report

Implementation date: 2026-10-27, Asia/Saigon. Sole implementation agent. No physical Android device connected; no Firebase project configured. No FULLY_ACCEPTED claim.

## Current native render error repair

Actual iPhone Expo Go failure exposed an unguarded browser event call on React Native window. Fixed with an explicit web-only hook and5 regression cases including native dirty transitions with undefined DOM methods. Final131 tests/20 suites, root TS/lint/Doctor/dependency check, companion TS, corrected iOS bundle and Android Hermes export PASS. See studio-native-guard-* evidence. User phone retest remains open; this repair does not establish hardware camera/AR acceptance. Older queued build03caa09a was canceled, corrected candidate15a939d0 submitted.

## Earlier photo-studio checks

Root strict TypeScript/lint PASS,126 tests/19 suites PASS, Doctor21/21 PASS and SDK dependency check PASS. Companion SDK58 typecheck, Doctor20/20 and dependency check PASS. CNG Android CAMERA/no-microphone manifest, final Hermes export and full iOS manifest/bundle/map/launch checks PASS. The iOS graph includes all four studio components and one SDK58 React/RN instance with no Viro. Evidence: placed-studio-verification.json, placed-final-verify.log, placed-ios-bundle-final.log, placed-android-export-final.log and placed-manifest.log.

Actual browser QA: local room creation, save/reopen, two independently selected artworks, wood/black frames, wall-corner perspective, manual foreground stroke/undo, dirty-exit prompt, exact-image duplicate review and PNG download. Also exercised9/9 grid with Add disabled and raster export, then discarded unsaved QA grid and kept the prior saved room. Mobile viewport390x844 checked; viewport reset afterward. Fresh-tab console errors0. Export PNGs and UI screenshots are ignored artifacts, not hardware AR evidence.

Hardware Android/iPhone camera, native share sheet, AR tracking/occlusion accuracy, Metro-off APK launch and cloud remain UNVERIFIED. Native iOS scan/OCR/automatic relighting/depth and other full-parity gaps are NOT_IMPLEMENTED; see PLACED_STUDIO.md. No full Placed or FULLY_ACCEPTED claim.

## Commands and evidence

| Actual command | Result | Evidence |
|---|---|---|
| npm view @reactvision/react-viro@3.0.3 peerDependencies | PASS: Expo >=57 <58 / RN >=0.86 <0.87 | Bootstrap terminal; pinned lockfile |
| npm install / npm ci | PASS: final clean install exit 0 | package-lock.json; evidence/npm-ci.log |
| npx tsc --noEmit / npm run typecheck | PASS | evidence/typecheck.log |
| npm run lint | PASS | evidence/lint.log |
| npm test -- --runInBand | PASS: 51 tests / 9 suites | evidence/unit-tests.log (latest supersedes count) |
| npx expo install --check | PASS | evidence/dependency-check.log |
| npx expo-doctor | PASS: 21/21 | evidence/doctor.log |
| npx expo prebuild --platform android --no-install | PASS | Native generated and manifest inspected; no APK claim |
| npx expo export --platform android --output-dir dist | PASS: Hermes Android bundle + all 12 artwork assets | evidence/android-export.log |
| npm run test:rules (JBR25 on PATH) | PASS: 7 groups, 0 failures | evidence/rules-tests.log |
| adb devices (installed SDK absolute path) | PASS command, empty list | No hardware test possible |
| Firebase firestore:databases:list without selected project | BLOCKED: HTTP403 projects/undefined | No cloud provisioning attempted |
| npm audit / npm audit fix | Initial 25; final clean-install audit 24 (14 moderate, 10 high), no force flags | evidence/npm-audit.json, npm-audit-fix.log |
| Local Gradle assembleRelease | BLOCKED_LOCAL_RESOURCES: intentionally stopped after RAM exhaustion | evidence/local-build-blocker.log, native attempt logs |
| EAS preview/native build + matching-native final repack | PASS: final signed APK delivered; v2/v3 signature check exit 0 | evidence/final-apk-build.json, final-apk-signature.log |

`node scripts/verify.mjs` records explicit per-command exit codes in verification.json and each log. CI configuration exists but no GitHub Actions run has been claimed. Tests use isolated fakes/mocks only within test files; they do not establish physical camera contents, native disk relaunch or live Firebase service behaviour.

## Acceptance matrix (spec test cases)

| Cases | Implemented coverage | Actual acceptance result |
|---|---|---|
| TC01–04 Auth register/login/persistence/logout | Real Firebase adapter, validation, provider and auth draft transition tests | Validation/draft tests PASS; live Auth/restart UNVERIFIED |
| TC05–08 Gallery/search/filter/detail | 12 bundled original assets, pure search tests, routes/export | Automated catalogue/filter/static PASS; physical UI UNVERIFIED |
| TC09–10 Camera denied/unsupported | Permission and native support gate, Settings/Retry/Back | Mock permission/support UI tests added; device UNVERIFIED |
| TC11–13 Vertical tap placement/tracking | Viro native vertical selector/anchor events | AR_DEVICE_UNVERIFIED |
| TC14 Scale | Shared clamp and cm→meters math | Unit PASS; physical dimensions UNVERIFIED |
| TC15–16 Reset/switch | Selector.reset and in-session image swap | Static/bundle PASS; device UNVERIFIED |
| TC17 Capture | Native screenshot + unknown-result/file/decoder validation | Failure/decoder unit PASS; camera+art contents UNVERIFIED |
| TC18 Ten sessions | Teardown route replacement and listener cleanup | Device/native stability UNVERIFIED |
| TC19 Guest login preserves draft | Root provider + login returnTo | React integration test PASS; live cloud flow UNVERIFIED |
| TC20 Cloud save | Upload/metadata/rollback adapters | Failure use-case + rules PASS; actual bucket/device UNVERIFIED |
| TC21–22 Local save/restart | Persistent document file copy and AsyncStorage metadata | Repository recreation PASS; actual device disk restart UNVERIFIED |
| TC23 Delete | File-first deletion, retained retryable metadata | Failure recovery tests PASS; physical file cleanup UNVERIFIED |
| TC24 Favorites | Per-UID idempotent Firebase transaction | Rules isolation PASS; real user flow UNVERIFIED |
| TC25–27 Security | Owner/schema/catalogue/MIME/size rules | Firebase Emulator PASS; deployed rules UNVERIFIED |
| TC28 Offline | Error states/retry/compensation | Mocked failure tests PASS; device disconnect UNVERIFIED |
| TC29 APK Metro off | EAS preview config and build attempt | Install/launch UNVERIFIED |
| TC30 Performance | No Firebase frame writes, local scene state, cleanup | Source inspection only; hardware performance UNVERIFIED |

MUST feature source FR01–18 is implemented, with physical/live-service acceptance still open as above. FR19 custom image import, FR20 optional frames and FR21 sharing are deferred until MUST device gates pass. Frame enum is part of the domain contract; UI currently uses none.

## Four gates

- CODE_READY: static/unit/rules/Android export checks PASS; native packaging result tracked separately. This is not a device acceptance declaration.
- AR_VERIFIED: UNVERIFIED — no supported physical device, placement/tracking/capture contents not tested.
- CLOUD_VERIFIED: UNVERIFIED — default local mode; no real Auth/Firestore/Storage project test. Rules emulator PASS is separate.
- RELEASE_VERIFIED: UNVERIFIED — no Metro-off device installation/launch evidence. Build artifact status alone cannot close this gate.

## Known limits

Physical wall upright orientation, native screenshot camera background and repeated-session stability need verification first. No generated mock image is used as evidence. Local committed metadata persistence is tested with repository recreation; actual phone storage/relaunch remains unverified. Unsaved draft is process-memory only; guest/account local scopes are separate. A process crash between file and metadata commits can leave an orphan; tested compensation/retry is not durable reconciliation. Cloud image download URLs are bearer URLs held in memory. Dependency advisories remain open before public distribution.


## Actual packaging follow-up

EAS preview build ffeec95e-2929-4021-ae8f-7096b8f13d92 FINISHED successfully. Downloaded APK: artifacts/artspace-ar-preview-build-1.apk (139067888 bytes), SHA256 54210837972E80AFF098770CAB1C86B48D9CAD5D69E81D64402CBC47C644746A. Android apksigner verifies v2 signature (exit 0). aapt2 reports com.artspacear.mma301, version 1.0.0/code1, minSdk24/target36, and launch activity. ZIP inspection confirms embedded bundle and ARM Viro/ARCore shared libraries. These are build/archive checks, not an installed app launch.

Local native attempts were stopped due severe 8GB host RAM exhaustion (4268KB free observed). Daemon-disappeared/-1 in the ARM64 log follows intentional process termination, not a diagnosed application compiler error. Under that contention a newly added permission test timed out; rerunning it after memory recovery passes both cases in 2.58s. Final clean-install full suite passes 48/48. No timeouts were hidden by increasing Jest limits.

Native fingerprint comparison differed for .gitignore, scripts and masked-view contents after clean installation, so repack was not used across the mismatch. A full current-source EAS preview rebuild was submitted as 2a3fc186-e2b3-4481-98dd-6b19481cf7ef. Its final outcome and artifact are recorded in RELEASE.md/status evidence. The first APK is an earlier snapshot; no claim that it includes later JS refinements.


## Final delivery result

Final native base 2a3fc186-e2b3-4481-98dd-6b19481cf7ef FINISHED. Final same-native packaging workflow 01a17bc8-ce8a-752b-afe6-6626f34a7202 SUCCESS; delivery build 68b6812f-5158-4bdc-ad19-33ec96c76b25 FINISHED. The final APK is artifacts/artspace-ar-preview.apk, 139341027 bytes; SHA256 4C24C8498222C7EC6D10FB6F77378F53148B4E62933D131D142A77649F334C97. v2/v3 signing PASS, package/launch metadata inspected and embedded bundle/native AR libraries confirmed. See RELEASE.md for download/provenance. APK_BUILD_PASS does not imply Metro-off launch or physical AR acceptance.

Final source includes idempotent concurrent profile creation and optimistic favorite toggle/removal with rollback. Strict typecheck, lint without warnings, 48 Jest tests in 8 suites, seven real Emulator test groups, doctor 21/21 and dependency check PASS. The concurrency test uses real Firestore emulator transactions under immutable profile timestamp rules. Render tests prove optimistic rollback in both toggle directions and list removal. Secret-pattern and Git-ignore checks PASS within their documented scope. Runtime source manifest records 78 source/config/asset file hashes.

CODE_READY: PASS. AR_VERIFIED: UNVERIFIED. CLOUD_VERIFIED: UNVERIFIED (local-only/default demo configuration). RELEASE_VERIFIED: UNVERIFIED (APK built/signed, no device installation). FULLY_ACCEPTED: not achieved. Remaining operator actions are in NEEDS_USER_ACTION.md.

## HMR import resolution repair

A later workspace change had installed Expo58.0.19 against RN0.86.3 and SDK57 Router/modules, causing expo/build/async-require/hmrUtils.native.js to import the unavailable RN unstable-internals entry. Restored exactly pinned Expo57.0.31 and updated package-lock.json; no private-module alias or dependency-file patch.

Actual new verification: npm install exit0, strict typecheck PASS, ESLint PASS, 48 Jest tests PASS, Expo Doctor21/21 PASS, expo install --check PASS. Live Metro requests with dev=true and hot=true returned HTTP200 for iOS and Android; bundle sizes recorded in evidence/hmr-dev-bundles.json. This specifically checks the development/HMR resolution path, not only a production export. The project Metro instance was restarted with clean cache and returned to watch mode on8081 (evidence/hmr-metro-restart.json).

Device/native gates are unchanged. Previous dev logs show iOS Expo Go SDK58 rejecting SDK57; this application needs a native development build/Android APK. No iOS AR runtime, new APK build or physical device test was claimed for this dependency repair.

## iPhone Expo Go companion — 2026-10-27

- Companion clean install, strict TypeScript and Expo Doctor20/20: PASS. Logs: evidence/expo-go-ci.log, expo-go-typecheck.log, expo-go-doctor.log.
- iOS SDK58 manifest, development bundle/source map and manifest launch URL: PASS. The graph has one SDK58 React/RN instance and zero Viro/native AR sources. All12 artwork image requests return HTTP200. See evidence/expo-go-bundle-check.json; reproduce with node scripts/check-expo-go.mjs while Metro8082 runs.
- Three capability-message tests added; all51 tests/9 suites PASS. Root verification.json records the latest actual checks.
- Physical iPhone startup, layout, gestures and account/cloud flows: UNVERIFIED. No native iOS AR claim. Expo Go intentionally cannot scan walls/place/capture AR.
- Companion npm ci reports 7 high advisories. Root/companion dependency isolation and compatible SDK pins retained; no forced audit fix.

## Browser smoke check — 2026-10-27

localhost:8081 initially returned HTTP500 for the web JS bundle (missing @reactvision/viro-web-renderer). Platform-specific ARScreen.web.tsx now excludes Viro from the web graph. Same bundle HTTP200 after repair. Actual browser checks PASS: catalogue12 items, search Terracotta returns1 item, detail route, explicit native-AR availability screen and Browse return. No browser console errors observed. Screenshot artifacts/web-gallery-fixed.png is actual runtime evidence. Authenticated Firebase and physical devices were not tested.

## Custom artwork verification — 2026-10-27

Root verification.json now records all67 Jest tests/11 suites, strict TS, lint, Expo Doctor21/21 and dependency check PASS. Companion typecheck/Doctor20/20 PASS. Android prebuild and Hermes export PASS (evidence/import-android-prebuild.log, import-android-export.log). iOS SDK58 full development/source-map/launch checks PASS (expo-go-bundle-check.json), including no Viro and one React/RN plus12 bundled images. An earlier request was interrupted while restarting stale Metro; import-expo-go-bundle-retry.log supersedes it.

Actual browser file chooser used assets/artworks/art-04.png, entered Imported Indigo/80cm, saved80×120cm, reloaded the detail URL to verify persistent data URI, opened management, canceled removal and confirmed deletion. No console errors. Screenshot evidence in artifacts/imported-artwork-web.png and import-artwork-management.png. The test-created record was removed afterward.

Automated cases cover import validation, durable metadata and aspect ratio, concurrency/limit, storage rollback, removal failure/retry, corrupt metadata, remote-offline personal access, picker cancel/error and save navigation; custom capture persistence uses local storage exclusively even under cloud wiring. Native hardware/photo permission/HEIC/rotation and custom AR texture/capture remain UNVERIFIED. New native build status is recorded separately in RELEASE.md/evidence/import-eas-status.json.

Native configuration regression: inspected actual CNG Android manifest and caught the image-picker option removing CAMERA. Canceled the initial cloud build, corrected the plugin camera permission string for AR, regenerated the manifest and confirmed CAMERA declared (not tools:node=remove). scripts/check-android-manifest.mjs PASS; added prebuild + check to CI. Microphone remains blocked. Replacement build status is separate from automated/device acceptance. See import-camera-manifest.log and RELEASE.md.

## Android wall-placement repair — 2026-10-27

Final root checks: strict TS/ESLint PASS;76 tests/14 suites PASS; Expo Doctor and SDK dependency check PASS. Evidence: ar-fix-verification.json and the current typecheck/lint/unit-tests/doctor/dependency-check logs. Companion strict typecheck PASS. Android Hermes production export, CNG prebuild and generated CAMERA permission check PASS (ar-fix-export.log, ar-fix-prebuild.log, ar-fix-manifest-check.log).

New tests use the installed Viro3.0.3 selector's real implementation, mock native rendering only, and cover native Vertical alignment, wall discovery/tap conversion, anchor updates, reset, floor rejection, removal and texture completion success/failure; availability tests cover transient retries and bounded failures. Source-level fault and limitations: AR_FLOW_REPAIR.md. User-reported Android camera-without-placement failure is recorded in AR_TEST_REPORT.md. No physical-device fix acceptance claimed.

## Core video-driven preview UI — 2026-10-27

Root strict TS, lint,94 tests/16 suites, Doctor and SDK dependency compatibility PASS; companion TS/Doctor20/20 PASS. Final evidence is core-ui-verification.json and core-ui-ios-bundle-final.log; native CNG/CAMERA validation and Hermes export logs use core-ui-android-* names. New tests cover the injected camera's room-photo callback/retake/failure and background/placement/scale continuity through image selection and inline import. These are automated boundary simulations, not physical camera acceptance.

Browser QA uses a real public-project PNG import, confirms80×120cm and persistence after reload, inspects dark390×844 responsive UI and own-artwork2D route, console errors0 and nested buttons0. Screenshot core-dark-gallery.png is real UI, not an AR/camera capture. Room/artwork camera capture and native lifecycle remain UNVERIFIED. CORE_PREVIEW.md documents exact scope and limitations.
