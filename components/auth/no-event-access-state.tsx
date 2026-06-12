import { PremiumCard, PrimaryButton, SectionTitle } from "@/components/planning-ui";

type NoEventAccessStateProps = {
  email?: string | null;
  onSignOut?: () => void;
};

export function NoEventAccessState({ email, onSignOut }: NoEventAccessStateProps) {
  return (
    <section className="mx-auto w-full max-w-lg px-5 py-16 sm:px-6">
      <PremiumCard variant="accent">
        <SectionTitle>Your event isn&apos;t ready yet</SectionTitle>
        <p className="mt-2 text-xs text-stone-600">
          {email
            ? `We couldn't find an event linked to ${email} yet.`
            : "We couldn't find an event linked to your account yet."}{" "}
          Your planner will send you access when everything is set up.
        </p>
        {onSignOut ? (
          <PrimaryButton
            type="button"
            onClick={onSignOut}
            className="mt-4 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50"
          >
            Sign out
          </PrimaryButton>
        ) : null}
      </PremiumCard>
    </section>
  );
}
