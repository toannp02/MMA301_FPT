> Current photo-studio workflow: reusable room photos, manual perspective/measurements, up to9 artwork slots, framing/colour, foreground masking, duplicate review and PNG export. See [docs/PLACED_STUDIO.md](docs/PLACED_STUDIO.md) for actual scope and remaining Placed parity; [docs/EXPO_GO_IPHONE.md](docs/EXPO_GO_IPHONE.md) for the SDK58 companion. Native Android/Viro remains SDK57; hardware acceptance remains open.

# ArtSpace AR

Android-first wall-art preview for MMA301. Built by one agent in one repository, organised into five handover modules.

Expo SDK 57 / React Native 0.86 / React 19.2 / ViroReact 3.0.3 / TypeScript strict / Firebase JS SDK 12.

Includes a twelve-piece original CC0 catalogue, search and category filters, artwork details, guest access, email/password Firebase Auth, private favorites/profile, native vertical-plane AR placement, proportional resize/reset/artwork switching, native screenshot preview, and persistent local or explicitly enabled cloud saves. No persistent anchors or shopping/payment features.

[Download the signed Android preview APK with personal artwork import](https://expo.dev/artifacts/eas/c-90TAKW9ulmVqhm0g6DfhYJNijQbOgcAHghf8pbPVU.apk). Built and signature-verified; installation, AR hardware and live Firebase acceptance remain unverified. See [release evidence](docs/RELEASE.md).

## Run

Personal artwork import: Gallery → **Import your artwork** → select an image → enter title/width → save. Imports persist locally and can be used by native Android AR. See [import behavior, limits and build requirements](docs/IMPORT_ARTWORK.md). The APK linked above includes imports; older MVP APKs predate this feature.

For a browser catalogue preview, run `npm run web` and open `http://localhost:8081`. Web shows AR availability information; wall placement and capture require the native app. `npm start` starts the native development-client server.

For **Expo Go on iPhone**, use the separate SDK 58 preview:

```powershell
npm ci
npm run setup:iphone
npm run start:iphone
```

Scan the QR with the iPhone Camera while both devices share Wi-Fi. Catalogue, detail and configured account features are available; native AR/capture require the native app. See [iPhone setup and limitations](docs/EXPO_GO_IPHONE.md). The commands below run the original SDK 57 native app.

```powershell
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo-doctor
npx expo prebuild --platform android
npm run android
npm start
```

Use a native development build. **Expo Go cannot run Viro AR.** With no Firebase env configuration, the app presents a labeled bundled demo catalogue; sign-in is unavailable and images save privately on this device. This mode contains real AR code, not simulated placement. Local capture contents still require hardware verification.

For an independent preview APK, configure your own Expo project/account, then:

```powershell
npx eas-cli build --platform android --profile preview
```

Stop Metro, install the resulting APK on a supported phone, and complete the acceptance plan. No EAS build or physical AR test is implied by the presence of this configuration.

## Evidence and documentation

- [Setup, environment and Firebase](docs/SETUP.md)
- [Actual checks and acceptance matrix](docs/TEST_REPORT.md)
- [Phase log](docs/PROGRESS.md) and [decisions](docs/DECISIONS.md)
- [External actions](docs/NEEDS_USER_ACTION.md) and [next steps](docs/NEXT_STEPS.md)
- [Architecture and use cases](docs/ARCHITECTURE.md), [database](docs/DATABASE.md), [security](docs/SECURITY.md)
- [Use case diagram and specifications](docs/USE_CASES.md)
- [Physical AR test plan](docs/AR_TEST_PLAN.md) and [report](docs/AR_TEST_REPORT.md)
- [Release and demo](docs/RELEASE.md)
- [Five-member source handover](docs/FIVE_MEMBER_HANDOVER.md)
- [Original specification](ARTSPACE_AR_CODEX_FULL_BUILD.md)

The acceptance reports distinguish automated checks from device, cloud and independent APK checks. Do not present this project as FULLY_ACCEPTED until those gates have evidence.

