"use client";

import {
  CEREMONY_COVERAGE_OPTIONS,
  type CeremonyCoverageStatus,
} from "@/lib/ceremonyCoverage";

type CeremonyCoverageControlProps = {
  value: CeremonyCoverageStatus;
  onChange: (value: CeremonyCoverageStatus) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function CeremonyCoverageControl({
  value,
  onChange,
  disabled = false,
  id = "ceremony-coverage-status",
  className = "",
}: CeremonyCoverageControlProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-700">
        Ceremony coverage
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as CeremonyCoverageStatus)}
        className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-none focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/40 disabled:cursor-not-allowed disabled:bg-stone-100"
      >
        {CEREMONY_COVERAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-white text-stone-900">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
