import "server-only";
import { hash, verify } from "@node-rs/argon2";

// Argon2id with OWASP-recommended minimums (19 MiB memory, 2 iterations, 1 lane).
const options = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string) {
  return hash(password, options);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}

// A real hash of a random password. Login verifies against it when the email
// does not exist, so both paths take the same time and do not reveal which emails are registered.
let dummyHash: Promise<string> | undefined;
export function getDummyHash() {
  dummyHash ??= hashPassword(crypto.randomUUID());
  return dummyHash;
}
