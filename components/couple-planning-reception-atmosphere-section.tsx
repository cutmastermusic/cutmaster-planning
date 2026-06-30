"use client";

import { CouplePlanningChipSelect } from "@/components/couple-planning-chip-select";
import { TextInput } from "@/components/planning-ui";
import {
  couplePlanningQuestionLabelClass,
  couplePlanningQuestionShellClass,
} from "@/components/couple-planning-ui";
import {
  COCKTAIL_HOUR_VIBE_OPTIONS,
  DINNER_VIBE_OPTIONS,
  RECEPTION_ATMOSPHERE_QUESTION_IDS,
  RECEPTION_VIBE_CUSTOM_CHIP,
  parseCocktailHourVibeAnswer,
  parseDinnerVibeAnswer,
  serializeCocktailHourVibeAnswer,
  serializeDinnerVibeAnswer,
} from "@/lib/couplePlanningExtendedQuestions";

export type CouplePlanningReceptionAtmosphereSectionProps = {
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  muted?: boolean;
};

function VibeChipField({
  label,
  options,
  vibeQuestionId,
  customQuestionId,
  answers,
  onAnswerChange,
  parse,
  serialize,
}: {
  label: string;
  options: readonly string[];
  vibeQuestionId: string;
  customQuestionId: string;
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  parse: (raw: string | undefined) => string[];
  serialize: (values: readonly string[]) => string;
}) {
  const selected = parse(answers[vibeQuestionId]);
  const showCustom = selected.includes(RECEPTION_VIBE_CUSTOM_CHIP);

  return (
    <div className={couplePlanningQuestionShellClass}>
      <CouplePlanningChipSelect
        label={label}
        helperText="Choose all that fit — this guides your DJ, not a specific playlist."
        mode="multi"
        options={options}
        value={selected}
        onChange={(next) => onAnswerChange(vibeQuestionId, serialize(next as string[]))}
      />
      {showCustom ? (
        <div className="mt-4 border-t border-stone-200/80 pt-4">
          <TextInput
            id={`${customQuestionId}-custom`}
            label="Describe your custom vibe"
            value={answers[customQuestionId] ?? ""}
            onChange={(next) => onAnswerChange(customQuestionId, next)}
            placeholder="Tell us what you're imagining…"
            labelClassName={`block ${couplePlanningQuestionLabelClass}`}
          />
        </div>
      ) : null}
    </div>
  );
}

export function CouplePlanningReceptionAtmosphereSection({
  answers,
  onAnswerChange,
  muted = false,
}: CouplePlanningReceptionAtmosphereSectionProps) {
  return (
    <section
      className={`space-y-4 rounded-[1.75rem] border p-4 transition sm:p-5 ${
        muted
          ? "border-stone-200 bg-white/55 opacity-80"
          : "border-[#2f4a3e]/15 bg-white shadow-[0_18px_55px_-45px_rgba(47,74,62,0.45)]"
      }`}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b08a45]">
          Reception Atmosphere
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#214637]">
          Set the mood before playlists
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">
          These vibes help your DJ shape cocktail hour and dinner — they are guidance, not song lists.
        </p>
      </div>
      <VibeChipField
        label="What is your Cocktail Hour music vibe?"
        options={COCKTAIL_HOUR_VIBE_OPTIONS}
        vibeQuestionId={RECEPTION_ATMOSPHERE_QUESTION_IDS.cocktailHourVibe}
        customQuestionId={RECEPTION_ATMOSPHERE_QUESTION_IDS.cocktailHourVibeCustom}
        answers={answers}
        onAnswerChange={onAnswerChange}
        parse={parseCocktailHourVibeAnswer}
        serialize={serializeCocktailHourVibeAnswer}
      />
      <VibeChipField
        label="What is your Dinner music vibe?"
        options={DINNER_VIBE_OPTIONS}
        vibeQuestionId={RECEPTION_ATMOSPHERE_QUESTION_IDS.dinnerVibe}
        customQuestionId={RECEPTION_ATMOSPHERE_QUESTION_IDS.dinnerVibeCustom}
        answers={answers}
        onAnswerChange={onAnswerChange}
        parse={parseDinnerVibeAnswer}
        serialize={serializeDinnerVibeAnswer}
      />
    </section>
  );
}
