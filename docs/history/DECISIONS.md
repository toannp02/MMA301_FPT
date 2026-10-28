# ArtSpace AR decisions

- 2026-10-27: Single agent, Android only. Empty repository audited before scaffolding blank-typescript@sdk-57. Registry peers: Viro 3.0.3 requires Expo >=57 <58 and RN >=0.86 <0.87. Template resolves Expo 57.0.31, RN 0.86.3, React 19.2.3.
- Contracts v1 follow specification section 3; consolidated model/interface files preserve five logical modules.
- Default catalogue is bundled original procedural geometric artwork (CC0). No fake authentication. Missing Firebase configuration disables account actions with setup guidance.
- Default private saves are persistent local app files, including guest scope; account scopes remain separate. Cloud mode requires explicit configuration and verified-storage flag; no automatic billing/provisioning.
- Firestore adapter targets Standard default database as specified schema. No database provisioned; edition/project verification remains external.
- AR support is determined by native isARSupportedOnDevice, never brand inference. Native navigator mounted only on AR route after camera permission.

- Native release follow-up: EAS project created under the already authenticated personal Expo account (project 189b9e68-6e66-4aae-b46c-77d7ab9a588b); real remote Android signing keystore created by EAS. No billing configuration changed. Submitted build snapshot predates final read-timeout, responsive-grid and stricter-mapper refinements; current local ARM64 build uses final source.
- Local universal native attempt was intentionally interrupted after slow Windows cross-volume native copies; final config regenerated, ARM64-only release attempt uses 4GiB heap/1GiB metaspace. This changes local ABI packaging only, not Expo/RN/Viro dependency versions. EAS preview retains its normal ABI configuration.
- Firestore CLI project discovery found one generically named pre-existing project, with no ArtSpace target selected. It was not modified. Selecting/authorising the intended project remains an external action.
- Read/native calls have bounded waits; mutation workflows do not assume a timeout means a write was rolled back. Cancellation/cleanup constraints are documented.
- Useful Expo scaffold AGENTS guidance preserved, adapted to root app/ and npm required by master specification. Matching SDK57 docs and installed source/types checked; see https://docs.expo.dev/versions/v57.0.0/, https://viro-community.readme.io/docs/viroarplaneselector and https://docs.expo.dev/build-reference/apk/.

- Final auth race review: auth observer and registration can repair a missing profile concurrently. Profile creation now uses a rechecking Firestore transaction, preserving immutable createdAt. A real emulator test verifies concurrent create/repair and repeat no-op behaviour under rules.
- Favorites now optimistically toggle on detail and hide pending removals in the list, restoring prior UI state on repository failure. UID-keyed screen content prevents account-state carryover. Three additional render/integration tests verify both toggle directions and removal rollback.
- Current final checks: 48 Jest tests / 8 suites, seven Emulator groups, strict typecheck, clean lint, doctor and dependency check pass. Final fingerprint 285d3654ee24b6a734d230cfc3694da5c80daf7f matches native base build 2a3fc186-e2b3-4481-98dd-6b19481cf7ef; only matching-native repack is permitted. EAS repack uses version 0.10.4 and managed server signing, no local signing secrets.

## ADR — Restore the supported SDK instead of aliasing private RN modules

A later local dependency change installed Expo58.0.19 into the otherwise SDK57/RN0.86 application. Expo58's HMR code imports react-native/unstable-internals-do-not-use, absent from the installed RN0.86.3. Restore and exactly pin Expo57.0.31, retaining RN0.86.3 and Viro3.0.3. Never upgrade Expo alone to match a newer Expo Go application: Viro's declared Expo/RN peer bounds must remain satisfied. Both native-platform development bundles and the usual static/unit/dependency checks were actually rerun successfully.
# iPhone Expo Go companion — 2026-10-27

The user explicitly requested iPhone Expo Go support after the native SDK mismatch repair. Add an isolated SDK58/RN0.88 companion in apps/iphone-expo-go; retain the root SDK57/RN0.86/Viro3.0.3 native stack. Thin route wrappers share screens/domain/repositories; the local AR route shows availability information and never imports Viro. The explicit expoGoPreview flag changes shared capability labels without changing native defaults. Separate node_modules/lockfiles and a Metro resolver scope shared bare imports to SDK58 and reject the root dependency tree. No fake AR, native-module shim, force install or node_modules patch is used. Expo Go supports catalogue and configured account flows; native AR/capture remain external native-device gates.


## ADR — Device-local personal artwork

Explicit user request enables custom artwork(FR19) before the still-open physical MVP gates; this does not close those gates. Add a local namespace custom-<UUID> over the abstract catalogue, with a separate local image-store adapter and system image-picker/normalizer. Store native images under app documents, browser images as bounded JPEG data URIs. Lock height to width/source proportions rather than distorting the selected image. Shared local imports are installation-scoped, explicitly labeled and never public catalogue writes or remote favorites. Keep custom captures local even when catalogue captures use Firebase cloud storage; combined metadata/repository routing preserves guest/account scopes. Existing Firebase schemas/rules remain catalogue-only. Adding native picker/manipulator requires a full native rebuild, not old-native repack.
