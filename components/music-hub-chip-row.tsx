"use client";

type MusicHubChipRowProps = {
  options: readonly string[];
  selected: readonly string[];
  onToggle: (option: string) => void;
  disabled?: boolean;
  keyPrefix: string;
  buttonVariant?: "default" | "couple";
};

export function MusicHubChipRow({
  options,
  selected,
  onToggle,
  disabled = false,
  keyPrefix,
  buttonVariant = "default",
}: MusicHubChipRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = selected.includes(option);
        return (
          <button
            key={`${keyPrefix}-${option}`}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onToggle(option)}
            className={`min-h-11 rounded-full border px-3.5 py-2.5 text-left text-[13px] font-medium transition sm:min-h-10 sm:py-2 ${
              on
                ? buttonVariant === "couple"
                  ? "border-[#2f4a3e] bg-[#2f4a3e] text-white shadow-sm"
                  : "border-black bg-[#00D4FF] text-black shadow-none"
                : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
            } disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
