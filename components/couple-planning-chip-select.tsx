"use client";

import {
  couplePlanningQuestionHelperClass,
  couplePlanningQuestionLabelClass,
} from "@/components/couple-planning-ui";

type CouplePlanningChipSelectProps = {
  label: string;
  helperText?: string;
  options: readonly string[];
  mode: "single" | "multi";
  value: string | string[];
  onChange: (next: string | string[]) => void;
  maxSelections?: number;
  optionalHint?: string;
};

export function CouplePlanningChipSelect({
  label,
  helperText,
  options,
  mode,
  value,
  onChange,
  maxSelections,
  optionalHint,
}: CouplePlanningChipSelectProps) {
  const selectedMulti = mode === "multi" ? (Array.isArray(value) ? value : []) : [];
  const selectedSingle = mode === "single" ? (typeof value === "string" ? value : "") : "";

  const toggleMulti = (option: string) => {
    const current = selectedMulti;
    if (current.includes(option)) {
      onChange(current.filter((entry) => entry !== option));
      return;
    }
    if (maxSelections !== undefined && current.length >= maxSelections) {
      return;
    }
    onChange([...current, option]);
  };

  const atMax = maxSelections !== undefined && selectedMulti.length >= maxSelections;

  return (
    <div className="space-y-4">
      <div>
        <p className={couplePlanningQuestionLabelClass}>{label}</p>
        {optionalHint ? (
          <p className="mt-2 text-xs font-medium text-stone-500">{optionalHint}</p>
        ) : null}
        {maxSelections !== undefined && mode === "multi" ? (
          <p className="mt-2 text-sm text-stone-600">
            Choose up to {maxSelections}
            {selectedMulti.length > 0 ? ` · ${selectedMulti.length} selected` : ""}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const on =
            mode === "single" ? selectedSingle === option : selectedMulti.includes(option);
          const disabled =
            mode === "multi" && !on && atMax ? true : false;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => {
                if (mode === "single") {
                  onChange(on ? "" : option);
                  return;
                }
                toggleMulti(option);
              }}
              className={`min-h-11 rounded-full border px-4 py-2.5 text-left text-[13px] font-medium transition sm:min-h-10 sm:py-2 ${
                on
                  ? "border-[#2f4a3e] bg-[#2f4a3e] text-white shadow-none"
                  : disabled
                    ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
                    : "border-stone-300/90 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {helperText ? (
        <p className={couplePlanningQuestionHelperClass}>{helperText}</p>
      ) : null}
    </div>
  );
}
