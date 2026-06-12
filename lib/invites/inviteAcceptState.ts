import { hashInviteToken } from "@/lib/invites/token";
import {
  classifyInviteRecord,
  type InviteAcceptPreviewResult,
  type InviteRecordForClassification,
} from "@/lib/invites/inviteAcceptMessages";
import { prisma } from "@/lib/prisma";

export type { InviteAcceptPreviewResult } from "@/lib/invites/inviteAcceptMessages";

async function lookupInviteByRawToken(rawToken: string): Promise<InviteRecordForClassification | null> {
  const token = rawToken.trim();
  if (!token) {
    return null;
  }

  const tokenHash = hashInviteToken(token);
  return prisma.eventInvite.findUnique({
    where: { tokenHash },
    include: {
      event: { select: { title: true } },
      eventMember: true,
    },
  });
}

export async function resolveInviteAcceptPreview(rawToken: string): Promise<InviteAcceptPreviewResult> {
  const invite = await lookupInviteByRawToken(rawToken);
  return classifyInviteRecord(invite);
}

export async function lookupInviteForAccept(rawToken: string) {
  return lookupInviteByRawToken(rawToken);
}
