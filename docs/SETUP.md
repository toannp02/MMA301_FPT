# Setup

## Toolchain

Use Node >=22.13 (tested 22.22.2), npm (tested 10.9.7), Android Studio with Android SDK/NDK and JDK compatible with the generated Gradle/AGP version. JDK 17 is installed here; Android Studio also supplies JBR 25. Firebase emulator CLI 15 requires Java >=21. On this machine prepend the bundled JBR for rules tests:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
npm run test:rules
```

The emulator project ID is `demo-artspace-ar`; it never connects to paid cloud services. Ports 8188 and 9299 avoid an existing unrelated process on 8080. Do not stop another project's emulator to free a port.

## Install and native development

```powershell
npm ci
npx expo install --check
npx expo-doctor
npm run typecheck
npm run lint
npm test -- --runInBand
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
npx expo prebuild --platform android
npm run android
npm start
```

Enable USB debugging and authorise your computer on an ARCore-supported phone. `adb devices` must list it. Generated android/ios directories are ignored; app.config.ts and config plugins are the source of truth. Camera requested only when entering AR. No microphone or gallery access is required for private captures. Android camera and ARCore support are checked before mounting the navigator. Open Settings and Retry recover denied permission.

## Firebase account services

1. Select an existing Firebase project you control. Verify its database edition/location before provisioning anything; this adapter uses Standard Firestore default database document APIs. No instance has been created here.
2. Register a Web App for Firebase JS SDK configuration, enable Email/Password Authentication, create/select Firestore, and review the supplied prototype rules.
3. Copy `.env.example` to `.env.local`; fill public Web App config values. Restart Metro after changes. Never place an Admin credential in EXPO_PUBLIC variables.
4. Deploy only reviewed rules/indexes against your explicit project:

```powershell
npx firebase deploy --project YOUR_PROJECT_ID --only firestore:rules,firestore:indexes
```

5. Add categories/artworks via Console or seed script. Mobile clients cannot publish catalogue records; list uses `where('status', '==', 'published')`.
6. Test register/login/restart/logout/profile, account A/B isolation and offline retries on a device.

Auth persistence uses Firebase's installed React Native persistence adapter with AsyncStorage. auth-native.d.ts adds only the RN function signature omitted by the public Firebase typings; Metro uses the real installed RN runtime. No handwritten token/password storage exists.

## Storage modes

Default local mode copies screenshots to persistent app document files and persists UID-scoped JSON metadata in AsyncStorage. Guest scope is `guest`; signing in selects that account's scope. Guest designs remain accessible after signing out, on the same installation. They are not migrated to cloud or another account. Uninstall/clear app data removes them. No media-library permission is requested.

Cloud requires an existing authorised Storage bucket and billing where required. Do not activate billing without owner approval. Deploy Storage rules, perform real upload/read/delete and account-isolation tests, then set both `EXPO_PUBLIC_ENABLE_CLOUD_STORAGE=true` and `EXPO_PUBLIC_CLOUD_STORAGE_VERIFIED=true` in your environment. The second flag is operator attestation, not an automated claim. A release must use the same verified configuration. Local files are never stored in Firestore metadata.

Admin seed requires trusted Application Default Credentials configured outside the app/repo:

```powershell
$env:ARTSPACE_PROJECT_ID='YOUR_PROJECT_ID'
$env:ARTSPACE_BUCKET='YOUR_BUCKET'
node scripts/seed-artworks.mjs
```

This uploads only the included CC0 art and writes categories/published metadata. Review target project before running; it overwrites those twelve sample IDs. No seed was executed against cloud during development.

## Troubleshooting: missing react-native/unstable-internals-do-not-use

This error occurs in this project if Expo58 is installed while React Native and other Expo modules remain on the supported SDK57 stack. Current pinned versions are Expo57.0.31, RN0.86.3 and Viro3.0.3. Restore dependencies from the project lockfile with npm ci, then stop an old Metro terminal and run:

```powershell
npx expo start --dev-client --clear
```

Do not add an alias for React Native private internals or edit node_modules to hide the mismatch. Do not upgrade just Expo to fit the SDK version in Expo Go. This Viro application requires a native development build. For Android, install a development client built using the existing EAS project:

```powershell
npx eas-cli@26.0.0 build --platform android --profile development
```

The standalone preview APK can be used without Metro. Expo Go on a physical iPhone with SDK58 cannot run this SDK57/Viro application; a successful iOS JavaScript bundle does not establish native iOS/AR support (Android is the project MVP).

