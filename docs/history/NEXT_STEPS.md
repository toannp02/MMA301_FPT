# Immediate continuation: View on room APK

LATEST: style/sizes/zoom supersedes the text-only repair. Query `npx eas-cli@26.0.0 workflow:view 01a17e3e-9f2e-7260-841e-e96fbcee7c8b --json` and use its repack_preview build ID. Prior bd8d036d is canceled. Current131-file snapshot: evidence/style-runtime-source-manifest.json, SHA2560bfaa0ad841948db39ac29d76302a6309677a817de097fa71c4a68bd10bd9f9d. Read current PROGRESS.md/STYLE_ZOOM.md first. Do not submit another candidate merely because this one is queued.

Superseding repair: read latest PROGRESS.md first. cff492fd was canceled due to native modal raw JSX whitespace. Current corrected source snapshot is evidence/native-text-runtime-source-manifest.json (128 files,0da1f6c62b5c1ba49165cadb89f4efb9ab3958408a3398b05e052187ed2ccc4a). Query replacement workflow with `npx eas-cli@26.0.0 workflow:view 01a17e33-b9bd-787f-8da5-fe46aded1ca9 --json`; use its repack_preview build ID for subsequent checks/download. Do not submit duplicate builds while queued. Instructions below referring to cff492fd are superseded.

Current Android source/runtime is frozen at128 files, SHA2568b43d5cde402585188e428321e8c97384adda54f64117aba744e01f85a841dd9; see evidence/view-room-runtime-source-manifest.json. Read latest PROGRESS.md for companion patch/check status. Full Placed/native3D parity is still incomplete; see PLACED_STUDIO.md.

1. Read PROGRESS.md and evidence/view-room-workflow-status.json. Query the existing candidate build with tested CLI26.0.0:

```powershell
npx eas-cli@26.0.0 build:view cff492fd-643f-4e12-a916-71d90e48f809 --json
```

2. Do not submit another build while it is queued. If FINISHED, download its actual APK URL to ignored artifacts/artspace-view-room.apk. If ERRORED, inspect this build's logs and fix the actual failure, then reverify changed code before replacement submission. Never claim a queued artifact exists. Native base15a939d0 is finished but lacks the new screenshot flow.
3. Verify signed APK against prior certificate, package, CAMERA/no microphone, embedded current studio markers and ARM AR libraries:

```powershell
./scripts/verify-studio-apk.ps1 -Apk artifacts/artspace-view-room.apk
```

4. Update RELEASE.md, PROGRESS.md and sanitized build evidence with the actual artifact link, bytes/hash and verification results. Confirm runtime hashes have not changed since upload. APK build/signature success does not establish real-device installation/camera/AR/share acceptance. No phone was attached. No background monitor was created.
5. Keep new native iOS scanning/automatic lighting/depth/OCR/artist services clearly NOT_IMPLEMENTED until real implementation and testing, not a missing-module wrapper. The native iOS/device toolchain is a separate workstream; never route Viro into Expo Go.

---

# Resume and next steps

1. Read the master spec, PROGRESS.md, DECISIONS.md, NEEDS_USER_ACTION.md and `git status`. Keep one agent; no module ownership restrictions.
2. `npm ci`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npx expo-doctor`, `npm run test:rules` with JDK >=21 on PATH. Logs under docs/evidence are real output from this implementation, not substitutes for reruns after changes.
3. Use the configured EAS project for packaging on this 8GB machine (local native compilation exceeded RAM). For a better-resourced local machine, regenerate with `npx expo prebuild --platform android`, run `npm run android` with authorised phone, then AR_TEST_PLAN.md. Verify wall orientation/tap position and screenshot camera contents first.
4. Configure a real Firebase Standard project, deploy reviewed prototype rules and seed sample data. Verify Auth persistence and all owner-isolation flows on real device; do not substitute mock validation for cloud acceptance.
5. Keep local photo storage unless billing/Storage is explicitly authorised and tested. If cloud enabled, test interrupted upload, rollback/retry, metadata deletion after image removed, and missing objects. Add durable reconciliation of orphaned images for production-scale usage.
6. Reuse the configured Expo project/remote Android credentials and final preview APK; install and test Metro off. Record APK SHA256/model/OS/log/video before marking release verified.
7. Review dependency advisories and choose compatible patched versions; do not silently downgrade Expo 57/Viro 3.0.3 or use force/legacy-peer-deps.
8. Complete UI visual QA on small/large Android screens, keyboard/back/accessibility and offline paths. Capture actual screenshots with approved content.

Deferred stretch goals (FR-19/20/21): custom artwork import, black/white frames, sharing. Add only after core device/capture gates pass. Current frame is none; the domain enum supports future implementation. Persistent world anchors, payments, VR and iOS remain out of MVP scope.

No background work is promised. In-memory unsaved draft survives login navigation, not operating-system process death. Local images survive app restart once committed, but this was verified with a repository recreation test rather than a phone relaunch. Complete the real restart check on hardware.

