> Current studio expansion supersedes the earlier temporary-photo-only scope below. See [PLACED_STUDIO.md](PLACED_STUDIO.md) for saved walls, perspective, multiple artworks, manual masks and export, plus explicit remaining parity gaps.

# Core artwork preview — 2026-10-27

The user supplied a short Placed demo and confirmed that personal artwork photos are the requested input. Video review showed a photographed room and a bottom artwork tray used to swap pieces. The user then made this the product's core, requested a dark interface and removal of unrelated controls. This supersedes the original gallery/account-first navigation scope, without claiming full Placed/3D parity.

## User flow

1. Open ArtSpace and tap **Preview your wall**, or choose an artwork and open its preview.
2. In the iPhone Expo Go companion, allow the camera. Tap **Capture room** to keep a still room photo as the background, or continue positioning art over the live camera.
3. Use **Discover** or **My artworks** in the bottom tray to change artwork. The current room photo, screen position and preview scale survive switching pieces.
4. Tap **Add your artwork** in the editor. Choose a photo or use **Take artwork photo** on a native device. The importer supplies a default title, keeps source proportions and offers editable dimensions. Tap **Use this artwork** to store/select it and return directly to the same room preview.
5. Drag, use Smaller/Larger, or Reset position. **Retake room** returns to the camera. Closing the preview ends this temporary room-photo session.

## Interface and scope

- Charcoal background/surfaces, warm gold primary action and high-contrast text. Shared theme and input appearance are dark; safe-area padding replaces unnecessary navigation headers. The mobile gallery grid measures available width so browser scrollbars do not collapse two columns.
- The account/profile/favorite tab bar and favorite controls on artwork details are removed from the primary experience. Account/data modules and historical direct routes remain in the source for compatibility; they are not entry points in the new UI. No user account records or existing captures were deleted.
- The core editor is the SDK58 companion's 2D camera/photo preview. Root SDK57 retains the native Android AR path. 2D placement does not map walls, correct wall perspective automatically, measure physical size, perform occlusion or reconstruct a room in 3D.
- Capturing a room produces a camera photo without the artwork overlay. It is a temporary background in the current editing session, not a saved composite or persistent scanned room. Artwork imports are stored persistently on-device under the existing limits; they are never automatically uploaded.
- Import/gallery native APIs use the already installed SDK-matched image picker/manipulator. No camera access is requested for the photo-library-only path. A camera-denial error offers Settings/library recovery. Original photos are not overwritten.

## Implementation

Shared screen: src/ui/screens/Preview2DScreen.tsx. SDK58 camera/capture boundary: apps/iphone-expo-go/src/Preview2DCameraScreen.tsx. Shared importer: src/ui/screens/ImportArtworkScreen.tsx and src/infra/pickArtworkImage.ts. Theme/navigation: src/ui/theme.ts, components.tsx and app layouts.

The editor remains mounted while the import modal is open; the camera is released and reopens only if needed. Catalogue refresh happens after returning from the modal/foreground, not per drag frame or per selection. Imported image sizing and capture errors have dedicated recoverable states. The bottom panel scrolls on smaller screens so primary camera content remains visible.

## Verification and remaining evidence

See PROGRESS.md and evidence/core-ui-* for actual checks. Automated tests use a simulated camera boundary to verify capture callback success/failure, photo retention, same-session art switching and import, scale/position continuity and retake. These are not physical camera tests. Browser QA covers the dark UI and the system file-picker/import workflow using a public project asset; no browser camera was opened. The test artwork named Core preview QA belongs only to the browser's local test data.

Physical iPhone camera permission, taking a room/artwork photo, orientation and lifecycle remain UNVERIFIED. Existing Android AR tracking/capture and cloud gates remain open. Root splash/interface native configuration changed to dark; any future APK must be built with the new native configuration rather than blindly using the previous native fingerprint. No new APK is delivered by this UI task.
