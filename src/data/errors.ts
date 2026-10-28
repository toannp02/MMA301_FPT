import { fail, ok, type Result } from "../domain/models";
export function normalizeError(e: unknown): Result<never> {
  const code =
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    e.name === "QuotaExceededError"
      ? "import-storage-full"
      : typeof e === "object" && e !== null && "code" in e
        ? String(e.code)
        : "operation-failed";
  const messages: Record<string, string> = {
    "import-duplicate":
      "This image is already in My artworks. Use the existing artwork or explicitly import another copy.",
    "space-conflict":
      "This space changed in another editor. Reopen it before saving.",
    "space-limit": "You can save up to 20 spaces on this device.",
    "space-invalid": "Check the space name, wall corners and artwork sizes.",
    "import-limit":
      "You can keep up to 10 imported artworks. Remove one before importing another.",
    "import-storage-full":
      "Device storage is full. Free some space and retry. Existing saved data has been kept.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use":
      "This email is already registered. Try signing in.",
    "auth/weak-password": "Choose a stronger password.",
    "auth/too-many-requests": "Too many attempts. Please wait and retry.",
    "auth/network-request-failed": "Check your connection and retry.",
    "permission-denied": "Access denied. Check your account and project rules.",
    "storage/unauthorized": "Image access denied. Check Storage rules.",
    unavailable: "Service unavailable. Check your connection and retry.",
    "invalid-data": "Stored data could not be read safely.",
  };
  return fail(
    code,
    messages[code] ?? "Could not complete this operation. Please retry.",
    true,
  );
}
export async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e: unknown) {
    return normalizeError(e);
  }
}
export function unwrap<T>(r: Result<T>): T {
  if (!r.ok)
    throw Object.assign(new Error(r.error.message), { code: r.error.code });
  return r.data;
}
