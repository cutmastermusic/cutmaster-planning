export type InviteEmailDeliveryResult =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: "not_configured" }
  | { status: "failed"; error: string };

export type SendPlanningPortalInviteEmailInput = {
  to: string;
  recipientName?: string | null;
  eventTitle: string;
  inviteUrl: string;
  expiresAt: Date;
};
