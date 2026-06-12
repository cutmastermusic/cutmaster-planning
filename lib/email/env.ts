export function getResendApiKey(): string | null {
  const value = process.env.RESEND_API_KEY?.trim();
  return value || null;
}

export function getResendFromEmail(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) return configured;
  return "Cutmaster Music <onboarding@resend.dev>";
}

export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey());
}
