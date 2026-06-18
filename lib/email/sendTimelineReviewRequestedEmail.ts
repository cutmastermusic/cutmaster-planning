import { Resend } from "resend";

import { getResendApiKey, getResendFromEmail } from "@/lib/email/env";
import type { InviteEmailDeliveryResult } from "@/lib/email/types";

export type SendTimelineReviewRequestedEmailInput = {
  to: string[];
  eventName: string;
  eventDate: string;
  coupleName?: string | null;
  reviewTimelineUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTimelineReviewRequestedEmail(
  input: SendTimelineReviewRequestedEmailInput,
): Promise<InviteEmailDeliveryResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured; skipping timeline review request email");
    return { status: "skipped", reason: "not_configured" };
  }

  const recipients = [...new Set(input.to.map((email) => email.trim()).filter(Boolean))];
  if (recipients.length === 0) {
    return { status: "failed", error: "No recipients were available." };
  }

  const eventName = input.eventName.trim() || "Untitled Event";
  const subject = `Timeline Review Requested — ${eventName}`;
  const coupleName = input.coupleName?.trim() || "Not provided";
  const eventDate = input.eventDate.trim() || "Not provided";
  const reviewTimelineUrl = input.reviewTimelineUrl.trim();
  const text = [
    "Timeline Review Requested",
    "",
    `Event name: ${eventName}`,
    `Event date: ${eventDate}`,
    `Couple name: ${coupleName}`,
    "",
    `Review Timeline: ${reviewTimelineUrl}`,
  ].join("\n");
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1c1917; line-height: 1.5;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">Timeline Review Requested</h1>
      <p style="margin: 0 0 18px;">A couple has requested timeline review in the Cutmaster Music Planning Portal.</p>
      <p style="margin: 0 0 8px;"><strong>Event name:</strong> ${escapeHtml(eventName)}</p>
      <p style="margin: 0 0 8px;"><strong>Event date:</strong> ${escapeHtml(eventDate)}</p>
      <p style="margin: 0 0 18px;"><strong>Couple name:</strong> ${escapeHtml(coupleName)}</p>
      <p style="margin: 0 0 18px;">
        <a href="${escapeHtml(reviewTimelineUrl)}" style="color: #0f766e; font-weight: 700;">Review Timeline</a>
      </p>
      <p style="margin: 0; color: #78716c; font-size: 13px;">Cutmaster Music Planning Portal</p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: recipients,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("[email] Timeline review request email failed:", error);
      return { status: "failed", error: error.message || "Email delivery failed." };
    }

    return { status: "sent", messageId: data?.id ?? "unknown" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    console.error("[email] Timeline review request email threw:", error);
    return { status: "failed", error: message };
  }
}
