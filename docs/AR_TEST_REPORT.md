# AR test report

Date: 2026-10-27 (Asia/Saigon). **AR_DEVICE_UNVERIFIED / UNVERIFIED_PHYSICAL_DEVICE**.

- Device model / Android / ARCore version: unavailable.
- `adb devices` using installed Android SDK: command succeeded; device list empty.
- Vertical plane detection / tap placement / orientation / wall locking / scale on physical reference / reposition / texture switching: UNVERIFIED.
- Native screenshot file camera + virtual artwork contents: **UNVERIFIED**, no CAPTURE_PASS.
- Ten open/close cycles, low light/white wall, unsupported hardware, permission denial on phone, performance and native crash checks: UNVERIFIED.
- Pure dimension/scale/path validation: automated tests pass; this is not AR physical evidence.
- Android prebuild and Android Hermes export: pass; this is not AR physical evidence.

Run AR_TEST_PLAN.md on a supported phone and fill real evidence before changing this status. No generated artwork asset is an app screenshot or test evidence.

## User-reported placement failure — 2026-10-27

User tested on an Android phone and reported that the camera opens but artwork cannot be placed. Record this as USER_REPORTED_FAIL for placement; model, Android/ARCore version, APK identity, recording and logcat were not supplied. Local adb lists no connected device, so this was not reproduced physically by the agent.

Source audit found the pinned selector omits native Vertical alignment despite filtering wall anchors in JavaScript. Added an application-level compatibility selector and automated tests using the real selector implementation. Also fixed touch interception by instruction overlays and native texture completion success handling. Details and actual automated evidence: AR_FLOW_REPAIR.md. The repair requires a retest using the newly packaged APK; AR_DEVICE_UNVERIFIED remains open until that retest succeeds.
