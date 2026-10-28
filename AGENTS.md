# ArtSpace AR

Read ARTSPACE_AR_CODEX_FULL_BUILD.md and docs/PROGRESS.md before work. One agent owns all modules; no delegation or file ownership restrictions. Strict TypeScript; domain/features/UI do not import Firebase. Run typecheck, lint, tests after changes. Record real results; hardware/cloud/release require evidence. Never use Expo Go for AR or hide dependency conflicts with force flags. Never commit credentials, private captures, native build outputs or node_modules.

## Expo guidance (preserved from generated starter)

- User-authorized iPhone Expo Go support lives in apps/iphone-expo-go on SDK58 with its own lockfile. Root native/Viro remains SDK57. Read docs/EXPO_GO_IPHONE.md before changing shared imports or Metro resolution. Expo Go must never import Viro or claim AR capture support. Verify both packages after shared screen changes.

- Prioritise mobile patterns and performance. Verify the installed Expo major in package.json and use matching versioned documentation (currently https://docs.expo.dev/versions/v57.0.0/); do not assume remembered APIs remain valid. The documentation index is https://docs.expo.dev/llms.txt.
- Use `npx expo install` for SDK-managed native packages and `npx expo install --check` / `npx expo-doctor` to check compatibility. npm and package-lock.json are required by this project's specification.
- Use Expo Router; this specification intentionally uses root app/ routes (rather than the generated starter's optional src/app/). Keep non-route code outside app/. Import router, Link and useLocalSearchParams from expo-router.
- Generate native directories through Expo prebuild/Continuous Native Generation; configure native behaviour in app.config.ts and plugins, not ad-hoc changes to ignored native files.
- Native modules need development builds. EAS development and standalone preview profiles serve different purposes. Use the project-tested EAS CLI version in release documentation; no submission/OTA update is authorised implicitly by a build request.
- Prefer Expo modules where appropriate. Run lint and strict typecheck before declaring code ready. Read installed types/source and matching documentation when uncertain.
