import type { ReactNode } from "react";

export type CoupleOnboardingGlassPillProps = {
  headline: string;
  body: string;
  icon?: ReactNode;
  className?: string;
};

/** Reusable warm ivory glass onboarding pill for the Couple Portal. */
export function CoupleOnboardingGlassPill({
  headline,
  body,
  icon,
  className,
}: CoupleOnboardingGlassPillProps) {
  return (
    <div
      className={`cm-couple-onboarding-glass-pill${className ? ` ${className}` : ""}`}
      aria-hidden
    >
      {icon ? <div className="cm-couple-onboarding-glass-pill__icon-wrap">{icon}</div> : null}
      <h3 className="cm-couple-onboarding-glass-pill__headline">{headline}</h3>
      <p className="cm-couple-onboarding-glass-pill__body">{body}</p>
    </div>
  );
}

export function WelcomePhotoOnboardingPill() {
  return (
    <CoupleOnboardingGlassPill
      headline="Make it yours"
      body="Upload your favorite photo."
    />
  );
}
