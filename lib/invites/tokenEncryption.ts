import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function encryptionKey(): Buffer {
  const secret =
    process.env.INVITE_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "dev-only-invite-token-encryption-key";

  return createHash("sha256").update(secret, "utf8").digest();
}

/** Encrypt raw invite token for admin copy/resend (stored alongside tokenHash). */
export function encryptInviteToken(rawToken: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(rawToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptInviteToken(tokenEnc: string | null | undefined): string | null {
  if (!tokenEnc?.trim()) return null;

  try {
    const payload = Buffer.from(tokenEnc, "base64url");
    if (payload.length <= IV_BYTES + TAG_BYTES) return null;

    const iv = payload.subarray(0, IV_BYTES);
    const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const encrypted = payload.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, encryptionKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
