export type CoupleOnboardingGlassPillProps = {
  label: string;
  className?: string;
};

/** Reusable warm ivory glass micro-CTA pill for the Couple Portal. */
export function CoupleOnboardingGlassPill({
  label,
  className,
}: CoupleOnboardingGlassPillProps) {
  return (
    <div
      className={`cm-couple-onboarding-glass-pill${className ? ` ${className}` : ""}`}
      aria-hidden
    >
      <span className="cm-couple-onboarding-glass-pill__label">{label}</span>
      <span className="cm-couple-onboarding-glass-pill__arrow" aria-hidden>
        →
      </span>
    </div>
  );
}

export function WelcomePhotoOnboardingPill() {
  return <CoupleOnboardingGlassPill label="Upload your photo" />;
}
