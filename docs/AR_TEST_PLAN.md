# Physical Android AR acceptance plan

Status: **AR_DEVICE_UNVERIFIED**. No supported physical Android device connected during implementation. Emulator UI tests cannot satisfy this plan.

Record tester/date, device model, Android version/API, Google Play Services for AR version, app build ID/commit, battery/network state, lighting and wall texture. Verify the device against the [official ARCore device list](https://developers.google.com/ar/devices). Use a native development client or preview APK, never Expo Go.

1. Fresh install: browse 12 artworks without sign-in. Search/filter, empty result, detail/back, invalid link.
2. Deny camera permission, then permanently deny. AR explains Settings/Back; Gallery/Favorites/Profile remain navigable. Grant in Settings and Retry.
3. On a device without ARCore support, verify support check and recovery message without mounting a failing navigator. Repeat with outdated/missing Google Play Services for AR and document actual behaviour.
4. Bright textured wall: move slowly, detect highlighted vertical plane, tap a location away from its center. Ensure one image appears at tap, upright, approximately 60×90cm, 8mm off wall with no obvious flicker.
5. Step sideways and back, rotate phone: image remains wall locked. Record video. Test plain white wall and dim room separately; capture tracking limitations and scanning help.
6. Resize down to 0.5× and up to 2×. Width and height scale together, limits enforce, verify approximate scale against a known physical reference (not a precision measurement claim).
7. Reset; tap another position. Remove/reacquire plane by moving away; selection should recover. Switch at least three artworks while keeping the same AR session and verify texture readiness before capture.
8. Capture. Inspect the actual file on the phone: readable image includes **real camera background and virtual artwork**. UI overlays need not appear. Native screenshot is not accepted based on API success alone.
9. Preview/Retake/save locally; restart app, open saved image and metadata, delete with confirmation, confirm file and metadata cleanup. Test a missing image and low disk conditions if possible.
10. With configured Firebase, capture as guest, attempt cloud save, sign in, ensure same draft survives. Verify account isolation, offline upload, rules rejection, upload-success/metadata-failure and interrupted delete. Local-only mode must never create cloud metadata with file:// URI.
11. Open/close AR ten times; repeat gallery→AR→capture→save, foreground/background and Android back. Record crashes, memory observations, launch time, texture delays and logcat. No Firestore writes should occur per tracking frame.
12. Preview APK: stop Metro, install, launch all tabs and full AR/capture/save flow. Record SHA256, APK path, install output, device video and logcat.

Store evidence outside Git if it contains private camera footage. Add approved public evidence links, not fabricated screenshots, to AR_TEST_REPORT.md. Any failed screenshot contents blocks CAPTURE_PASS and saved-design physical acceptance.

## Personal artwork device checks

On the newly built native app (not the original MVP APK), select a JPEG/PNG and an iPhone HEIC if available; cancel the picker; reject permission if the OS asks; test corrupt/oversized/very wide images and quota. Confirm portrait/landscape/EXIF orientation and displayed locked dimensions. Restart app and confirm imported image persists. Place the imported image on a real wall, switch catalogue↔custom repeatedly, resize/reset/capture and inspect camera+art output. Save custom capture locally while cloud mode is configured and as guest; verify no upload. Remove source with confirmation and confirm saved screenshots remain viewable while retake reports source unavailable. Clearing app data is destructive; do this only on a disposable installation. These physical checks are not yet executed.
