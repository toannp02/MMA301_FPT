import { authenticate } from "../../src/features/auth/authUseCases";
import { UnavailableAuthRepository } from "../../src/data/UnavailableAuthRepository";
test("invalid credentials never reach repository", async () => {
  const repo = new UnavailableAuthRepository();
  const signIn = jest.spyOn(repo, "signIn");
  expect(await authenticate(repo, "bad", "short")).toMatchObject({
    ok: false,
    error: { code: "validation" },
  });
  expect(signIn).not.toHaveBeenCalled();
});
test("unconfigured backend never fakes account success", async () => {
  expect(
    await authenticate(
      new UnavailableAuthRepository(),
      "a@example.com",
      "longpassword",
    ),
  ).toMatchObject({ ok: false, error: { code: "setup-required" } });
});
