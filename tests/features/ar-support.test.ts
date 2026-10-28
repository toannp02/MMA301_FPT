import { ensureARSupport } from "../../src/features/ar/arSupport";

test("temporary Android availability retries until supported", async () => {
  const check = jest
    .fn()
    .mockRejectedValueOnce(new Error("TRANSIENT"))
    .mockRejectedValueOnce(new Error("UNKNOWN"))
    .mockResolvedValue({ isARSupported: true });
  const pause = jest.fn(async () => undefined);
  await expect(ensureARSupport(check, pause)).resolves.toBeUndefined();
  expect(check).toHaveBeenCalledTimes(3);
  expect(pause).toHaveBeenCalledTimes(2);
});

test("unsupported devices do not retry or mount a camera", async () => {
  const check = jest.fn(async () => ({ isARSupported: false }));
  const pause = jest.fn(async () => undefined);
  await expect(ensureARSupport(check, pause)).rejects.toThrow("does not support");
  expect(check).toHaveBeenCalledTimes(1);
  expect(pause).not.toHaveBeenCalled();
});

test("pending Android availability stops with actionable error", async () => {
  const check = jest.fn().mockRejectedValue(new Error("TRANSIENT"));
  await expect(
    ensureARSupport(check, async () => undefined),
  ).rejects.toThrow("support check is still pending");
  expect(check).toHaveBeenCalledTimes(6);
});

test("unexpected native failures preserve the actual error", async () => {
  const check = jest.fn().mockRejectedValue(new Error("Native module missing"));
  await expect(ensureARSupport(check)).rejects.toThrow("Native module missing");
  expect(check).toHaveBeenCalledTimes(1);
});
