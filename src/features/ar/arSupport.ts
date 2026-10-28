const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function ensureARSupport(
  check: () => Promise<{ isARSupported: boolean }>,
  pause: (milliseconds: number) => Promise<void> = wait,
): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const result = await check();
      if (!result.isARSupported)
        throw new Error(
          "This device does not support ARCore. You can continue browsing the gallery.",
        );
      return;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      // Android availability is asynchronous; the pinned Viro wrapper rejects
      // these temporary values rather than returning an unsupported boolean.
      if (message !== "TRANSIENT" && message !== "UNKNOWN") throw error;
      if (attempt === 5)
        throw new Error(
          "ARCore support check is still pending. Connect to the internet, update Google Play Services for AR, then retry.",
        );
      await pause(500);
    }
  }
}
