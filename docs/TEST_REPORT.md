# SDK 58 photo studio verification

Verified on 2026-10-28 after consolidation into the root Expo Go app.

| Check | Result | Evidence |
| --- | --- | --- |
| Clean npm ci | PASS, exit 0 | evidence/sdk58-npm-ci-clean.log |
| Strict TypeScript / ESLint | PASS | evidence/verification.json |
| Unit and integration tests | PASS, 109 tests / 17 suites | evidence/unit-tests.log |
| Expo Doctor | PASS, 20/20 | evidence/doctor.log |
| Expo managed dependency check | PASS | evidence/verification.json |
| Complete dependency tree | PASS, no invalid dependency problems | evidence/sdk58-dependency-tree-final.log |
| iOS Expo Go manifest, bundle, source map, assets and launch | PASS, one React/RN graph, no Viro/Firebase/companion sources | evidence/expo-go-bundle-check.json |
| Android and iOS production Hermes exports | PASS, both platforms | evidence/sdk58-mobile-export.log |
| LAN Expo Go manifest | PASS, HTTP 200 / SDK 58.0.0 | evidence/sdk58-lan-manifest.json |

Browser QA at localhost:8082 verified Discover → View on room → Bedroom, automatic artwork placement, initially disabled editing, tap artwork to select, tap again to deselect, background tap to deselect, Style → Light, and depth adjustment from 1.8 to 1.9 cm. Desktop and 390×844 layouts rendered successfully; captured browser warnings/errors were empty. This used bundled/sample content, not private captures. The design change was left as an unsaved draft. Proof images are ignored local artifacts: artifacts/sdk58-style-proof.png and artifacts/sdk58-style-mobile-proof.png.

Physical iPhone/Android Expo Go installation, camera/photo permissions, two-finger gestures, native filter appearance and OS sharing have not been verified on hardware. Browser QA and successful bundles do not establish those results. No new APK or store/OTA release was made. Previous SDK 57 APKs are historical.

Clean installation reports 16 dependency advisories (13 low, 3 high); no forced audit fix or peer-conflict bypass was used. Old dependency/native recovery folders remain ignored under artifacts because automatic approval review rejected recursive removal with only “blocked by policy”. They are excluded from Metro, TypeScript, lint and tests.

The runtime snapshot is evidence/runtime-source-manifest.json; its deliveryBuildId is null because this is a source/Expo Go verification, not an APK association.

Editor visibility follow-up: Hide tools/Show tools and View full/Shrink view pass automated preservation coverage (edited artwork saved after toggles, style subtab retained, no implicit save). Browser390×844 confirms full-room fitting without editor overlays, shrink restores the prior hidden-panel state and Show tools restores the panel. Captured console warnings/errors0; local proof artifacts/editor-full-room.png and editor-tools-hidden.png. These UI changes have not been tested on a physical phone.

## Bug audit follow-up — 2026-10-28

- Fixed Expo Go save validation on 10/8, 172.16/12 and loopback networks. Previously the catalogue asset URI on the current 10.x Wi-Fi could render but fail space validation before durable image persistence. Parsed host checks retain rejection of public HTTP and lookalike hostnames; added accepted/rejected host regressions.
- Fixed interrupted/restarted pinch segments. Every finger-count transition starts a new pinch baseline using the current artwork scale or room zoom/pan, preserving the original target. Tests cover replacing a finger at a different spread without an artwork or viewport jump.
- Room/import deletion commits metadata before file cleanup. A failed metadata write now preserves all existing images and records. Cleanup errors after a successful logical deletion can leave app-owned orphan files but cannot leave a visible record referencing deleted files. Original user photos are unaffected. Tests cover both metadata and cleanup failures.
- Full view shows the design even when comparison was set to the original; shrinking restores that comparison state. Android Back shrinks full view before navigation (automated listener test); full view disables direct editor responders as well as pointer input.
- Final TypeScript, lint,109 tests/17 suites, Doctor20/20 and managed dependency checks PASS. iOS Expo Go bundle/map/asset/launch checks and production Hermes export for both platforms PASS. Evidence: verification.json, bugfix-ios-bundle.log, bugfix-mobile-export.log. No APK release was created.
- Browser regression: Show original -> View full shows the artwork; Shrink view restores Show design; exported a real1280×960 PNG and inspected the complete room/frame/shadow with no editor UI. Console warning/error log empty. Public sample content only, no saved design overwritten. Local proof artifacts/bugfix-full-room-proof.png and bugfix-export.png. Hardware camera/multitouch/share/back behavior remains device-unverified.
- npm audit remains16 advisories (13 low/3 high), propagated from deepmerge4.3.1 and Expo CLI's zod3.25.76. The installed CLI declares zod^3.25.76; forcing Zod4 would cross its supported major. deepmerge has no published patched version according to the [maintainer-linked advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4); the [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) names4.6.6 as patched. npm suggests incompatible Expo/Jest/Router downgrades. No force flags, overrides or SDK downgrades were applied. See evidence/current-audit.json. This audit does not claim zero remaining dependency vulnerabilities or complete hardware acceptance.
