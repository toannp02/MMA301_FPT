# Five-member handover — current photo studio

This is a review/maintenance split for five people, not a claim that five people authored the existing implementation. There are no file ownership restrictions; coordinate contract changes in review. All five use the same root SDK58 package and npm lockfile.

| Member | Scope | Start reading | Review task | Validation |
|---|---|---|---|---|
| M1 — product UI/navigation | `app/`, `src/ui/screens/`, `components.tsx`, `theme.ts` | `app/index.tsx` → `GalleryScreen` → `SpacesScreen` → `ViewOnRoomScreen` | Trace collection → room → editor; simplify labels/navigation without moving business logic into routes | `tests/integration/photo-studio`, `gallery-image-retry`, `view-on-room-flow` |
| M2 — editor and visual effects | `src/ui/studio/`, `src/features/studio/` | `useDirectManipulation`, `directManipulation`, `geometry`, `rendering`, `ArtworkStylePanel` | Verify select/deselect/pinch ownership, frame/depth/shadow consistency and full-room PNG while zoomed | `tests/features/studio`, `style-editing`, `direct-hit-depth`; `tests/integration/direct-manipulation` |
| M3 — local data and image I/O | `src/data/`, `src/infra/` | `WallSpaceRepository`, `PersonalArtworkRepository`, `KeyValueStore`, image adapters | Explain conflict/rollback/quota handling; check import/remove/reopen and immutable design snapshots | `tests/data/*`; `tests/integration/import-artwork` |
| M4 — contracts and pure rules | `src/domain/`, shared `src/features/useResource.ts` | `models`, `spaces`, `repositories`, `customArtworks`, `async` | Review bounds, optional-field backward compatibility, stale async responses and errors; coordinate schema changes with M2/M3 | domain tests; repository validation tests; photo-assist/discovery tests |
| M5 — platform, QA and release | `src/bootstrap/`, root config, scripts, CI, docs | `repositories.ts`, `AppProviders`, `app.config.ts`, `package.json`, `metro.config.js` | Reproduce clean install/start; inspect one-runtime bundle; collect real iPhone/Android evidence | `npm run verify`, `npm run check:bundle`, Android/iOS exports; physical device checklist |

## Shared interfaces

- M1 screens accept IDs; `AppProviders` exposes `repositories`, `activeRoomId`, `setActiveRoomId`.
- M3 supplies only `artworks`, `customArtworks`, `spaces`; catalogue and personal images share `ArtworkRepository`.
- M4 owns the `Artwork`, `WallSpace`, `ArtAppearance`, `Result` and repository contracts. Avoid breaking existing version1 room/import records.
- M2 exports pure geometry/rendering and controlled UI components. `SpaceEditorScreen` integrates those components and delegates I/O to M3.
- M5 changes SDK/config/lockfile together. Do not restore native AR, old companion imports or pinned SDK57 repack workflows.

## Review protocol

Each member should explain their input/output contracts, one happy path and one failure path, then run the relevant tests plus `npm run typecheck` and `npm run lint`. A contract/SDK change needs full `npm run verify`; a route or native import change also needs the bundle check. Record actual new contributions and test evidence in PROGRESS.md.

M5 collects model/OS, camera permission/capture, two-finger gestures, SVG colour/depth appearance, save/reopen and OS PNG share results on real phones. Automated/browser passes do not establish physical device acceptance. The old AR team map is under `docs/history` and is superseded.
