import { fail, ok, type UserProfile } from "../domain/models";
import type {
  AuthRepository,
  FavoriteRepository,
} from "../domain/repositories";
const setup = () =>
  fail(
    "setup-required",
    "Sign-in needs Firebase setup. You can still browse, try AR and save on this device.",
  );
export class UnavailableAuthRepository implements AuthRepository {
  async getCurrentUser() {
    return null;
  }
  async signIn() {
    return setup();
  }
  async signUp() {
    return setup();
  }
  async signOut() {
    return ok(undefined);
  }
  async updateProfile() {
    return setup();
  }
  observeAuth(callback: (user: UserProfile | null) => void) {
    callback(null);
    return () => undefined;
  }
}
export class UnavailableFavoriteRepository implements FavoriteRepository {
  async list() {
    return setup();
  }
  async add() {
    return setup();
  }
  async remove() {
    return setup();
  }
}
