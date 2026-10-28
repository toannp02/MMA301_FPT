> Current studio expansion supersedes the earlier temporary-photo-only scope below. See [PLACED_STUDIO.md](PLACED_STUDIO.md) for saved walls, perspective, multiple artworks, manual masks and export, plus explicit remaining parity gaps.

# ArtSpace direction inspired by Placed — 2026-10-27

User requested full functional direction matching Placed after the 2D Preview addition. This expands the original one-artwork Android MVP. Keep existing working features and ArtSpace identity while defining and implementing the new workflows; do not represent the completed 2D overlay as the finished Placed experience.

## Reference and scope evidence

Official reference: https://apps.apple.com/in/app/placed-art-on-your-walls/id6801124496 (accessed2026-10-27). The listing describes wall mapping using LiDAR/ARKit, corrected perspective and scale, lighting/colour adaptation, framing/shadows and occlusion. It also describes own-photo imports, artwork photography and size entry/recognition, collection browsing, layouts containing multiple pieces, sample interiors and discovery filters. These are reference product claims, not features verified in this repository. The listing does not establish that a single photo yields a complete navigable 3D reconstruction of a room; that interpretation must be checked separately.

## Functional workstreams

| Workflow | Current ArtSpace | Work required for the requested direction |
| --- | --- | --- |
| Art catalogue and own collection | Catalogue/search/category/detail, bounded local photo imports | Rich filters, capture artwork, crop/perspective tools, duplicate review, gallery-label dimensions |
| My spaces / walls | No reusable room/wall library | Capture/import room photos, name/manage spaces, record wall surfaces/calibration, reopen designs |
| Place art | Native Android one-plane/one-artwork flow; user-reported placement failure awaits retest | Reusable wall-scene editor, change art in place, perspective/real-size placement, device tracking evidence |
| Frame and visual rendering | Frame metadata limited; no photo-editor rendering | Frame/mount/canvas options, shadows and controlled brightness/colour; camera-light estimates require native evidence |
| Multi-art layouts | Outside original MVP | Pairs, rows, columns, grids and editable spacing, scale/centering based on calibrated wall dimensions |
| Save/share | Native capture/local saved designs; cloud gates unverified | Save editable space/design composition, reopen/revise, export actual composite and share |
| Native scanning / occlusion | Android Viro with physical gates open; iPhone Expo Go cannot run Viro | Platform-specific ARKit/ARCore scanning, supported depth/occlusion, real-device tests and signed native build |

## Device and distribution dependencies

Await the actual target phone model and availability of a Mac. iPhone native signing remains unavailable in the current session because the user confirmed no Apple Developer membership. EAS ad hoc/TestFlight distribution requires appropriate Apple signing; Xcode Personal Team is a separate limited local-testing option requiring a Mac. No account purchase or credential creation is authorized by this document.

Expo Go can run the completed live 2D overlay and can host photo editing/collection workflows using its bundled modules. It cannot provide native ARKit/LiDAR scanning merely by changing a JS library. Native scanning must use a development/standalone build and be tested on supported physical hardware. A photo with manually calibrated wall corners is perspective editing, not an automatically measured 3D scan.

## Actual completed step

2D Preview is implemented in the SDK58 iPhone companion: explicit camera permission, camera error retry, proportional screen-space drag/resize/reset, catalogue and personal-image sources, focus/background cleanup. Verification and limitations: EXPO_GO_IPHONE.md and PROGRESS.md. No persistent space model, full 3D reconstruction, multi-art editor, lighting/occlusion or full Placed parity is claimed complete.
