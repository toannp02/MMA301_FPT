import type { AuthRepository } from "../../domain/repositories";
import { fail } from "../../domain/models";
import { cleanName, validateCredentials } from "../../domain/validators";
export async function authenticate(
  repo: AuthRepository,
  email: string,
  password: string,
  name?: string,
) {
  const error = validateCredentials(email, password, name);
  if (error) return fail("validation", error);
  return name === undefined
    ? repo.signIn(email.trim(), password)
    : repo.signUp(email.trim(), password, cleanName(name));
}
