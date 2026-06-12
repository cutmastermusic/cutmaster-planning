import { Resend } from "resend";

import { getResendApiKey, getResendFromEmail } from "@/lib/email/env";
import { formatInviteExpiryDate } from "@/lib/email/formatInviteExpiry";
import { PlanningPortalInviteEmail } from "@/lib/email/templates/planningPortalInviteEmail";
import type {
  InviteEmailDeliveryResult,
  SendPlanningPortalInviteEmailInput,
} from "@/lib/email/types";

export type { InviteEmailDeliveryResult, SendPlanningPortalInviteEmailInput };

const INVITE_EMAIL_SUBJECT = "You're invited to the Cutmaster Music Planning Portal";

export async function sendPlanningPortalInviteEmail(
  input: SendPlanningPortalInviteEmailInput,
): Promise<InviteEmailDeliveryResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured; skipping Planning Portal invite email");
    return { status: "skipped", reason: "not_configured" };
  }

  const resend = new Resend(apiKey);
  const expiresAtLabel = formatInviteExpiryDate(input.expiresAt);

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: input.to,
      subject: INVITE_EMAIL_SUBJECT,
      react: PlanningPortalInviteEmail({
        recipientName: input.recipientName,
        eventTitle: input.eventTitle,
        inviteUrl: input.inviteUrl,
        expiresAtLabel,
      }),
    });

    if (error) {
      console.error("[email] Resend send failed:", error);
      return {
        status: "failed",
        error: error.message || "Email delivery failed.",
      };
    }

    return {
      status: "sent",
      messageId: data?.id ?? "unknown",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    console.error("[email] Resend send threw:", error);
    return { status: "failed", error: message };
  }
}
