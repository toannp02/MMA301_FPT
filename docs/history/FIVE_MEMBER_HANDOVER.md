# Five-member source handover

One agent implemented this repository. These packages assign future maintenance/presentation responsibilities; they do not claim five people authored the initial code. Team members should record their actual subsequent contributions.

| Package | Source | Public entry points | Key tests | Open gates |
|---|---|---|---|---|
| M1 UI and navigation | app/**, src/ui/** | Screen scalar id/returnTo props, Page/Button/Input/ArtImage, theme tokens | tests/integration/guest.test.tsx; manual routes/keyboard/back | Device visual/accessibility QA |
| M2 AR engine | src/features/ar/** | ARViewerProps, ARArtworkInput, PlacementSnapshot, resolveARAsset, validateCapture | domain scale tests; AR_TEST_PLAN | All physical AR and native capture contents |
| M3 Firebase and storage | src/data/**, src/infra/**, firebase/**, scripts/** | Repository implementations, mapper functions, createFirebaseClient | tests/data/designs.test.ts, firebase/tests/rules.test.mjs | Real project/bucket/cloud flows |
| M4 domain and business logic | src/domain/**, src/features/auth/**, src/features/designs/**, src/features/useResource.ts | Contracts v1, authenticate, DesignUseCases.save/delete, filterArtworks/clampScale | tests/domain, tests/features, tests/data | Device workflow verification |
| M5 integration, QA and release | src/bootstrap/**, src/config/**, root configs, tests/**, docs/** | createRepositories, AppProviders/useApp, EAS development/preview | typecheck/lint/Jest/doctor/prebuild/export/rules | Native APK/device release and advisories |

## M1 walkthrough

Start at app/_layout.tsx: root provider, safe areas and Stack. Tabs expose Gallery, Favorites, Saved and Profile; remaining routes adapt IDs or auth returnTo. GalleryScreen loads abstract repositories, filters in memory and renders a two-column collection. Detail connects the guest AR CTA and protected favorite action. AuthScreen validates form fields and returns capture drafts to their preview. DesignScreens implements save/retry/retake/detail/delete confirmation and explicit local/cloud labels. All screens use a shared warm background, charcoal text, terracotta controls and >=48dp buttons.

Modify src/ui/theme.ts for palette or shared styles. Keep SDK imports outside UI. Test no results, image failure, invalid IDs, slow loads, missing local file and long names. Recommended improvement after visual review: richer favorite titles/thumbnails and responsive large-screen column widths. Demo: show browse/search/filter, artwork dimensions, guest entry and consistent error states. No UI screenshot in this repo is claimed as runtime evidence.

## M2 walkthrough

ARScreen resolves repository catalogue images before passing props; ARViewer itself accepts only AR inputs and callbacks. ARViewer checks Android camera/ARCore, manages overlay/capture state and mounts native navigator. ARScene forwards scene anchor callbacks to the selector ref and renders a single ViroImage in anchor-local coordinates, offset outward 8mm. Scale conversion is cm /100 times clamped factor. Reset calls selector.reset; switching changes native image key and metadata while keeping the navigator. Native screenshot is validated for a usable local file, then returns immutable placement metadata to the UI.

Study installed Viro declarations before changing native props; never invent APIs or replace placement with a camera overlay. Run all physical cases with model/OS evidence. Known risks: upright rotation relative to detected anchor, wall texture/lighting, screenshot camera contents and scene teardown remain unverified. Recommended first modification is any device-proven orientation/capture correction. Demo talking point: native plane tracking versus approximate dimension preview, no cross-session anchors.

## M3 walkthrough

Firebase initialization lives in infra; AsyncStorage auth persistence is the real SDK RN adapter. FirebaseAuthRepository creates/repairs profile data, maps timestamps and handles auth/profile races. Artwork list explicitly filters published records. Favorites use UID paths and an idempotent add transaction. Cloud metadata stores an owner-scoped Storage path; URLs are resolved on read and kept only in memory. LocalSavedDesignRepository serializes metadata changes and validates persisted records; LocalCaptureStorage copies screenshot bytes to app documents. A missing cloud image preserves metadata so deletion retry remains possible.

Run emulator tests with Java >=21 and project demo-artspace-ar. Seed uses trusted Admin ADC externally, never client credentials. Known issues: no real Firebase verification, bearer download URL semantics, process-death orphan cleanup is not durable. Recommended production change: authenticated image caching and durable orphan reconciliation. Demo: explain Firestore rules are not filters, A/B isolation, local mode versus cloud sync.

## M4 walkthrough

Read domain/models.ts and repositories/index.ts as contracts v1. Models keep ISO dates, source/storage/frame enums and Result errors; no React/Firebase imports. Validators reject unsafe IDs, invalid dimensions and credentials and provide pure search/scale math. authenticate validates before touching a repository. DesignUseCases checks UUID replay, serializes concurrent saves by UID/ID, persists image before metadata and compensates failure. Delete retains metadata until file deletion succeeds. useResource integrates abstract asynchronous reads with focus/account lifecycle and ignores late responses.

When changing a contract, update all adapters, UI, tests and an ADR together. Add failure-first tests around new lifecycle changes. Known limit: in-flight deduplication is process-local; it is not a distributed transaction. Demo: use the rollback/retry tests to explain lifecycle consistency.

## M5 walkthrough

createRepositories is the only mode-selection point: configured Firebase or honest unavailable-account/demo catalogue; cloud photos require both enable and verified flags. AppProviders owns auth observer cleanup and capture draft across login. app.config.ts is the sole Expo config; EAS preview specifies APK. TS strict, ESLint, Jest Expo, rules emulator and evidence logs support repeatable checks. README/SETUP are the onboarding path.

Do not mark acceptance complete from JavaScript export or emulator success. Resolve native build, install a standalone APK and run Metro-off smoke tests. Keep secrets and private videos out of Git. Recommended next work: CI with JDK21 rules tests, dependency advisory remediation and approved physical test artifacts. Demo: display the four gates with actual evidence and clearly open blockers.

## iPhone companion maintenance

M1 shares screens through thin routes and the explicit runtime capability flag. M2 remains native-only; the Expo Go AR route shows availability and never imports the AR engine. M5 maintains apps/iphone-expo-go, its isolated SDK58 lockfile/Metro resolver, CI typecheck/doctor and scripts/check-expo-go.mjs. See EXPO_GO_IPHONE.md. This is a maintenance map, not a development split. Physical iPhone acceptance remains open.

## Personal artwork maintenance

M1 owns import screen/routes and native/web/Expo Go capability labels; M2 consumes durable imported image URIs in the existing AR flow; M3 maintains PersonalArtworkRepository, PersonalImageStore and combined local/cloud Saved metadata; M4 owns validation and capture storage routing; M5 maintains SDK-matched picker/manipulator locks and full native build/verification. This remains a handover map, not delegated implementation. See IMPORT_ARTWORK.md for limits and actual test evidence.
