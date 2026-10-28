# Required external actions

## Standalone iPhone installation — 2026-10-27

User requested an iPhone app installable from a download link and confirmed no Apple Developer membership. Standalone EAS iPhone distribution is BLOCKED on Apple signing credentials: internal ad hoc distribution requires a paid Apple Developer account and registered device; TestFlight also requires membership. Root config currently targets Android and has no iOS bundle identifier; native iOS/AR compatibility and device execution have not been verified. No IPA was built or distributed and no subscription purchased.

References: https://docs.expo.dev/build/internal-distribution/ and https://docs.expo.dev/submit/testflight/.

The existing SDK58 Expo Go companion supports catalogue/import previews, requires a running development server and has no native AR. A hosted web app added to the iPhone Home Screen is a separate possible scope with no native Viro AR; it has not been deployed. A free Apple Personal Team with Xcode on a Mac supports temporary development testing rather than the requested general download link.

## Physical Android acceptance

No physical device was connected (`adb devices` returned an empty list). Install the final signed APK linked in RELEASE.md on an explicitly ARCore-supported Android phone. Record model, Android version, Google Play Services for AR version, lighting/wall texture, approved camera+art screenshot and tracking video. Follow AR_TEST_PLAN.md, including permission denial, unsupported hardware, ten AR sessions, capture, save/restart/delete and Metro-off launch. Archive/signature checks are not installed-app tests. AR_DEVICE_UNVERIFIED and RELEASE_VERIFIED=UNVERIFIED remain open.

## Select the intended Firebase project

Firebase CLI is authenticated, but only a generically named pre-existing project was discovered and no ArtSpace project was supplied/selected. It was not modified. Select/authorise the intended project, confirm database edition/location, register a Web App, enable Email/Password Auth and fill .env.local public config per SETUP.md. Review/deploy the prototype rules explicitly to that project and seed the sample catalogue. Verify real register/login/session persistence/profile/favorites and account A/B isolation. No real cloud Auth/Firestore/Storage acceptance has occurred here.

Until then the APK intentionally uses its labeled bundled catalogue, unavailable-account setup state and real native AR/local-save implementation. No fake accounts or cloud synchronisation are supplied.

## Optional cloud photo storage

Keep local-only mode unless the bucket and any required billing were authorised by the project owner. No billing was activated or changed. If cloud storage is in scope, configure the authorised bucket, review/deploy Storage rules and verify real owner upload/download/delete/rollback on device. Only then enable both EXPO_PUBLIC_ENABLE_CLOUD_STORAGE and EXPO_PUBLIC_CLOUD_STORAGE_VERIFIED. The verified flag is operator attestation, not evidence of tests performed here.

## Local resources and dependency review

This host has 8GB RAM. Android Gradle/Kotlin/C++ compilation exhausted memory and was intentionally stopped; the native EAS pipeline succeeded. Reuse the configured EAS project 189b9e68-6e66-4aae-b46c-77d7ab9a588b and its remote Android signing credentials, or use a better-resourced machine for local native compilation. Do not repeat project/keystore creation.

Final clean-install audit reports 24 advisories (14 moderate, 10 high), documented in SECURITY.md and evidence/npm-audit-final.json. Review compatible upstream fixes before broad distribution. Forced fixes proposing replacement of the required Expo/Firebase/Viro stack were not used. Static/unit/build PASS is not a public security release sign-off.

## Personal import follow-up

New picker/manipulator native dependencies require the new preview APK or a rebuilt development client; the older MVP APK cannot run imports. Complete physical picker, orientation/HEIC, persistence, custom image AR/capture and Metro-off install tests on supported Android hardware. Import browsing can be checked immediately with npm run web or npm run start:iphone. No cloud setup is required for device-local imports; cloud publication/sync is outside this feature.


## Placed-style studio device acceptance

Shared photo-studio source and tests are implemented; full Placed parity is not delivered. Native iOS ARKit/LiDAR scanning, automatic lighting/depth, OCR/find-art, share-in/artist services and a hundreds-of-items library still require implementation, not just user credentials. See PLACED_STUDIO.md. Existing Apple signing/Mac and real-device constraints remain for any native iOS work.

For the replacement Android APK: install over the prior app to keep local data; test room camera/library, personal art import, saved-wall reopen, dragging/corner calibration, layouts, foreground strokes, frames/colour and OS PNG sharing. Separately retest native vertical-wall AR on an actual ARCore-supported phone. No connected phone was available in this session, so build results do not establish a physical pass. iPhone Expo Go can test the photo studio only.
