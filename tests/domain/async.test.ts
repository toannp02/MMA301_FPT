import { withTimeout } from "../../src/domain/async";
test("bounded native/read requests time out without reporting success", async () => {
  jest.useFakeTimers();
  const pending = withTimeout(new Promise<never>(() => undefined), 1000);
  const assertion = expect(pending).rejects.toThrow(/too long/);
  jest.advanceTimersByTime(1000);
  await assertion;
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});
test("successful bounded request clears its timer", async () => {
  jest.useFakeTimers();
  expect(await withTimeout(Promise.resolve("value"), 1000)).toBe("value");
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});
