import { readFileSync } from "node:fs";
const xml = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
const permissions = xml.match(/<uses-permission\b[^>]*>/g) ?? [];
const camera = permissions.find((node) =>
  /android:name="android\.permission\.CAMERA"/.test(node),
);
if (!camera || /tools:node="remove"/.test(camera)) {
  throw new Error(
    "Room photography requires CAMERA in the generated Android manifest. A photo-picker plugin must not remove it.",
  );
}
console.log(
  "PASS: generated Android manifest retains CAMERA for room photography.",
);

const microphone = permissions.find(
  (node) =>
    /android:name="android\.permission\.RECORD_AUDIO"/.test(node) &&
    !/tools:node="remove"/.test(node),
);
if (microphone)
  throw new Error("Photo-only preview must not request microphone permission.");
console.log(
  "PASS: generated photo-studio manifest does not request microphone access.",
);

if (/com\.google\.ar|com\.viro/.test(xml))
  throw new Error("Retired AR metadata remains in the generated manifest.");
