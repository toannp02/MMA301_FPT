# Import personal artwork

Open Gallery → **Import your artwork** → **Choose image**. Select a still image from the system photo picker (or image file in the browser), enter a title and intended width in centimetres, then **Save imported artwork**. Height is calculated from the original image proportions to avoid stretching. The detail screen opens immediately; imports also appear under the **My imports** gallery category.

Current core UI: imports appear under **My artworks**. Inside the Expo Go 2D editor, use **Add your artwork** → choose an image or **Take artwork photo** → **Use this artwork**. A default title is supplied. The new artwork is selected over the existing room photo without resetting preview placement/scale. Taking an artwork photo requests camera permission explicitly, with Settings recovery if denied. No microphone permission or broad library scan is requested. The native picker and 2D camera remain separate, and the live preview releases the camera while the importer is open. This supersedes the earlier library-only import description below.

On the native Android app, **View in AR** uses the imported image through the same vertical-plane placement, resize, reset, switching and capture flow as catalogue artwork. Expo Go/iPhone and web support importing and viewing, while their AR route explains the native requirement.

Imports are device-local and shared within this app installation, including its guest/account sessions. They are not published to Firestore, uploaded, synced across devices or added to cloud favorites. Custom AR captures also stay local, even with cloud mode enabled; Saved shows local captures for the current guest/account alongside eligible cloud catalogue captures. Sign-in does not migrate prior guest captures.

Limits: ten imported images per installation, title 2–60 characters, physical width/height >0 and ≤1000 cm. The picker accepts still images up to 30 MB/40 megapixels; the decoder must support their format. Images are normalized to JPEG, at most 2048 pixels on the longest side and 1 MB after processing. A larger result is rejected with an explanation; pick a smaller image. No crop is imposed. The original photo is not modified.

On Android/iOS, normalized bytes are copied from temporary cache into the app documents directory before metadata is committed. Web stores a bounded JPEG data URI with metadata in browser local storage; browser quota/private browsing policies can restrict persistence before the ten-image limit. Clear app data, uninstall, or clear site storage to lose these local imports. Only the selected image is accessed; no camera capture, microphone or broad media-library access is requested for importing.

Use **Manage imports** on a custom detail screen, or open **Import your artwork**, to view/remove imports. Removal requires an in-app confirmation. Deleting the source does not delete already-saved AR screenshots, but that source can no longer be used to retake a screenshot. Catalogue content cannot be deleted through this interface.

## Verification and native builds

- Automated tests cover durable metadata, dimensions, invalid/oversized input, concurrent imports, limits, corrupt records, file cleanup after failed metadata writes, removal retry, picker cancellation/error and UI save/navigation.
- Local/custom capture tests verify persistence and that custom saves/deletes never use cloud capture storage or cloud metadata writes. Guest local captures remain readable in cloud mode.
- Actual browser smoke: selected a project PNG with the file chooser, decoded/normalized it, saved as Imported Indigo at 80×120 cm, reloaded the detail URL, confirmed persistence, canceled removal and then removed that test import. No console errors observed. Screenshots are in artifacts/imported-artwork-web.png and import-artwork-management.png.
- Native Android prebuild and Hermes export pass. Root strict TypeScript/lint/67 tests/Doctor21 pass; companion typecheck/Doctor20 and iOS bundle isolation/12 bundled artwork requests pass. The first iOS request was interrupted while restarting stale Metro; the fresh-server retry passed.
- Real Android/iPhone photo-picker permissions, HEIC/rotation handling, native persistence after restart, and custom-image AR placement/capture still require physical testing. Browser and automated passes do not close AR_DEVICE_UNVERIFIED.

ImagePicker and ImageManipulator add native dependencies. The previously distributed MVP APK does not contain this feature. A full new native build is required; the pinned old-native repack workflow must not be used. For development, rebuild the client, then run npm start. For an independent APK use `npx eas-cli@26.0.0 build --platform android --profile preview`. See RELEASE.md for actual build status.
