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
  async (os) => {
    jest.replaceProperty(Platform, "OS", os);
    eventMethods(undefined, undefined);
    expect(typeof window).toBe("object");
    const hook = await renderHook<void, { dirty: boolean }>(
      ({ dirty }) => useUnsavedReloadGuard(dirty),
      { initialProps: { dirty: false } },
    );
    await expect(hook.rerender({ dirty: true })).resolves.toBeUndefined();
    await expect(hook.unmount()).resolves.toBeUndefined();
  },
);

test("native runtimes skip listeners even if a library provides event shims", async () => {
  jest.replaceProperty(Platform, "OS", "ios");
  const add = jest.fn(),
    remove = jest.fn();
  eventMethods(add, remove);
  const hook = await renderHook(() => useUnsavedReloadGuard(true));
  await hook.unmount();
  expect(add).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
});

test("web protects dirty designs, cleans up on save and unmount, and prevents reload", async () => {
  jest.replaceProperty(Platform, "OS", "web");
  const add = jest.fn(),
    remove = jest.fn();
  eventMethods(add, remove);
  const hook = await renderHook<void, { dirty: boolean }>(
    ({ dirty }) => useUnsavedReloadGuard(dirty),
    { initialProps: { dirty: false } },
  );
  expect(add).not.toHaveBeenCalled();
  await hook.rerender({ dirty: true });
  const handler = add.mock.calls[0][1] as (event: BeforeUnloadEvent) => void;
  const event = { preventDefault: jest.fn(), returnValue: undefined };
  handler(event as unknown as BeforeUnloadEvent);
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  expect(event.returnValue).toBe("");
  await hook.rerender({ dirty: false });
  expect(remove).toHaveBeenCalledWith("beforeunload", handler);
  await hook.rerender({ dirty: true });
  const latest = add.mock.calls[1][1];
  await hook.unmount();
  expect(remove).toHaveBeenLastCalledWith("beforeunload", latest);
});

test("web without DOM event support fails gracefully", async () => {
  jest.replaceProperty(Platform, "OS", "web");
  eventMethods(undefined, undefined);
  const hook = await renderHook(() => useUnsavedReloadGuard(true));
  await expect(hook.unmount()).resolves.toBeUndefined();
});
