"use client";

import { useMemo } from "react";

import { CouplePlanningChipSelect } from "@/components/couple-planning-chip-select";
import {
  CoupleGuidedQuestionSection,
  type CoupleGuidedQuestionStep,
} from "@/components/couple-guided-question-section";
import { TextArea, TextInput, lightUiFormLabelClass } from "@/components/planning-ui";
import {
  CEREMONY_CHAPTER_QUESTION_IDS,
  CEREMONY_CUTMASTER_SERVICES_OPTIONS,
  CEREMONY_LOCATION_OPTIONS,
  buildCeremonyChapterReviewIncompleteHint,
  ceremonyChapterNeedsLogistics,
  ceremonyCutmasterServicesLabelFromValue,
  ceremonyCutmasterServicesValueFromLabel,
  ceremonyLocationLabelFromValue,
  ceremonyLocationValueFromLabel,
  normalizeCeremonyCutmasterServicesAnswer,
  normalizeCeremonyLocationAnswer,
} from "@/lib/coupleCeremonyPlanning";

const planningQuestionFieldShellClass =
  "rounded-xl border border-stone-200/95 bg-stone-50/90 px-5 py-5 shadow-none sm:px-6 sm:py-6";

export type CoupleCeremonyGuidedSectionProps = {
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  onContinueToNextChapter?: () => void;
  continueToNextChapterLabel?: string;
};

export function CoupleCeremonyGuidedSection({
  answers,
  onAnswerChange,
  onContinueToNextChapter,
  continueToNextChapterLabel,
}: CoupleCeremonyGuidedSectionProps) {
  const servicesValue = normalizeCeremonyCutmasterServicesAnswer(
    answers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
  );
  const needsLogistics = ceremonyChapterNeedsLogistics(servicesValue);

  const steps = useMemo((): CoupleGuidedQuestionStep[] => {
    const setSingle = (questionId: string, next: string) => onAnswerChange(questionId, next);

    const renderSingleReview = (label: string, raw: string | undefined) => (
      <div className={planningQuestionFieldShellClass}>
        <p className={lightUiFormLabelClass}>{label}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-900">
          {(raw ?? "").trim() || <span className="text-stone-500">Not answered</span>}
        </p>
      </div>
    );

    const servicesStep: CoupleGuidedQuestionStep = {
      id: "ceremony-cutmaster-services",
      missingLabel: "Ceremony audio/services with Cutmaster Music",
      isAnswered: (nextAnswers) =>
        Boolean(
          normalizeCeremonyCutmasterServicesAnswer(
            nextAnswers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
          ),
        ),
      renderGuided: () => (
        <CouplePlanningChipSelect
          label="Is Cutmaster Music providing ceremony audio/services?"
          helperText="This helps us know whether to plan sound, mics, and music for your ceremony."
          mode="single"
          options={CEREMONY_CUTMASTER_SERVICES_OPTIONS}
          value={ceremonyCutmasterServicesLabelFromValue(
            normalizeCeremonyCutmasterServicesAnswer(
              answers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
            ),
          )}
          onChange={(next) =>
            setSingle(
              CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices,
              ceremonyCutmasterServicesValueFromLabel(next as string),
            )
          }
        />
      ),
      renderReview: () =>
        renderSingleReview(
          "Is Cutmaster Music providing ceremony audio/services?",
          ceremonyCutmasterServicesLabelFromValue(
            normalizeCeremonyCutmasterServicesAnswer(
              answers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
            ),
          ),
        ),
    };

    if (!needsLogistics) {
      return [servicesStep];
    }

    const startTimeStep: CoupleGuidedQuestionStep = {
      id: "ceremony-start-time",
      missingLabel: "Ceremony start time",
      isAnswered: (nextAnswers) =>
        Boolean((nextAnswers[CEREMONY_CHAPTER_QUESTION_IDS.startTime] ?? "").trim()),
      renderGuided: () => (
        <div className={planningQuestionFieldShellClass}>
          <TextInput
            id="ceremony-start-time"
            label="What time is the ceremony scheduled to start?"
            value={answers[CEREMONY_CHAPTER_QUESTION_IDS.startTime] ?? ""}
            onChange={(next) => setSingle(CEREMONY_CHAPTER_QUESTION_IDS.startTime, next)}
            placeholder="e.g. 4:00 PM, 4pm, or TBD"
            labelClassName={`block ${lightUiFormLabelClass}`}
          />
          <p className="mt-3 text-xs leading-relaxed text-stone-600">
            An approximate time is fine—enter TBD if you have not locked it in yet.
          </p>
        </div>
      ),
      renderReview: () =>
        renderSingleReview(
          "What time is the ceremony scheduled to start?",
          answers[CEREMONY_CHAPTER_QUESTION_IDS.startTime],
        ),
    };

    const locationValue = normalizeCeremonyLocationAnswer(
      answers[CEREMONY_CHAPTER_QUESTION_IDS.location],
    );

    const locationStep: CoupleGuidedQuestionStep = {
      id: "ceremony-location",
      missingLabel: "Ceremony location",
      isAnswered: (nextAnswers) => {
        const nextLocation = normalizeCeremonyLocationAnswer(
          nextAnswers[CEREMONY_CHAPTER_QUESTION_IDS.location],
        );
        if (!nextLocation) return false;
        if (nextLocation === "different") {
          return Boolean((nextAnswers[CEREMONY_CHAPTER_QUESTION_IDS.locationDetails] ?? "").trim());
        }
        return true;
      },
      renderGuided: () => (
        <div className="space-y-4">
          <CouplePlanningChipSelect
            label="Where is the ceremony taking place?"
            mode="single"
            options={CEREMONY_LOCATION_OPTIONS}
            value={ceremonyLocationLabelFromValue(locationValue)}
            onChange={(next) =>
              setSingle(
                CEREMONY_CHAPTER_QUESTION_IDS.location,
                ceremonyLocationValueFromLabel(next as string),
              )
            }
          />
          {locationValue === "different" ? (
            <div className={planningQuestionFieldShellClass}>
              <TextArea
                id="ceremony-location-details"
                label="Ceremony location details"
                value={answers[CEREMONY_CHAPTER_QUESTION_IDS.locationDetails] ?? ""}
                onChange={(next) =>
                  setSingle(CEREMONY_CHAPTER_QUESTION_IDS.locationDetails, next)
                }
                rows={3}
                placeholder="Venue name, address, or any notes that help us plan…"
                labelClassName={`block ${lightUiFormLabelClass}`}
              />
            </div>
          ) : null}
        </div>
      ),
      renderReview: () => (
        <div className="space-y-4">
          {renderSingleReview(
            "Where is the ceremony taking place?",
            ceremonyLocationLabelFromValue(locationValue),
          )}
          {locationValue === "different" ? (
            <div className={planningQuestionFieldShellClass}>
              <p className={lightUiFormLabelClass}>Ceremony location details</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-900">
                {(answers[CEREMONY_CHAPTER_QUESTION_IDS.locationDetails] ?? "").trim() || (
                  <span className="text-stone-500">Not answered</span>
                )}
              </p>
            </div>
          ) : null}
        </div>
      ),
    };

    return [servicesStep, startTimeStep, locationStep];
  }, [answers, needsLogistics, onAnswerChange]);

  const reviewIncompleteHint = useMemo(
    () => buildCeremonyChapterReviewIncompleteHint(answers),
    [answers],
  );

  return (
    <CoupleGuidedQuestionSection
      sectionId="ceremony-guided"
      eyebrow="Ceremony"
      title="Ceremony services checkpoint"
      intro="A quick pass on ceremony audio and logistics—exact details can wait if you are still deciding."
      steps={steps}
      answers={answers}
      reviewIncompleteHint={reviewIncompleteHint}
      completionMessage="Thanks — this helps us know what to plan for your ceremony."
      onContinueToNextChapter={onContinueToNextChapter}
      continueToNextChapterLabel={continueToNextChapterLabel}
    />
  );
}
