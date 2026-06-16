import type { ReactNode } from "react";

export type CoupleOnboardingGlassPillProps = {
  headline: string;
  body: string;
  icon?: ReactNode;
  className?: string;
};

function WelcomePhotoCameraIcon() {
  return (
    <svg
      className="cm-couple-onboarding-glass-pill__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
      />
      <circle cx="12" cy="13" r="3.25" />
    </svg>
  );
}

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
      body="Add your favorite photo."
      icon={<WelcomePhotoCameraIcon />}
    />
  );
}
