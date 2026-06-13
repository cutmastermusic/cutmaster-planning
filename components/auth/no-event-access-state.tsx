import { PremiumCard, PrimaryButton, SectionTitle } from "@/components/planning-ui";
import type { SessionIssue } from "@/lib/eventAccess/types";

export type NoEventAccessVariant = "no_event" | "access_removed" | SessionIssue;

type NoEventAccessStateProps = {
  email?: string | null;
  variant?: NoEventAccessVariant;
  onSignOut?: () => void;
};

function getCopy(variant: NoEventAccessVariant, email?: string | null) {
  switch (variant) {
    case "auth_link_conflict":
      return {
        title: "Account sign-in issue",
        message: email
          ? `We signed you in as ${email}, but this email is linked to a different login method than the one you used. Sign out and sign in again with the email your planner invited. If the problem continues, contact Cutmaster support.`
          : "We signed you in, but this email is linked to a different login method than the one you used. Sign out and sign in again with the email your planner invited. If the problem continues, contact Cutmaster support.",
        signOutLabel: "Sign out and try again",
      };
    case "user_sync_failed":
      return {
        title: "Couldn't connect your account",
        message:
          "We couldn't finish setting up your account after sign-in. Sign out and try again. If this keeps happening, contact your planner or Cutmaster support.",
        signOutLabel: "Sign out and try again",
      };
    case "access_removed":
    case "no_event":
    default:
      return {
        title: "No Active Event Access",
        message:
          "We couldn't find any active event access associated with this account. If you believe this is a mistake, please contact your planner.",
        signOutLabel: "Sign out",
      };
  }
}

export function NoEventAccessState({
  email,
  variant = "no_event",
  onSignOut,
}: NoEventAccessStateProps) {
  const copy = getCopy(variant, email);

  return (
    <section className="mx-auto w-full max-w-lg px-5 py-16 sm:px-6">
      <PremiumCard variant="accent">
        <SectionTitle>{copy.title}</SectionTitle>
        <p className="mt-2 text-xs leading-relaxed text-stone-600">{copy.message}</p>
        {onSignOut ? (
          <PrimaryButton
            type="button"
            onClick={onSignOut}
            className="mt-4 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50"
          >
            {copy.signOutLabel}
          </PrimaryButton>
        ) : null}
      </PremiumCard>
    </section>
  );
}
