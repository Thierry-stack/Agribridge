import bcrypt from "bcryptjs";

/** How strong the hash is — higher is slower but safer (10 is a common default). */
const SALT_ROUNDS = 10;

/** Turn a plain password into a one-way hash for storing in MongoDB. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Compare what the user typed with the stored hash. */
export async function verifyPassword(
  plain: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}
