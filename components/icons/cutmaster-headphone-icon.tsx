type CutmasterHeadphoneIconProps = {
  className?: string;
};

/** Minimal over-ear headphone mark — Cutmaster product language. */
export function CutmasterHeadphoneIcon({ className }: CutmasterHeadphoneIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M4.5 13.25V11a7.5 7.5 0 0115 0v2.25"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <rect x="3" y="13" width="4.25" height="6.5" rx="2" fill="currentColor" />
      <rect x="16.75" y="13" width="4.25" height="6.5" rx="2" fill="currentColor" />
    </svg>
  );
}
