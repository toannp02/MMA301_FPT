import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";
import { useUnsavedReloadGuard } from "../../src/ui/studio/useUnsavedReloadGuard";

const originalAdd = Object.getOwnPropertyDescriptor(window, "addEventListener");
const originalRemove = Object.getOwnPropertyDescriptor(
  window,
  "removeEventListener",
);
function eventMethods(add: unknown, remove: unknown) {
  Object.defineProperty(window, "addEventListener", {
    value: add,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "removeEventListener", {
    value: remove,
    configurable: true,
    writable: true,
  });
}
afterEach(() => {
  jest.restoreAllMocks();
  if (originalAdd)
    Object.defineProperty(window, "addEventListener", originalAdd);
  else Reflect.deleteProperty(window, "addEventListener");
  if (originalRemove)
    Object.defineProperty(window, "removeEventListener", originalRemove);
  else Reflect.deleteProperty(window, "removeEventListener");
});

test.each(["ios", "android"] as const)(
  "editing on %s never calls browser APIs on the native window",
  (os) => {
    jest.replaceProperty(Platform, "OS", os);
    eventMethods(undefined, undefined);
    expect(typeof window).toBe("object");
    const hook = renderHook<void, { dirty: boolean }>(
      ({ dirty }) => useUnsavedReloadGuard(dirty),
      { initialProps: { dirty: false } },
    );
    expect(() => hook.rerender({ dirty: true })).not.toThrow();
    expect(() => hook.unmount()).not.toThrow();
  },
);

test("native runtimes skip listeners even if a library provides event shims", () => {
  jest.replaceProperty(Platform, "OS", "ios");
  const add = jest.fn(),
    remove = jest.fn();
  eventMethods(add, remove);
  const hook = renderHook(() => useUnsavedReloadGuard(true));
  hook.unmount();
  expect(add).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
});

test("web protects dirty designs, cleans up on save and unmount, and prevents reload", () => {
  jest.replaceProperty(Platform, "OS", "web");
  const add = jest.fn(),
    remove = jest.fn();
  eventMethods(add, remove);
  const hook = renderHook<void, { dirty: boolean }>(
    ({ dirty }) => useUnsavedReloadGuard(dirty),
    { initialProps: { dirty: false } },
  );
  expect(add).not.toHaveBeenCalled();
  hook.rerender({ dirty: true });
  const handler = add.mock.calls[0][1] as (event: BeforeUnloadEvent) => void;
  const event = { preventDefault: jest.fn(), returnValue: undefined };
  handler(event as unknown as BeforeUnloadEvent);
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  expect(event.returnValue).toBe("");
  hook.rerender({ dirty: false });
  expect(remove).toHaveBeenCalledWith("beforeunload", handler);
  hook.rerender({ dirty: true });
  const latest = add.mock.calls[1][1];
  hook.unmount();
  expect(remove).toHaveBeenLastCalledWith("beforeunload", latest);
});

test("web without DOM event support fails gracefully", () => {
  jest.replaceProperty(Platform, "OS", "web");
  eventMethods(undefined, undefined);
  const hook = renderHook(() => useUnsavedReloadGuard(true));
  expect(() => hook.unmount()).not.toThrow();
});
