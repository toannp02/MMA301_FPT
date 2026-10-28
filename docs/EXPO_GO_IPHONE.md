# iPhone preview with Expo Go

The iPhone companion uses Expo SDK58 with its own package-lock.json. The native Android/Viro project remains SDK57. Both share domain/repositories/studio screens; Metro routes bare package imports to the companion dependencies and rejects root node_modules. Expo Go must never import Viro.

## Start from Windows

At the repository root:

```powershell
npm ci
npm run setup:iphone
npm run start:iphone
```

Install SDK58-compatible Expo Go on the iPhone, connect phone/computer to the same Wi-Fi and scan the terminal QR with the iPhone Camera. No Apple Developer subscription or iOS build is needed for this photo-studio preview. The current server uses port8082 and LAN address exp://192.168.0.103:8082; use the address printed by Metro after a network change. Allow Node on the Windows private network if needed. A tunnel is an alternative, not verified here:

```powershell
cd apps/iphone-expo-go
npm start -- --tunnel
```

USB alone does not provide the Windows-to-iPhone Expo Go connection. Local imports/designs belong to each installation/browser and are not synchronized between Android, browser and iPhone.

## Current studio flow

Latest style/zoom controls: see STYLE_ZOOM.md. Style includes visual frame presets, Image adjustments and Light angle/softness/intensity/offset. Artwork dimensions accepts cm with optional proportional lock. Zoom room is view-only (1x to4x with panning), Zoom artwork resizes the selected piece; Reset view restores the full room. PNG export always includes the full room even while zoomed. Native pinch gestures and OS sharing still need phone retesting.

- Interiors -> Add your room -> Take a Photo / Choose from Photos. Then Artworks -> Discover / My artworks -> View on room automatically applies the art to the active room. With no active room, one saved room is automatic; several rooms show a picker. Original illustrated samples are also available.
- Review the locally suggested wall. Gold handles resize artwork; tap the wall to move it. Layouts offers eight arrangements. Style -> Image / Light adjusts luminance, contrast, saturation, tone and shadow intensity/offset; Occlusion can be toggled or replaced with manual painting. Existing designs change only on Save. Saved lists rooms containing art.
- Drag four wall corners, optionally enter measured dimensions, choose your own artwork or Discover, swipe on the picture, and arrange up to9 slots. Frame/mount/shadow/colour controls, original comparison and manual foreground masking are available. Search/filter controls stay collapsed below the editor thumbnails.
- Add artwork imports a library image or mobile camera photo into My artworks and returns to the same wall. Enter intended width; height preserves photo proportions. New imports warn about matching normalized-image fingerprints. Choose an existing artwork or explicitly approve another copy; no original photo is deleted.
- Save keeps an editable local wall with durable snapshots; up to20 walls and10 personal imports. Reopen from My walls. PNG export opens the native OS share sheet; the browser downloads PNG. Saving the editable wall and exporting the composite are separate actions.
- Artwork details also offer the live 2D camera route: permission, Capture room, Retake room, drag/resize and inline import. After capture, Edit & save this wall opens the persistent perspective studio. Errors, denied permissions and inactive camera lifecycle have recovery paths.

This is a photograph editor with optional manual calibration. Local colour/texture analysis suggests a wall, mild tone and a coarse foreground mask; it can be wrong and has manual overrides. It does not measure automatically, reconstruct a 3D room, sense depth or provide anchored AR. The full implemented/absent feature matrix is in PLACED_STUDIO.md. Native Android AR stays separate.

## Native camera boundaries and maintenance

The companion camera wrapper remains apps/iphone-expo-go/src/Preview2DCameraScreen.tsx using its SDK58 camera. Root native now has its own SDK57 src/ui/screens/Preview2DCameraScreen.tsx and route app/preview-2d/[id].tsx. These wrappers inject the camera into shared Preview2DScreen. SDK-managed camera, SVG, slider, sharing and view-shot packages are installed separately with matching versions; do not hoist SDKs, use force flags or add a file:../.. root dependency.

Configure optional Firebase using the root .env.example copied to apps/iphone-expo-go/.env.local. Restart Metro after edits; never commit that file. Keep cloud Storage disabled until its actual configuration/rules are verified. Wall spaces remain local regardless of catalogue backend.

## Checks and evidence

```powershell
npm run check:iphone
cd apps/iphone-expo-go
npm run doctor
npx expo install --check
cd ../..
node scripts/verify.mjs
node scripts/check-expo-go.mjs
```

The last command needs Metro8082. It verifies the iOS manifest, full bundle/map and launch URL, one SDK58 React/RN instance, no Viro/native AR sources, camera wrappers, studio screens, ViewOnRoomScreen, local photo assistance/mask/placement code and12 catalogue assets. Actual latest results are in PROGRESS.md and docs/evidence/. Historical timeout logs are retained.

Browser QA at390x844 covers saved sample walls, independent artwork slots, imports/duplicate review, masks/undo, calibrated perspective and PNG download. Actual iPhone camera permission/photo capture/gestures/lifecycle/OS sharing remain UNVERIFIED without a connected phone. Bundle checks and browser tests are not physical iPhone acceptance.
