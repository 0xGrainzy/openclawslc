/**
 * Admin access key manager.
 * Stores a bcrypt-hashed key in admin-key.json at the project root.
 * The plaintext key is only ever shown once (on generation or rotation).
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const KEY_FILE = path.join(process.cwd(), "admin-key.json");
const BCRYPT_ROUNDS = 12;

interface KeyStore {
  hash: string;
  created: string;
  rotated: string | null;
}

function readStore(): KeyStore | null {
  try {
    const raw = fs.readFileSync(KEY_FILE, "utf-8");
    return JSON.parse(raw) as KeyStore;
  } catch {
    return null;
  }
}

function writeStore(store: KeyStore) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(store, null, 2), "utf-8");
}

/**
 * Initialise the key store if it doesn't exist.
 * Returns the plaintext key ONLY on first creation; otherwise returns null.
 */
export async function initAdminKey(): Promise<string | null> {
  if (readStore()) return null; // already exists

  const plaintext = crypto.randomBytes(20).toString("base64url"); // ~27 chars, URL-safe
  const hash = await bcrypt.hash(plaintext, BCRYPT_ROUNDS);
  writeStore({ hash, created: new Date().toISOString(), rotated: null });
  return plaintext;
}

/**
 * Rotate the admin key. Returns the new plaintext key.
 * Caller must be authenticated before calling this.
 */
export async function rotateAdminKey(): Promise<string> {
  const plaintext = crypto.randomBytes(20).toString("base64url");
  const hash = await bcrypt.hash(plaintext, BCRYPT_ROUNDS);
  const existing = readStore();
  writeStore({
    hash,
    created: existing?.created ?? new Date().toISOString(),
    rotated: new Date().toISOString(),
  });
  return plaintext;
}

/**
 * Verify a candidate plaintext key against the stored hash.
 */
export async function verifyAdminKey(candidate: string): Promise<boolean> {
  const store = readStore();
  if (!store) return false;
  return bcrypt.compare(candidate, store.hash);
}

/**
 * Return key metadata (no hash, no plaintext).
 */
export function getAdminKeyMeta(): { created: string; rotated: string | null } | null {
  const store = readStore();
  if (!store) return null;
  return { created: store.created, rotated: store.rotated };
}
