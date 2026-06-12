import { createHash, randomBytes } from "node:crypto";

const INVITE_TOKEN_BYTES = 32;

/** Cryptographically secure raw invite token (store only the hash in DB). */
export function generateInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString("base64url");
}

/** SHA-256 hex digest of a raw invite token for EventInvite.tokenHash lookup. */
export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}
