# Phase checkpoints — 2026-10-27

This log records implementation and actual integrated checks. Static checks were rerun as the app was connected, rather than claiming independent phase-by-phase device sign-offs. No hardware gate is closed by a unit test.

## PHASE 00 — Bootstrap
- Status: PASS (static/tooling); native build tracked under Phase 11.
- Files: root configs, lockfile, AGENTS.md, environment sample, original spec.
- Actual checks: npm install PASS after explicitly resolving React DOM/renderer/worklets peer conflicts; no force/legacy flags. expo install --check PASS; expo-doctor 21/21 PASS; typecheck PASS; lint PASS at integrated checkpoint.
- First scaffold safely refused the preserved spec; scaffold moved from temporary directory. Source was not overwritten.
- Runtime Node 22.22.2, npm 10.9.7. Android SDK discovered outside PATH; adb devices returned an empty list.
- Next: native AR spike; keep physical gate open.

## PHASE 01 — Native AR spike
- Status: PARTIAL / AR_DEVICE_UNVERIFIED.
- Files: src/features/ar/ARScene.tsx, ARViewer.tsx, arTypes.ts, arCapture.ts, app.config.ts; AR_TEST_PLAN/REPORT.
- Actual checks: installed Viro 3.0.3 TS/source inspected; required ref forwarding, Vertical selector, native screenshot accessor confirmed. expo prebuild Android PASS; Android Hermes export PASS; TypeScript PASS.
- Local native assembleRelease attempted; see Phase 11. No phone connected; vertical detection/orientation/tracking/camera contents UNVERIFIED.
- Decision: continue independent contract/data/UI work while physical spike remains open.

## PHASE 02 — Contracts and catalogue
- Status: PASS automated; contracts v1 frozen.
- Files: src/domain/models.ts, repositories/index.ts, validators.ts, data/mock/catalogue.ts, 12 assets/artworks PNGs, generation script/license; tests/domain.
- Actual checks: Jest domain cases PASS (scale/cm conversion, finite bounds, IDs, credentials, published search/filter, malformed mappers); typecheck/lint PASS integrated.
- Three categories, twelve original CC0 images, no third-party artwork scraping. Contracts consolidated into index/model files (ADR).
- Device/cloud: UNVERIFIED; not required for pure contract checks. Next: data adapters.

## PHASE 03 — Firebase/local data and rules
- Status: PARTIAL; implementation and emulator tests PASS, live cloud UNVERIFIED.
- Files: src/data/**, src/infra/firebase/**, firebase/**, firebase.json, scripts/seed-artworks.mjs.
- Actual checks: six Firebase Emulator rule groups PASS; data lifecycle tests PASS; tsc/lint PASS. Required JDK>=21 supplied via Android Studio JBR 25 on PATH. Port 8080 occupied; changed only this project's ports to 8188/9299. No unrelated process stopped.
- Firestore database list without a selected project returned HTTP403 projects/undefined. No cloud provisioning/seed/deploy/billing performed.
- Decision: retain labeled demo catalogue and real unavailable-auth state until configuration; local-only saves default.

## PHASE 04 — UI/navigation
- Status: PARTIAL; source/static/render smoke PASS, device visual walkthrough UNVERIFIED.
- Files: app/**, src/ui/theme.ts, components.tsx, screens/**.
- Actual checks: accessible auth form render and validation test PASS; Android bundle export PASS, tsc/lint PASS. Routes include four tabs, detail, AR, auth, capture and design/not-found.
- Implemented search/category/featured/empty/error/retry, dimensions CTA, safe areas, keyboard layout, 48dp controls, image fallback, confirmation dialog.
- No runtime UI screenshots claimed. Next: AR production interactions.

## PHASE 05 — AR interactions
- Status: PARTIAL / AR_DEVICE_UNVERIFIED.
- Files: ARViewer/ARScene, arAssetResolver/arCapture, ARScreen.
- Actual checks: pure math/clamp tests and Android bundle PASS; native input APIs checked against installed types.
- Cached image resolution outside scene, native wall selection, 8mm offset, proportional scale 0.5–2, reset, session-preserving change-art modal, texture-aware capture gating, scan help and permission/support recovery implemented.
- Physical placement/capture/tracking/ten-session stability: UNVERIFIED. No 2D overlay substituted.
- Decision: proceed business/integration work; do not mark AR accepted.

## PHASE 06 — Workflows
- Status: PARTIAL; automated workflows PASS; configured device/cloud flows UNVERIFIED.
- Files: features/auth/authUseCases.ts, features/designs/designUseCases.ts, shared useResource, UI screens and provider.
- Actual checks: auth validation prevents repository call; unavailable backend returns setup-required; persistent metadata recreation/account separation/save rollback/delete retry tests PASS.
- Register/login/profile/favorites use real Firebase implementations when configured; no fake account success. Draft preserved across login navigation, UID-local saves, image/metadata cleanup and replay protection implemented.
- Next: wiring and integrated routes.

## PHASE 07 — Integration
- Status: PARTIAL; static/bundle PASS, phone end-to-end UNVERIFIED.
- Files: src/bootstrap/**, src/config/**, route adapters, ARScreen/capture screens.
- Actual checks: expo-doctor 21/21 PASS, Android Hermes export PASS, TypeScript and Jest provider smoke PASS.
- Central repository factory binds local/cloud/demo modes; native route replacement releases scene before preview; auth observer unsubscribes; resource responses invalidated on blur/account switch.
- No real-device launch claimed. Next: capture/storage reliability.

## PHASE 08 — Capture/storage reliability
- Status: PARTIAL; failure logic tests PASS, screenshot contents and actual disk restart UNVERIFIED.
- Files: arCapture, local/cloud CaptureStorage and SavedDesign repositories, DesignUseCases, tests/data/designs.test.ts.
- Actual checks: duplicate save, metadata rollback, rollback failure instruction, image deletion failure, metadata deletion retry, corrupt local metadata, repository recreation tests PASS.
- Native result/file-size/decodability checks implemented. Persistent app-document copies implemented; no gallery permission requested. Cloud image missing after partial delete remains recoverable metadata.
- Limitations: unsaved draft lost on process death, orphan cleanup after process death not durable. See SECURITY.md. Next: full checks.

## PHASE 09 — Automated QA
- Status: PASS available static/unit/rules/export checks; dependency security review remains open.
- Actual initial suite: 31/31 Jest tests, 4 suites PASS; 6/6 Emulator groups PASS; TypeScript PASS; ESLint PASS; doctor 21/21 PASS; Android export PASS. Latest rerun logs in evidence/ supersede initial counts where expanded.
- Initial failures corrected: peer version selection, obsolete splash config, duplicated expo-font, missing RN persistence type signature, ref/state lint violations, Jest native AsyncStorage mock and Firebase test resolver, emulator Java version and occupied port.
- npm audit: 25 advisories; safe npm audit fix attempted, unchanged. No forced stack downgrade. No TODO/any placeholders found in application source scan (substring only matched too-many-requests).
- npm ci reproducibility/final checks recorded in TEST_REPORT when complete.
- Next: document physical QA blocker and release attempt.

## PHASE 10 — Hardware/performance
- Status: UNVERIFIED_PHYSICAL_DEVICE / AR_DEVICE_UNVERIFIED.
- Files: AR_TEST_PLAN.md, AR_TEST_REPORT.md.
- Actual adb devices PASS command, empty device list. No model/OS/ARCore/camera image/video/performance evidence available.
- All physical test scenarios left open. Decision: continue release configuration/documentation only; no AR acceptance.

## PHASE 11 — Release/docs
- Status: PARTIAL; release gate UNVERIFIED pending actual APK/install result.
- Files: eas.json, app.config.ts, README, SETUP/ARCHITECTURE/DATABASE/SECURITY/RELEASE/TEST_REPORT, evidence logs.
- Actual: Android prebuild and Hermes production export PASS; local assembleRelease attempted using JDK17 and installed SDK, build details in evidence/android-release-build.log. EAS account check recorded separately.
- Preview profile selects APK. No Metro-off installed launch has occurred. No release tag or FULLY_ACCEPTED claim.
- Next: finish handover while external gates remain open.

## PHASE 12 — Handover
- Status: PASS documentation/source mapping; acceptance gates remain open.
- Files: FIVE_MEMBER_HANDOVER.md, NEXT_STEPS.md, README references, architecture/data diagrams.
- Five logical packages include paths/public APIs/walkthrough/tests/issues/recommendations/demo notes. All initial implementation done by one agent.
- Actual docs/source link review and final static checks recorded in TEST_REPORT.
- Overall: no FULLY_ACCEPTED without physical AR, real cloud and independent APK evidence.

## Release follow-up (actual state, supersedes initial environment assumptions)
- Expo account was already authenticated. Created ArtSpace AR EAS project and remote Android keystore, initialized versionCode 1, uploaded preview build ffeec95e-2929-4021-ae8f-7096b8f13d92. See sanitized build status and release log. No paid-service/billing configuration changed.
- Local all-ABI build intentionally interrupted for final config regeneration and ARM64-only build with explicit memory settings. First attempt log preserved; no successful APK inferred from it.
- Final mapper rejects malformed numeric/enum fields rather than coercing them. Added native/read timeouts, current-account profile form isolation, small-screen grid sizing, original branding, formatter run and a command/exit-code verification runner. Latest test/check logs supersede earlier counts.
- All source code remains authored in this chat by one agent. Hardware, live cloud and Metro-off installed acceptance gates remain open.

## Clean verification and build evidence
- npm ci: PASS, exit 0, 1692 packages installed. Final audit 24 advisories (14 moderate, 10 high); initial audit count 25 retained as history.
- Final static verification: typecheck/lint/doctor/dependency check PASS; 45 Jest tests / 7 suites PASS; 6 Firebase Emulator groups PASS; see evidence/verification.json and logs.
- Local RAM exhausted (8GB host, 4268KB free observed); stopped this task's Gradle/Kotlin/C++ process tree. ARM64 attempt ended -1 after intentional termination; no local APK. Permission test timeout under contention resolved after memory recovery; no test timeout limits raised.
- EAS first preview FINISHED: downloaded signed APK, apksigner v2 PASS, aapt metadata and embedded native AR libraries/bundle inspected. Physical launch remains UNVERIFIED.
- Fingerprint differed after clean install, so no unsafe repack. Submitted full final-source preview build 2a3fc186-e2b3-4481-98dd-6b19481cf7ef. No further runtime source edits after its upload.

## Final business-flow closure
- Fixed concurrent profile creation with an idempotent Firestore transaction; emulator now has 7 passing groups including simultaneous profile repair.
- Added optimistic favorite toggling/removal with rollback and UID form isolation. Three added integration tests; total 48 passing Jest tests across 8 suites. Test formatter-induced lint comments corrected rather than suppressing warnings.
- Full native rebuild base fingerprint matches current final JavaScript source. First matching-native repack workflow succeeded; a final same-native workflow packages the optimistic favorite changes. No extra native compilation or local credential export is needed.
- Latest verification.json, rules-tests.log and final workflow/artifact evidence supersede earlier counts/snapshots. Physical AR/capture contents, live Firebase, and Metro-off installed release remain UNVERIFIED.

## Final outcome — 2026-10-27
- CODE_READY: PASS (strict TS, clean ESLint, 48 Jest tests/8 suites, 7 Emulator groups, doctor 21/21, dependency check, signed native preview pipeline).
- APK_BUILD_PASS: final build 68b6812f-5158-4bdc-ad19-33ec96c76b25 FINISHED; final workflow 01a17bc8-ce8a-752b-afe6-6626f34a7202 SUCCESS. Saved artifacts/artspace-ar-preview.apk, verified v2/v3 signatures (exit0), launch metadata, embedded JS and AR native libraries. SHA256 4C24C8498222C7EC6D10FB6F77378F53148B4E62933D131D142A77649F334C97.
- Final app source includes optimistic favorites with rollback and concurrent auth profile creation repair. No runtime changes after final packaging upload; 78-file runtime source/config/asset manifest saved.
- AR_VERIFIED: UNVERIFIED / AR_DEVICE_UNVERIFIED. CLOUD_VERIFIED: UNVERIFIED. RELEASE_VERIFIED: UNVERIFIED because no actual phone install/launch with Metro off. No FULLY_ACCEPTED claim.
- FR01–18 source implemented; FR19–21 deferred until MUST physical gates pass. Firebase/Storage credentials/project verification, device recording and course demo remain external actions. Local-only photo mode is explicit.
- Local native build was blocked by RAM, not passed. Final clean audit has 24 advisories; review before broad release. No billing, store submission, fake credential or five-person development split occurred.
- Final setup, source mapping, architecture/use-case diagrams, database/security/release docs and demo plan delivered. Consult RELEASE/TEST_REPORT/NEEDS_USER_ACTION for concise current state; prior phase entries retain actual history.

## Fix — SDK mismatch causing missing React Native HMR internals
- Observed: package.json and installed/locked Expo were 58.0.19, while React Native remained 0.86.3 and Router/Expo modules were SDK57. Expo58's installed bundledNativeModules expects RN0.88.0; Viro3.0.3 declares Expo>=57<58 and RN>=0.86<0.87.
- Restored Expo57.0.31 with an exact package.json pin and regenerated package-lock.json using npm install --save-exact expo@57.0.31, without force/legacy flags. This restores the documented native stack; no alias or node_modules patch hides missing internals.
- Restarted this project's stale Metro process on port8081 with a cleared cache. Dev/HMR requests (dev=true, hot=true) returned HTTP200 for iOS (9631752 bytes) and Android (10343147 bytes). See evidence/hmr-dev-bundles.json.
- Verification: strict TypeScript PASS, clean ESLint PASS, all48 Jest tests PASS, Expo Doctor21/21 PASS, expo install --check PASS. Dependency installation exit0; see hmr-dependency-fix.log.
- Existing dev logs also show an iOS Expo Go SDK58 versus project SDK57 mismatch. This is separate from bundling: the AR app needs a native development build/Android APK, not Expo Go. iOS bundle success is not native iOS AR/device verification.
- Metro is returned to normal watch mode after the CI-mode bundle check. Physical/cloud gates remain unverified; no APK rebuild or external deployment performed for this fix.
# iPhone Expo Go follow-up — 2026-10-27

- Added apps/iphone-expo-go, an isolated Expo58.0.19/RN0.88/React19.3 companion with shared screens and repositories. Native SDK57/Viro remains intact. AR routes explicitly explain unavailable native capabilities.
- Clean companion npm ci PASS; doctor20/20 PASS; strict companion typecheck PASS. npm reports 7 high advisories in that package; no force upgrade applied.
- Added three integration cases for Expo Go capability messaging. All51 Jest tests/9 suites PASS. Generated Metro bundles are now ignored by ESLint; actual source remains linted.
- Manifest SDK58/preview flag and full iOS development bundle/source map PASS. One companion React and RN instance, zero Viro/native AR sources, all12 artwork images HTTP200, actual manifest launch bundle HTTP200. See evidence/expo-go-bundle-check.json and scripts/check-expo-go.mjs.
- Corrected initial companion install's accidental root file dependency and a type-alias experiment before final clean install/verification. No runtime patch to dependencies retained.
- Setup and CI checks added. Local Expo Go server uses port8082; QR available for the current LAN session. Physical iPhone execution and live Firebase remain UNVERIFIED. Native APK and AR acceptance claims are unchanged.


## Web blank-page repair — 2026-10-27

- Reproduced localhost:8081 empty root. Actual development bundle returned HTTP500 UnableToResolveError for @reactvision/viro-web-renderer, imported through ViroAnimatedImage.web.js. This was a bundle failure before UI mount.
- Added platform-resolved ARScreen.web.tsx to exclude the native Viro graph. Shared ARUnavailableScreen is used by web and the iPhone companion; native ARScreen.tsx remains unchanged. Web detail CTA identifies capability availability. Added npm run web; npm start remains the native development-client command and npm run start:iphone remains Expo Go.
- After repair the same web bundle returns HTTP200 (~6.18MB). Browser runtime renders all12 catalogue items. Manually verified search Terracotta -> one item, artwork detail, AR availability route, and return to Gallery. Browser console contained no error entries. Actual screenshot: artifacts/web-gallery-fixed.png.
- Root TypeScript/lint and51 tests PASS. Companion typecheck and SDK58 iOS bundle/12assets/isolation check PASS. Physical AR/iPhone and configured Firebase remain unverified.

## Personal artwork import — 2026-10-27

- User explicitly requested FR19/custom artwork, superseding the original stretch-goal deferral. Added the system image picker, JPEG normalization, durable local import repository and combined catalogue/category/detail routing across native SDK57 and Expo Go SDK58/web.
- Width in cm derives height from source proportions. Limits:10 imports,2048px longest side,1MB prepared image,30MB/40MP selected input. Native copies to app documents; web persists bounded inline JPEG in browser storage. Imports are installation-local, not published/uploaded/favorited in Firestore.
- Native AR asset resolver already supports persistent file URIs. Custom source identity travels with the active AR input and captured draft; custom captures use local storage/repositories even in cloud mode. Current guest/account local captures remain readable through combined Saved routes. No Firebase rule expansion or cloud custom upload.
- Added16 tests:67 tests/11 suites PASS; strict TS, clean lint, Doctor21/21, dependency check PASS. Companion strict TS and Doctor20/20 PASS. Android prebuild and Hermes export PASS; SDK58 iOS development/launch bundles and12 catalogue asset requests PASS with no Viro/duplicate React. Initial stale-server iOS request was interrupted by restart; fresh-server retry passed.
- Actual browser smoke PASS: pick PNG file, decode/JPEG normalize, title+80cm width=>120cm height, save detail, reload persistence, manage, cancel remove, confirm remove. No console errors observed. Only the test import created in this session was removed. Screenshots: artifacts/imported-artwork-web.png, import-artwork-management.png.
- Full new native preview build submitted as8d2837ba-3e43-43a3-9a4c-e1f44a6a2aa2; cannot reuse the older native fingerprint after adding ImagePicker/Manipulator. See evidence/import-eas-build.log and import-eas-status.json for actual status. No runtime source changes after upload.
- Physical Android/iPhone picker, permission handling, photo rotation/HEIC, custom Viro texture/placement/capture and Metro-off install remain UNVERIFIED. Existing APK predates this feature. No paid-service configuration changed.
- Native install audit23 advisories(14 moderate/9 high); companion7 high. No force flags. See IMPORT_ARTWORK.md for usage/limits and native rebuild requirements.

## Camera permission regression caught before delivery

The first import build8d2837ba-3e43-43a3-9a4c-e1f44a6a2aa2 was intentionally CANCELED: generated manifest inspection found ImagePicker cameraPermission:false removes CAMERA even when AR requests it. Replaced that option with the AR camera permission explanation; regenerated Android manifest now explicitly declares CAMERA and keeps microphone permission removed. Added scripts/check-android-manifest.mjs and CI prebuild/check to catch recurrence. Actual check PASS in evidence/import-camera-manifest.log. All67 tests and root TS/lint/Doctor/dependency check pass after the correction. A full replacement preview submission is recorded in evidence/import-eas-build-final.log; the canceled build is not a valid APK delivery. No AR/picker hardware pass is inferred.

- Corrected full build c1acfa9a-ec2d-4d72-bb83-614bc145d28b is the replacement import preview; fingerprint e0d09ec1f2708dfd8bbc1762c96210b706e24ca7. The initial build was canceled after generated-manifest inspection caught a camera-removal configuration interaction. The replacement retains CAMERA, and a generated-manifest regression check now runs in CI. See evidence/import-final-build.json and import-runtime-source-manifest.json for final status/provenance. Hardware gates remain open.

## APK delivery verification — 2026-10-27

- User requested APK. Existing corrected personal-artwork build status rechecked with EAS CLI26.0.0: FINISHED. Reused this completed build because all85 source/config/asset snapshot hashes match current files; no runtime edits or redundant cloud build.
- Local APK: artifacts/artspace-ar-import-preview.apk,139290276 bytes. Android apksigner verify --verbose: exit0, v2 signature PASS. SHA256:60AC80D97B4E3F0B95684AAFCEEE209CE699DB3E08C4B61594342F1B9811A75F. Existing archive inspection records embedded JS, import modules, Viro libraries and CAMERA permission.
- node scripts/verify.mjs rerun: exit0; strict typecheck, lint,67 tests/11 suites, Expo Doctor and Expo dependency compatibility all PASS. Actual logs and verification.json refreshed in docs/evidence.
- RELEASE.md now leads with the current APK link and identifies the earlier MVP artifact as historical. Physical install/Metro-off launch, native picker, AR/capture and live cloud remain UNVERIFIED.

## Standalone iPhone request — 2026-10-27

- User requested a downloadable iPhone app and confirmed no Apple Developer membership. Reviewed native/companion config, release/setup docs and official Expo distribution requirements.
- BLOCKED: standalone EAS iPhone signing/distribution requires Apple Developer membership and signing/provisioning. No IPA build, Apple account purchase or public deployment performed. iOS native/AR behavior remains UNVERIFIED.
- Recorded external requirements and existing limited Expo Go alternative in NEEDS_USER_ACTION.md. No runtime/config changes; checks from the preceding APK verification remain historical, no new tests claimed for this documentation-only update.

## Gallery nested-button repair — 2026-10-27

- User supplied React web warning: button cannot contain nested button, with GalleryScreen in ancestor stack. Traced it to ArtImage's failed-image Reload image button rendered inside the gallery card Pressable.
- Gallery cards now use a noninteractive View with separate image and metadata navigation controls. ArtImage optionally wraps only the successfully loaded image in a navigation Pressable; its error/retry branch has no enclosing navigation button. Existing non-gallery images retain their behavior.
- Added gallery-image-retry integration regression: successful image navigation, simulated image-load failure, no nested button-role host ancestors, retry without navigation, and metadata navigation. Initial test harness attempts failed because the Expo Image event needed nativeEvent and Pressable is not directly exposed by the test renderer; corrected the test event and asserted rendered button-role hosts. Focused regression PASS.
- Browser smoke on localhost:8081: gallery renders, DOM button button count0, clicking Terracotta image opens /artwork/art-01, console error entries empty. Image-error/retry branch verified by integration test; not claimed as browser network fault injection.
- Companion npm run check:iphone PASS. Full root checks recorded in docs/evidence/verification.json after rerun. No APK rebuild or physical AR/iPhone/cloud acceptance performed; the previously delivered APK predates this source repair.

## Android AR placement repair — 2026-10-27

- User reported Android camera opens but placement fails (USER_REPORTED_FAIL; model/build/logs not supplied). Actual local adb device list empty; no physical reproduction/pass claimed.
- Audited pinned Viro3.0.3 source and installed AAR: selector omits Vertical on its native plane, whose Android default is Horizontal. Added WallPlaneSelector compatibility override to supply native Vertical while retaining actual selector hit conversion/selection/reset; no dependency or node_modules patch.
- Fixed instruction-overlay touch interception, image-load completion success validation, bounded TRANSIENT/UNKNOWN AR support retries and artwork-preparation timeout. Gallery nested-button repair is included in the current source.
- Actual root verify PASS: strict TS, lint,76 tests/14 suites, Doctor, dependency check. Companion typecheck PASS. Production Android Hermes export PASS; prebuild and CAMERA manifest check PASS. Test harness corrections documented in AR_FLOW_REPAIR.md.
- Native fingerprint e0d09ec1f2708dfd8bbc1762c96210b706e24ca7 matches corrected personal-import build c1acfa9a-ec2d-4d72-bb83-614bc145d28b. Submitted EAS repack workflow01a17d47-70f9-7991-bb07-3fb40af1412b with embedded JS/assets and managed signing. Source snapshot91 files,c12c27d40558060b34c8a100b6b309b4051916e349764ca21b3acc6705117590. Final artifact result recorded below when available. Physical placement/capture/install and cloud gates remain UNVERIFIED.

### AR repair APK delivery

- New EAS build1746908e-f999-4617-89f5-89b77883fffa FINISHED. Saved artifacts/artspace-ar-wall-fix.apk,139558827 bytes; SHA2569EB6B87A22A40065D2E2F0E87B1521BB9124A99A86621232F5A2C75A0FFD48AC.
- apksigner exit0, v2/v3 PASS; certificate matches previous import APK, allowing install-over with the same package/versionCode. aapt confirms CAMERA and correct launch/package metadata. Embedded JS includes new AR support and Gallery repair markers; ARM32/64 Viro renderer/ARCore libraries present.
- RELEASE.md leads with the new link; prior APKs retained as historical artifacts. No runtime source differences after uploaded91-file snapshot. Device placement/capture and Metro-off installation still require actual retest; no physical PASS inferred from automated/build results.

## Expo Go 2D Preview — 2026-10-27

- User authorized 2D Preview after confirming native AR cannot run inside Expo Go. Implemented companion-only SDK58 expo-camera boundary and /preview-2d/[id] route, with shared camera-injected UI and pure screen-coordinate geometry. Root native SDK57 dependencies and AR imports are unchanged.
- Catalogue/personal-art details now offer a 2D Preview button in Expo Go; AR availability page links there as well. Explicit camera permission/settings, native mount/start errors/retry, image retry, 50–200% proportional resize, bounded dragging/reset, and unmount on inactive/background are implemented. No wall measurement, tracking, composite save or AR capture claim.
- Actual checks PASS: root TS/lint/91 tests/16 suites/Doctor/dependency check; companion TS/Doctor20/20/dependency check. iOS manifest, full development/source map and launch bundle PASS;7 camera sources and both new screen sources, one SDK58 React/RN and no Viro;12 artwork images HTTP200. Updated check-expo-go.mjs enforces the new graph. Evidence: preview2d-camera-install.log, preview2d-ios-bundle.log, expo-go-bundle-check.json and verification.json.
- Browser smoke PASS for Gallery→detail→2D camera-permission screen, with no console errors; no camera permission requested during browser QA. Actual screenshot artifacts/preview2d-permission.png. Native iPhone camera/feed/gesture/lifecycle is UNVERIFIED, with no physical device attached. Server8082 restarted and reachable at192.168.0.103. No APK/iOS-native build performed for this companion feature.
- Initial strict checks caught obsolete absoluteFillObject and ref capture during PanResponder creation. Replaced the style and used state-based drag origins without rule suppression; corrected a mistaken expected edge coordinate in a test. Final checks above pass, including repeated-drag continuity.

## Product steering — Placed direction

User then requested the full direction of Placed, beyond 2D Preview. Reviewed the official App Store listing and recorded a functional gap/workstream map in PLACED_DIRECTION.md. Asked for target device model and Mac availability to select a native scanning implementation that can actually be tested. No full-room3D, automatic LiDAR capture, multi-art layout, relighting, occlusion or full parity is claimed complete. Existing Apple signing limitation remains open; continuing the new native scope depends on device/toolchain information.

## Video-driven core preview and personal photos — 2026-10-27

- Reviewed the user-provided~16s video locally by extracting6 sample frames into ignored artifacts/demo-review. It shows a room photograph and bottom artwork tray switching pieces. User confirmed the requested input is their own artwork photos, then explicitly made this the core and requested a dark, simple UI with unrelated functions removed.
- Shared dark charcoal/gold theme and readable button/input colours; safe-area pages and fewer navigation headers. Removed the account/favorite/profile tab bar and favorite actions from the main detail UI; retained underlying data and legacy sources without deleting user data. Added Preview your wall entry and My artworks/Discover gallery groups. Responsive QA caught scrollbar-dependent one-column wrapping; grid now measures available layout width to keep two columns.
- SDK58 editor now captures a room photo as a temporary background, retakes it, and swaps images with a bottom thumbnail tray. Room background, placement and scale persist across art changes and inline import. Import modal releases/reacquires live camera appropriately. Smaller screens scroll the compact bottom panel.
- Inline Add your artwork supports library images and native Take artwork photo; SDK-matched installed ImagePicker APIs checked against SDK57/58 docs/types. Explicit camera denial/settings recovery, prefilled editable title, compact proportional preview and Use this artwork apply the persisted custom photo immediately. Existing durable local import repository and limits retained; no automatic uploads or microphone permission.
- Final checks PASS: strict TS, clean ESLint,94 tests/16 suites, root Doctor/dependency check; companion TS and Doctor20/20. Tests cover room-photo capture/retake/failure, same-position switching, importing into the same room, preserved scale, and camera-source/denial UI. Earlier favorite-detail tests were replaced with the intentionally reduced core behavior; legacy repository/rollback coverage remains. Test harness corrections handle Expo Image native array sources and identical mocked asset URIs, without suppressing rules or changing production behavior to fit tests.
- CNG Android prebuild/CAMERA check PASS. Prebuild emits its existing optional expo-system-ui interface-style warning; dark app surfaces/status bar are configured, native system appearance still needs device QA. Android Hermes export PASS; final export log is core-ui-android-export-final.log. Root native splash/style config changed, so old pinned-native workflows must not be reused blindly. No APK build/upload performed for this UI request.
- Browser smoke at390×844 PASS: dark two-column gallery, no account/favorite/profile tab bar, public project PNG selected via real file chooser, normalization, default title/edit, saved as Core preview QA at80×120cm, reload persistence and own-artwork2D route/permission screen. Console errors0, nested button DOM count0. That isolated browser QA record was retained; no original/private user photo was changed. Actual screenshot artifacts/core-dark-gallery.png.
- An iOS manifest/bundle request and browser reload timed out while the old Metro session was busy after route/source changes. Restarted only this companion's port8082 process with --clear. Fresh full iOS manifest/development/source-map/launch checks PASS:7 camera sources, both preview screens, one SDK58 React/RN and no Viro;12 assets HTTP200. See core-ui-ios-bundle-final.log, expo-go-bundle-check.json and core-ui-verification.json. The initial timeout log remains as history.
- Physical iPhone camera/room photo/art photo/orientation/lifecycle and Android AR remain UNVERIFIED. Editor photo is not a saved composite, mapped wall or 3D room. Full Placed parity remains outside the actually completed functionality; see CORE_PREVIEW.md and PLACED_DIRECTION.md. Server8082 is running on the existing LAN address for Expo Go reload.


## Placed-style persistent studio expansion - 2026-10-27

- User clarified that the entire Placed functionality is the direction; the video is only an example. Reviewed the official listing and implemented the feasible shared photo-studio work rather than claiming full parity. Detailed implemented/absent capabilities: PLACED_STUDIO.md.
- Added durable local wall spaces, manual quadrilateral perspective/dimensions, up to9 independently selectable artwork slots and layouts, frame/mount/shadow/glazing and colour controls, manual foreground masks/undo, sample illustrated rooms, filters, save/reopen and PNG export. Live captured photos can enter the durable studio. Native Android now has the SDK57 camera boundary; SDK58 companion remains isolated and Viro-free. Home preview opens My walls for the complete flow.
- Added exact normalized-image fingerprint duplicate review for new personal imports. Existing10-import cap remains explicit; no perceptual recognition or photo-library scan is claimed. Snapshot copies survive removal of an original import. Spaces cap20; stale-editor conflict detection, image rollback, quota recovery and post-commit app-owned file pruning are implemented.
- Browser QA caught relative Metro asset URIs rejected before persistence, unsupported ClipPath prop in installed types, SVG mesh seams, non-rendering defs load callbacks, and a literal space outside Text. Fixed URI handling, removed unsupported prop, overlapped/clipped mesh triangles and added explicit image readiness probes/retry. Export now embeds all image data and browser downloads PNG; native export/share is still hardware-unverified.
- Lint caught mutable gesture-local state/ref capture; foreground stroke collection now uses state plus an effect delivery guard. A later no-op normalization issue was repaired to preserve editor/texture identity for unchanged layout events and covered by regression tests. Layout fitting retains centimetre frame widths; pair/stack counts and fewer/more-slot behavior repaired.
- Actual browser PNG download verified and visually inspected: artifacts/placed-browser-export.png,1280x960,152748bytes. Browser interaction also verified save/reopen of a two-piece wall, skewed wall-corner dragging, manual foreground masking and undo, frame choices, and unsaved-change prompt. Test records use original public project art/sample interiors, not private video/room photos.
- Root/companion final evidence and replacement APK status are recorded below once complete. Native iOS scanning/automatic measurements/lighting/depth, Vision OCR/find-art, external artist services/share-in and hundreds-of-pieces library remain NOT_IMPLEMENTED. No stub adapter or hidden dependency conflict is counted as a feature. Physical camera/AR/share/install gates remain UNVERIFIED.

- Final automated verification PASS: root strict TS, clean ESLint,126 tests/19 suites, Doctor21/21 and SDK dependency check; companion TS, Doctor20/20 and dependency check PASS. Android CNG CAMERA/no-microphone manifest and production Hermes export PASS. Fresh SDK58 iOS manifest/full bundle/map/launch verification PASS; extended check now requires SpacesScreen, SpaceEditorScreen, SpaceCanvas and ForegroundPainter, one React/RN and no Viro;12 catalogue images HTTP200. Initial Metro cache/timeout logs remain as history; the cache-cleared final server passed.
- Mobile viewport390x844 browser smoke PASS for readable dark header/tools, visible thumbnail tray and independent second-slot selection. Screenshot artifacts/placed-studio-phone.png. A final compact-filter adjustment keeps search controls collapsed below thumbnails; first queued buildca4d0221-ae30-4402-b856-0990a9ef6599 was explicitly canceled before delivery. Replacement full preview build03caa09a-cf50-4129-8f43-e5eabd238d9c submitted with native fingerprint6fb75628d3441f13dc27d34f39d80d8482bf9dce. Status/build acceptance is recorded separately after completion; a queued build is not a delivered APK.
- Final118-file runtime snapshot:4e801be9c5324c088f2c9a6d12c120e96c8a1b4d070fb31e15eb07cdf634ae3a. Subsequent changes are documentation/check scripts only. Do not reuse the older wall-fix APK as the studio release. adb devices rechecked: no attached Android devices; native AR/camera/share/install remain UNVERIFIED.

- Additional browser integration QA PASS at390x844: imported public bundled art03 as Studio duplicate QA, selected it directly in the same two-slot room, imported the same file again and saw the match warning with saving disabled until explicit duplicate approval. Use existing artwork returned to the editor without another record. Kept the one new isolated QA import; no existing records or original photos deleted. Screenshot artifacts/placed-duplicate-review.png. Final fresh-tab console error count0; temporary viewport override reset.

- Nine-slot browser grid and PNG export PASS: reached9/9 with More pieces disabled, exported/visually inspected artifacts/placed-grid-export.png (1280x960,244528bytes), then discarded only the unsaved QA grid and confirmed the prior saved two-piece room remained. Requested gaps are maximums when fitting a dense arrangement; no automatic occlusion is inferred from a sample image.

- External release gate: as of2026-10-27T15:04:23Z, replacement03caa09a-cf50-4129-8f43-e5eabd238d9c remains IN_QUEUE (submitted14:42:15Z). No replacement APK artifact exists yet; no download/signature/install pass claimed. The agent has not configured a background monitor or scheduled follow-up. Status and exact build link: evidence/placed-build-status.json. APK signature/permissions/markers verifier scripts/verify-studio-apk.ps1 is prepared and syntax-checked only; run against the completed artifact when available, not an older APK. Do not resubmit a duplicate build simply because this one is queued.
- LAN delivery API check PASS at192.168.0.103:8082: SDK58 manifest HTTP200 with matching hostUri. QR remains valid for the same Wi-Fi. Final Android Hermes export is placed-android-export-final.log. Full Placed/native iOS parity remains open as explicitly listed in PLACED_STUDIO.md; current photo-studio work is not represented as 3D reconstruction.


## Native editor render error repair - 2026-10-27

- User supplied an actual Expo Go/React Fabric render failure at SpaceEditorScreen.tsx:166 after editing: undefined is not a function. This is USER_REPORTED_FAIL, not a hardware pass.
- Root cause confirmed in installed React Native source (Libraries/Core/setUpGlobals.js): native defines window=global. Checking typeof window alone does not imply DOM event methods exist. The dirty-design effect called window.addEventListener on iOS/Android.
- Extracted useUnsavedReloadGuard with explicit Platform.OS===web and callable add/remove listener checks. Native navigation-removal guard remains independent; web listener registers only while dirty and cleans up on save/unmount. Audited other DOM calls: only platform-specific .web.ts image/export adapters remain outside this guarded hook.
- Added5 regression cases: dirty transition with native window but missing event methods on iOS and Android; native shims still skipped; web prevent/release/unmount cleanup; web without DOM event APIs. Initial test TypeScript inference was corrected with explicit renderHook props generics. Final root TS/lint/131 tests in20 suites/Doctor/dependency check PASS; companion TS PASS; iOS manifest/bundle/map/launch PASS with required native-safe hook source, one SDK58 React/RN and no Viro. Android production Hermes export PASS. Evidence: studio-native-guard-* logs and verification JSON. Physical phone retest remains PENDING_USER_RETEST.
- Server8082 serves the fixed source; user should Reload Expo Go, with no reinstall or data reset. New regression checks establish the missing-function fix, not an end-to-end native camera/AR/share acceptance.
- Canceled queued build03caa09a-cf50-4129-8f43-e5eabd238d9c because it contains the native crash; do not deliver it. Submitted corrected full preview15a939d0-80a0-49ac-bb1a-37f3f9fadc86; exact current state in evidence/placed-build-status.json. No artifact/signature/device pass until actually available. New119-file runtime SHA25618d3383d777010ce58d283c5731812171f58aa82ed505d50554b2742a4bbf437; prior snapshot preserved separately. No background monitor created.

## Screenshot-driven View on room flow - 2026-10-27

- User supplied six Placed screenshots and clarified the core: library, room photograph, View on room, automatic placement and realistic adjustment. Kept the previously requested dark palette. Added Artworks/Interiors/Saved navigation, Discover/My artworks, editorial two-column cards, camera/photos Add your room sheet, room hero/thumbnails and eight visual layout presets. No private screenshot was copied into bundled assets.
- View on room targets the selected active room, falls back automatically to a single saved room, or asks the user to pick among several rooms. Incoming artwork is applied in memory, preserving wall calibration, other slots and previous design until explicit Save. Empty rooms use a fitted single piece; gold resize handles, approximate dimension label and tap-to-move are available.
- Added local 96px colour/texture-based empty-wall suggestions, mild image-tone suggestions and optional coarse colour mask. This is a bounded heuristic, not semantic AI/depth/3D/physical measurement. Failed analysis retains manual setup; corners, measured dimensions, Occlusion toggle and manual mask replacement remain available. JPEG decoding uses Uint8Array; PNG masks use a small pure encoder without Node/DOM globals. Pure JS jpeg-js/base64-js installed in both isolated SDK packages without force flags.
- Style now has Frame/Image/Light, neutral labels, image reset and room-tone match, shadow intensity/offset and saved/exported Occlusion state. Proportional corner resizing uses inverse wall projection; degenerate microscopic texture quads safely skip artwork texture rather than crash. Existing native-safe reload guard retained.
- Root verification PASS: strict TS, ESLint,143 tests/23 suites, Doctor21/21 and dependency compatibility. Companion TS, Doctor20/20 and dependency check PASS. Android production Hermes export PASS (view-room-android-export.log). New tests cover suggestion bounds/dark fallback, independently decoded PNG pixels, placement immutability/scale, style export/domain validation, tiny textures and five route/editor integration cases.
- Actual browser QA at390x844 PASS: create Bedroom sample -> Choose from library -> View on room opens the active Bedroom among two saved rooms -> resize controls/Style Image-Light -> shadow offset150%, Occlusion off/on, image reset -> Save -> reopen via Saved -> same art/size retained. Pair layout creates two pieces; discarded only the unsaved pair and retained saved single. Actual PNG downloaded and visually inspected at1280x960, without controls/handles. Screenshots: artifacts/view-on-room-gallery.png, view-on-room-autoapply.png, view-on-room-layouts.png; output view-on-room-export.png. One save attempt failed while Metro was overloaded; retry after bundle compilation succeeded, with no console error and no data loss. Native camera/share/AR/device installation remain UNVERIFIED.
- iOS graph requests hit old Metro timeouts, retained in view-room-ios-bundle*.log. Restarted only the verified companion port8082 process and reran the extended checker requiring ViewOnRoomScreen and photo-assist/mask/placement sources, in addition to native-safe guard and Viro exclusion. Final result recorded below.
- Finished prior build15a939d0 is a native-compatible base, not the screenshot-flow APK. Current local Android native fingerprint6fb75628d3441f13dc27d34f39d80d8482bf9dce matches that base. Submitted managed repack workflow01a17e26-2f84-7c8b-86ef-e0aab76d36fd with embedded current JS/assets; no OTA/store submission. Runtime snapshot128 files SHA2568b43d5cde402585188e428321e8c97384adda54f64117aba744e01f85a841dd9. Workflow current state in evidence/view-room-workflow-status.json; no APK verification/device pass before a real artifact exists. No background monitor created.
- After clean Metro restart, extended iOS manifest/bundle/map/launch check PASS:1635 sources, required new room-flow files, one SDK58 React/RN, no Viro,12 artwork images HTTP200. A later Doctor refresh detected newly published SDK58 patch expectations (expo58.0.20, file-system58.0.12, router58.0.27). Updated only the isolated companion using expo install, no force flags; companion TS, Doctor20/20 and dependency check PASS again. Earlier dependency logs are retained; patched final bundle check is recorded separately. Android uploaded runtime/native fingerprint is unaffected by companion-only lockfile changes.
- Final patched SDK58 iOS manifest/full bundle/map/launch PASS (view-room-ios-bundle-patched-final.log);12 images HTTP200, no Viro, one React/RN. Latest candidate build cff492fd-643f-4e12-a916-71d90e48f809 remains IN_QUEUE as of2026-10-27T16:22Z with no artifact URL. No duplicate submission or background monitor. Expo Go can Reload the current port8082 source. Hardware camera/gestures/share/AR and standalone installation remain UNVERIFIED.

## Native Text parent console error - 2026-10-27

- User reported Fabric: Text strings must be rendered within a Text component. Found explicit JSX whitespace expression after the busy/Cancel branch in SpacesScreen Add your room modal (line421 before repair). A literal space is a native text node even though invisible in web QA; removed it. No data/dependency/native configuration change.
- Added native-text-boundaries.test.ts: rejects literal strings/numbers and explicit whitespace outside Text, covers hidden modal/fragment fixtures, and scans shared src/app plus both companion source/routes. Test Renderer does not enforce Fabric's parent-text rule, so the static JSX regression check supplements screen interaction tests instead of relying on absent console errors.
- Final root strict TS/lint/146 tests in24 suites/Doctor21/21/dependency check PASS. Companion TS/Doctor20/20/dependency check PASS. Fresh SDK58 iOS manifest/full bundle/map/launch PASS (native-text-ios-bundle.log), including the shared fixed screen, one SDK58 React/RN and no Viro. Metro8082 serves the fixed source; Reload Expo Go without reinstalling or clearing local data. Actual hardware retest is PENDING_USER_RETEST, not inferred from automated tests.
- Canceled queued candidate cff492fd-643f-4e12-a916-71d90e48f809 because it contains the whitespace bug; do not deliver it. Submitted replacement workflow using the same verified native fingerprint/base and corrected source. Runtime128-file SHA2560da1f6c62b5c1ba49165cadb89f4efb9ab3958408a3398b05e052187ed2ccc4a; evidence/native-text-runtime-source-manifest.json. Exact workflow submission/status follows when returned; no artifact/download/signature/install pass claimed. No background monitor created.
- Replacement workflow uploaded successfully:01a17e33-b9bd-787f-8da5-fe46aded1ca9. See native-text-workflow-submit.log. This is a packaging submission, not a completed APK. No runtime changes after upload.

## Style, explicit sizes, room/art zoom and visual frames - 2026-10-27

- Reviewed the supplied MOV locally (sampled contact sheet under ignored artifacts/style-video-review) and five style reference images. User asked for brightness/darkness, shadows, width/height, zoom of room/art and extra frame selection. No private footage/captures were bundled, committed or uploaded as product assets.
- Added visual Bare/Slim/Classic/Float/Canvas edge presets, editable colour/frame/mount widths, dark float gap and existing glazing. These are 2D edge treatments, not volumetric canvas reconstruction. Image adjustments retain neutral/reset/room-tone options; every slider now has accessible plus/minus fine controls. Light adds angle and softness with bounded shared layered-shadow geometry in native preview and standalone PNG; intensity/offset/Occlusion remain available.
- Added direct effective artwork width/height in cm, proportional lock (default on), comma/decimal input, bounds/error feedback and explicit Apply. Changes affect the design snapshot, never the original library record. Oversized designs fit within the wall and display effective size. Manual wall calibration is still required for accurate physical scale.
- Added separate Zoom room (1x to4x, pinch/pan/slider/reset) and Zoom artwork (two-finger pinch resize plus existing slider/corner handles). Room zoom is view-only, does not mark designs dirty and never changes calibration/saved data. Export renders the full-room rectangle at its normal scale even while viewing a crop. Gesture initialization also handles a second finger added after the first touch.
- Root TS/lint/151 tests in25 suites/Doctor21/21/dependency compatibility PASS. Companion TS/Doctor20/20/dependency check PASS. New tests exercise invalid/oversized explicit dimensions, immutability, viewport clamp/reset, directional/soft shadow geometry, saved appearance validation and real editor save of frame/light/size while room zoom stays transient. Initial fixture import referenced a nonexistent mock filename; corrected to a typed independent fixture. Final focused13 tests/3 suites and TS/lint PASS after formatting; no rule suppression or forced dependency flags.
- SDK58 iOS manifest/bundle/map/launch graph PASS with new FramePicker/ArtworkDimensions/styleEditing sources and room zoom/shadow softness/size markers, one React/RN and no Viro (style-ios-bundle.log). Android production Hermes export PASS (style-android-export.log). No new native dependencies.
- Actual390x844 browser QA PASS: select Classic frame, change angle52.71/softness8.4, unlock proportions and enter78.4x66cm, apply, zoom room2.51x without dimension change, download full-room PNG, reset view, Save, leave/reopen, confirm same size and light values retained. Inspected actual1280x960 PNG artifacts/style-zoom-export.png: full room, frame/shadow, no controls. Final browser console errors0. Proof artifacts/style-frame-picker.png, style-room-zoom.png, style-light-final.png. Restored browser viewport override. Native two-finger gestures/filter fidelity/camera/OS share/device install remain UNVERIFIED.
- Current native fingerprint6fb75628d3441f13dc27d34f39d80d8482bf9dce still matches finished base15a939d0. Canceled queued prior bd8d036d-848e-470f-967b-9c993215f4b3 because latest requested features supersede it. Submitted replacement managed workflow01a17e3e-9f2e-7260-841e-e96fbcee7c8b with embedded current bundle/assets. Runtime131 files SHA2560bfaa0ad841948db39ac29d76302a6309677a817de097fa71c4a68bd10bd9f9d. No runtime edits after upload; exact packaging status in style-workflow-status.json. No completed APK/signature/installation claim until actual artifact verification; no background monitor created.
- Workflow returned candidate94d63e79-b901-4c29-a59c-515cc6eba13e IN_QUEUE, with no artifact yet. Use this candidate for latest style/zoom; do not deliver canceled prior candidates. Fingerprint/source snapshot remain unchanged.

## Direct manipulation and frame depth - 2026-10-28

- Removed Zoom room/Zoom artwork mode buttons. The stage hit-tests what is touched: tap art selects it, tapping the same art or the background deselects; only selected art drags; pinch on art resizes it, pinch/pan on the background changes the transient room view.
- Lint caught ref access during render in the PanResponder-based hook (react-hooks/refs, preserve-manual-memoization). Replaced it with plain responder props that read options only inside touch events. Drag now starts only after the 4px tap slop, so a tap never begins a drag; finger-count changes re-base the centroid so adding/lifting a finger neither jumps the view nor drags/toggles art; a terminated touch never toggles selection.
- Shadow: three-step contact occlusion hugging the frame plus the existing weighted soft cast shadow. Frame edges: lit-side highlight and far-side darkening on the outer bevel, plus an inner lip shadow onto the mount (framed pieces only). Depth side shading was inverted (faces toward the shadow were lighter); corrected. Native preview and PNG export use the same layers. Still a 2D treatment, not volumetric rendering.
- Root strict TS, ESLint clean, 163 tests/27 suites PASS (new: tap slop, finger added mid-drag, finger lifted after pinch, zoomed one-finger pan, terminate, disabled modes, contact/edge/depth shading). Companion TS PASS. Native two-finger gestures on hardware remain PENDING_USER_RETEST; no new build submitted.

## Direct selection and SDK58 single-app consolidation - 2026-10-28

- User requested direct touch interaction and more realistic wall-art relief, then explicitly selected removing native AR and merging into one SDK58 Expo Go app. This supersedes the original AR master scope and former SDK57/SDK58 split. No account/AR capture UI remains; the product is a local photo wall studio.
- Direct input now starts deselected. Tap artwork to select, tap it again/background to deselect; unselected art cannot drag. Pinch ownership comes from the first touched region: art resizes that piece, background changes only viewport zoom/pan. Removed zoom-mode buttons and swipe-to-switch behavior. Fixed editor normalization that previously auto-selected the first piece after explicit deselection. Raw native responder props track centroid/finger-count transitions without recreating PanResponder state or violating React's ref lint rule. Foreground/wall-corner tools keep their separate intentional modes.
- Added optional depthCm with projected shaded side faces, a near-contact shadow and weighted soft penumbra. Depth affects shadow reach; side projection follows view position and lighting affects face shading. Preview and PNG share layers; this is projected2.5D, not AR/3D reconstruction. Native touch/filter fidelity remains hardware-unverified.
- Root dependencies now use Expo58, React19.3/RN0.88 and one lockfile; removed Viro/dev-client, Firebase, duplicate live 2D camera flow and unused animation packages. Removed legacy auth/favorites/AR-capture routes, repositories and their now-retired tests. Active source/routes104 ->62 files (src85 ->53; routes19 ->9). Former companion source/config/native output moved out of active workspace paths; recovery copies are ignored under artifacts. Source backup ZIPs preserve the previous implementation; no private photos or credential files were deleted.
- AppProviders/repositories now expose only artworks/customArtworks/spaces and activeRoomId. Bundled catalogue has a descriptive repository name; shared KeyValueStore no longer depends on an AR-saved-design repository. Room/import keys/version1 schemas remain unchanged; native Expo Go experience-sandbox continuity after project identity consolidation still needs phone retesting. The original Android package/EAS identity is retained.
- Extracted ArtworkStylePanel and StudioControl from SpaceEditorScreen; canonical root routes replace duplicate companion/tab routes. Root README, ARCHITECTURE and FIVE_MEMBER_HANDOVER are the active review path. Twenty older guides moved under docs/history; prior evidence remains historical. M1 UI/navigation, M2 editor/visual math, M3 data/image I/O, M4 domain/contracts, M5 platform/QA/release. This is a future handover map, not delegated implementation or authorship claim.
- Initial npm resolution exposed the real Router58 peer requirement for Testing Library14. Updated that library/test-renderer and used expo install --fix to align Jest30/types30. Migrated async test APIs per primary Callstack docs. Corrected ReactNative0.88 component-ref and readonly-touch types. No force/legacy-peer-deps or rule suppression used.
- SDK58's Jest preset selected the upstream object asset transformer before Expo's numeric transformer; using Expo's transformer for the same asset pattern plus real RN AssetRegistry fixture registration repairs unit-test assets. This changes the test harness only; served catalogue image URLs are checked separately. One first cold screen run hit the5s test timeout; the warm8-test screen rerun passed without raising timeouts. Full post-clean verification is recorded below after completion.
- npm ci first failed on Windows because an unrs native resolver DLL was locked. Moved the incomplete install to an ignored recovery location and reran against an empty root node_modules; clean npm ci completed exit0 (1363 packages). It reports16 advisories (13 low/3 high); no forced audit fix applied. Automatic review rejected recursive deletion of old dependency backup folders with only "blocked by policy"; they remain outside the active app and excluded from Git/Metro/TS/ESLint/Jest. Safe source-file removal was completed with explicit patch edits.
- npm start is now the root expo start --go command, without a companion delegation or secondary setup. Old pinned-native repack workflows were removed: SDK58 must not be embedded into prior SDK57 APKs. No new APK/store/OTA submission is implied by this Expo Go/source-cleanup request. Camera/native pinch/OS sharing remain physical-device retest gates.
- Final post-clean verification PASS: strict TypeScript, ESLint, 91 tests/17 suites, Expo Doctor20/20 and managed dependency compatibility. npm ls --all exits0 with no invalid dependency problems. iOS manifest/bundle/map/launch and all12 catalogue images pass; one React/RN graph and no Viro/Firebase/companion sources. Production Hermes exports complete for both Android and iOS. LAN manifest HTTP200 confirms SDK58.0.0 and current Wi-Fi hostUri; npm start remains running on8082.
- Actual browser QA PASS: Discover -> View on room -> Bedroom auto-placement, initial deselection, tap-select, repeat-tap deselect, background deselect, Style/Light depth1.8->1.9cm; desktop and390x844 layouts; captured console errors/warnings0. No private photos used and no saved design overwritten (unsaved draft only). Local screenshots artifacts/sdk58-style-proof.png and sdk58-style-mobile-proof.png. Physical-device camera, multitouch, native filter fidelity and OS sharing remain unverified. Final runtime snapshot90 files SHA256f1e7225de8e38dfa4bd07226d3746b63e22fc5ed0dd28351a50460b837aa14a7; deliveryBuildId null. Current checks and limitations are consolidated in docs/TEST_REPORT.md.
- Editor visibility controls (2026-10-28): added Hide tools/Show tools independently of View full/Shrink view. Full view fits the entire room in the available screen, hides the header/selection/wall/foreground overlays and disables artwork editing until shrink. Room zoom/pan, selection, current style subtab and unsaved artwork edits are preserved; visibility controls do not save or alter the design. The tool panel stays mounted with display:none so nested editing state survives collapse. Initial regression test caught subtab loss with conditional unmount; corrected before completion.
- Verification for visibility controls: strict TypeScript and lint PASS, 92 tests/17 suites PASS, Doctor20/20 and Expo dependency check PASS. Browser390x844: Hide tools -> View full -> Shrink view retains hidden tools; Show tools restores panel; full-room preview contains no selection or editing overlays. Captured browser warnings/errors0. Proof artifacts/editor-tools-hidden.png and editor-full-room.png. Native device retest remains unverified.

## Current bug audit — 2026-10-28

- Fixed catalogue/save URI validation for Expo Go LAN10/8 and172.16/12 plus loopback, using parsed hostname checks that reject spoofed localhost/private-host prefixes and public HTTP. Added12 host cases. The current10.x network could previously preview catalogue images but fail save validation.
- Fixed scale/view jumps when replacing a finger during a pinch: re-base each segment from live artwork scale/room zoom/pan; target stays fixed. Added2 regressions. Disabled responders now also ignore stale grant/move/release while editing is blocked.
- Room/import deletion now commits metadata before best-effort file cleanup, so storage failure cannot destroy images still referenced by a saved record. Added metadata-failure regressions and updated cleanup-failure expectations; cleanup failure may leave an orphan, never a broken visible record. No real user data was deleted in this audit.
- Full view now shows the composed design even after Show original; shrink restores comparison. Android Back shrinks first, covered by a listener test. Initial new test exposed RN0.88's required back-event payload and Jest's unsupported dynamic import; corrected the test to use a static act import and a typed event. Final strict TS/lint/109 tests in17 suites/Doctor20/20/dependency checks PASS. Final iOS Expo Go bundle/assets/map/launch and both Android/iOS Hermes exports PASS.
- Actual browser regression and1280x960 PNG export PASS; inspected frame/shadow/full room with no editor controls, warning/error logs0. Public sample content only, unsaved draft unchanged on disk. Proof artifacts/bugfix-full-room-proof.png and bugfix-export.png. Physical-device camera/multitouch/native share/back remain UNVERIFIED.
- Audit still reports16 transitive advisories (13low/3high) from deepmerge and Expo CLI Zod. Registry/advisory checks confirm deepmerge has no published patch; patched Zod4 is outside the CLI's declared3.x range. npm's proposed Expo51/Jest25/Router5 downgrades would break SDK58 requirements. No forced dependency replacement. Details and primary advisory links in TEST_REPORT.md; no claim that all dependency or hardware issues are resolved. Runtime source snapshot SHA2567377d8a1b5b70978bd3078177876c97dac752717f07286a9c190f9f9c8988e35, no APK association.
