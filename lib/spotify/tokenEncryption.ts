/**
 * Server-only Spotify token encryption.
 * Do not import from client components.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const TOKEN_ENCRYPTION_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;

function decodeEncryptionKey(): Buffer {
  const raw = process.env.SPOTIFY_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("SPOTIFY_TOKEN_ENCRYPTION_KEY is required for Spotify Connect.");
  }

  const normalizedBase64Url = raw.replace(/-/g, "+").replace(/_/g, "/");
  const candidates: Buffer[] = [];
  if (/^[0-9a-f]+$/i.test(raw)) {
    candidates.push(Buffer.from(raw, "hex"));
  }
  candidates.push(Buffer.from(normalizedBase64Url, "base64"));
  candidates.push(Buffer.from(raw, "utf8"));

  const exactKey = candidates.find((candidate) => candidate.length === 32);
  if (exactKey) return exactKey;

  throw new Error("SPOTIFY_TOKEN_ENCRYPTION_KEY must decode to 32 bytes.");
}

export function generateSpotifyTokenEncryptionKey(): string {
  return randomBytes(32).toString("base64url");
}

export function encryptSpotifyToken(token: string): string {
  const key = decodeEncryptionKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_ENCRYPTION_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptSpotifyToken(encryptedToken: string): string {
  const [version, ivEncoded, authTagEncoded, ciphertextEncoded] = encryptedToken.split(":");
  if (
    version !== TOKEN_ENCRYPTION_VERSION ||
    !ivEncoded ||
    !authTagEncoded ||
    !ciphertextEncoded
  ) {
    throw new Error("Unsupported Spotify token encryption payload.");
  }

  const key = decodeEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagEncoded, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function spotifyTokenEncryptionKeyFingerprint(): string {
  return createHash("sha256").update(decodeEncryptionKey()).digest("hex").slice(0, 12);
}
