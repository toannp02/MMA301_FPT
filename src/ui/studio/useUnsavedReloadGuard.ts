import { useEffect } from "react";
import { Platform } from "react-native";

/** React Native exposes `window` too, without browser event methods. */
export function useUnsavedReloadGuard(dirty: boolean) {
  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      !dirty ||
      typeof window === "undefined" ||
      typeof window.addEventListener !== "function" ||
      typeof window.removeEventListener !== "function"
    )
      return;

    const target = window;
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    target.addEventListener("beforeunload", prevent);
    return () => target.removeEventListener("beforeunload", prevent);
  }, [dirty]);
}
