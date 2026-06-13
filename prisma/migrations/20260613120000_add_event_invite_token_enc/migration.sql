-- Store encrypted raw invite token so admins can copy/resend pending links without rotating tokens.
ALTER TABLE "EventInvite" ADD COLUMN "tokenEnc" TEXT;
