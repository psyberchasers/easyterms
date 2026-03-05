import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION_PREFIX = "v1:";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be set as a 64-character hex string (32 bytes)"
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns "v1:<base64(iv + authTag + ciphertext)>"
 */
export function encryptText(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack iv (12) + authTag (16) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return VERSION_PREFIX + packed.toString("base64");
}

/**
 * Decrypt a value produced by encryptText.
 * Expects "v1:<base64(iv + authTag + ciphertext)>"
 */
export function decryptText(encrypted: string): string {
  if (!encrypted.startsWith(VERSION_PREFIX)) {
    throw new Error("Unknown encryption format");
  }

  const key = getKey();
  const packed = Buffer.from(encrypted.slice(VERSION_PREFIX.length), "base64");

  const MIN_LENGTH = IV_LENGTH + AUTH_TAG_LENGTH + 1; // iv + tag + at least 1 byte
  if (packed.length < MIN_LENGTH) {
    throw new Error("Malformed ciphertext: too short");
  }

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Returns true if the value looks like it was encrypted by encryptText.
 * Checks both the prefix and minimum length to avoid false positives
 * from user-supplied text that happens to start with "v1:".
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (typeof value !== "string" || !value.startsWith(VERSION_PREFIX)) {
    return false;
  }
  // Minimum base64 length: ceil((12 + 16 + 1) / 3) * 4 = 40 chars
  // Plus "v1:" prefix = 43 chars minimum
  return value.length >= 43;
}

/**
 * Decrypt if encrypted, otherwise return as-is.
 * Handles the mixed state during migration where some rows are
 * plaintext and some are encrypted. Never throws — returns
 * the raw value if decryption fails.
 */
export function maybeDecryptText(
  value: string | null | undefined
): string | null {
  if (value == null) return null;
  if (!isEncrypted(value)) return value;
  try {
    return decryptText(value);
  } catch {
    // If decryption fails (corrupted data, key mismatch), return raw value
    // rather than crashing the request
    console.error("Failed to decrypt value — returning raw");
    return value;
  }
}
