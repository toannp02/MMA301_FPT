# ArtSpace — photo wall studio

One Expo SDK58 application for iPhone, Android and web. Native AR/Viro was removed at the user's request. The app photographs/imports a room, places catalogue or personal artwork onto the wall, edits perspective/size/frame/light, and saves editable rooms or exports PNG. The visual depth is a photo effect; it is not AR or room scanning.

## Run

Use Node22 and npm from this folder:

```powershell
npm ci
npm start
```

Scan the QR with Expo Go compatible with SDK58. Phone and computer must share a Wi-Fi network. Metro uses port8082. Press `w` for web, or use `npm run web`. There is one package.json, one package-lock.json and no companion setup. Expo Go still needs the development server; it is not a standalone iPhone download.

## Main flow

1. Interiors → Add your room → Take a Photo / Choose from Photos.
2. Artworks → Discover / My artworks → View on room.
3. Tap a painting to enable editing. Tap it again or tap the background to disable editing. Drag selected artwork; pinch artwork to resize, or pinch the background to zoom the room. No zoom-mode switches.
4. Style edits frame, colour, shadow and visual thickness. Enter artwork width/height in cm and review wall calibration for real scale.
5. Save keeps an editable room locally. Export PNG includes the full room even while zoomed.

Original photos are not modified or uploaded. Rooms and imports remain device-local; there are no accounts, favorites, Firebase services, duplicate live-camera editor or AR capture routes. Existing room/import data keys are retained. Expo Go sandbox continuity across the former companion/root app identity needs phone retesting; browser persistence alone does not establish iPhone migration.

## Review and team handover

- [Architecture and source map](docs/ARCHITECTURE.md)
- [Five-member handover](docs/FIVE_MEMBER_HANDOVER.md)
- [Actual progress and verification history](docs/PROGRESS.md)
- [Current packaging limits](docs/RELEASE.md)

Routes in `app/` only pass scalar IDs to screens. `src/domain` contains contracts, `src/features/studio` contains pure geometry/rendering, `src/data` contains local repositories/catalogue, and `src/infra` handles native/web image I/O. Editor controls and gestures live in `src/ui/studio`. Do not move business logic into route files.

```powershell
npm run verify
npm run check:bundle  # requires npm start on8082
```

The bundle check verifies SDK58, one React/RN instance, core routes,12 catalogue images and absence of old AR/companion code. Camera, native pinch/filter fidelity and OS sharing require actual phone testing. Historical guides and pre-SDK58 evidence are under `docs/history` and `docs/evidence`; they do not describe the current runtime. Migration backups are ignored under `artifacts/` and are never app modules or review deliverables.
