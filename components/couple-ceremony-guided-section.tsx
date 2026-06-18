"use client";

import { useMemo } from "react";

import { CouplePlanningChipSelect } from "@/components/couple-planning-chip-select";
import {
  CoupleGuidedQuestionSection,
  type CoupleGuidedQuestionStep,
  type CoupleGuidedResumeProps,
} from "@/components/couple-guided-question-section";
import {
  couplePlanningEmptyAnswerClass,
  couplePlanningQuestionHelperClass,
  couplePlanningQuestionLabelClass,
  couplePlanningQuestionShellClass,
} from "@/components/couple-planning-ui";
import {
  PrimaryButton,
  TextArea,
  couplePortalSecondaryButtonClass,
} from "@/components/planning-ui";
import { CeremonyCoverageNotice } from "@/components/ceremony-coverage-notice";
import {
  CEREMONY_CHAPTER_QUESTION_IDS,
  CEREMONY_CUTMASTER_SERVICES_OPTIONS,
  CEREMONY_LOCATION_OPTIONS,
  buildCeremonyChapterReviewIncompleteHint,
  ceremonyCutmasterServicesLabelFromValue,
  ceremonyCutmasterServicesValueFromLabel,
  ceremonyLocationLabelFromValue,
  ceremonyLocationValueFromLabel,
  normalizeCeremonyCutmasterServicesAnswer,
  normalizeCeremonyLocationAnswer,
} from "@/lib/coupleCeremonyPlanning";

const planningQuestionFieldShellClass = couplePlanningQuestionShellClass;

export type CoupleCeremonyGuidedSectionProps = {
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  ceremonyNotes: string;
  onCeremonyNotesChange: (next: string) => void;
  onOpenTimeline: () => void;
  onContinueToNextChapter?: () => void;
  continueToNextChapterLabel?: string;
} & CoupleGuidedResumeProps;

export function CoupleCeremonyGuidedSection({
  answers,
  onAnswerChange,
  ceremonyNotes,
  onCeremonyNotesChange,
  onOpenTimeline,
  onContinueToNextChapter,
  continueToNextChapterLabel,
  guidedResume,
  guidedResumeMode,
  onGuidedResumeChange,
}: CoupleCeremonyGuidedSectionProps) {
  const servicesValue = normalizeCeremonyCutmasterServicesAnswer(
    answers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
  );

  const steps = useMemo((): CoupleGuidedQuestionStep[] => {
    const setSingle = (questionId: string, next: string) => onAnswerChange(questionId, next);

    const renderSingleReview = (label: string, raw: string | undefined) => (
      <div className={planningQuestionFieldShellClass}>
        <p className={couplePlanningQuestionLabelClass}>{label}</p>
        <p className="mt-3 text-sm leading-relaxed text-stone-900">
          {(raw ?? "").trim() || <span className={couplePlanningEmptyAnswerClass}>Not answered</span>}
        </p>
      </div>
    );

    const servicesStep: CoupleGuidedQuestionStep = {
      id: "ceremony-cutmaster-services",
      missingLabel: "Ceremony audio with Cutmaster Music",
      isAnswered: (nextAnswers) =>
        Boolean(
          normalizeCeremonyCutmasterServicesAnswer(
            nextAnswers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
          ),
        ),
      renderGuided: () => (
        <div className="space-y-4">
          <CouplePlanningChipSelect
            label="Is Cutmaster Music providing ceremony audio?"
            helperText="This helps us keep the ceremony visible while making the right plan for music support."
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
          {servicesValue === "no" ? <CeremonyCoverageNotice /> : null}
        </div>
      ),
      renderReview: () =>
        renderSingleReview(
          "Is Cutmaster Music providing ceremony audio?",
          ceremonyCutmasterServicesLabelFromValue(
            normalizeCeremonyCutmasterServicesAnswer(
              answers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
            ),
          ),
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
            helperText="A general location is enough for now. Exact setup details can come later."
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
                labelClassName={`block ${couplePlanningQuestionLabelClass}`}
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
              <p className={couplePlanningQuestionLabelClass}>Ceremony location details</p>
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

    const ceremonyMomentsStep: CoupleGuidedQuestionStep = {
      id: "ceremony-moments-music",
      optional: true,
      isAnswered: () => true,
      renderGuided: () => (
        <div className={planningQuestionFieldShellClass}>
          <p className={couplePlanningQuestionLabelClass}>Ceremony Moments / Music</p>
          {servicesValue === "no" ? (
            <div className="mt-3 space-y-4">
              <CeremonyCoverageNotice />
              <p className={couplePlanningQuestionHelperClass}>
                We’ll keep Ceremony noted in your Reception Timeline for context.
              </p>
            </div>
          ) : (
            <>
              <p className={`mt-3 ${couplePlanningQuestionHelperClass}`}>
                Processional, family entrances, wedding party, bride or groom, unity moments, and recessional songs live
                on your Ceremony Timeline so each cue stays in the flow of the day.
              </p>
              <PrimaryButton
                type="button"
                onClick={onOpenTimeline}
                className={`mt-5 w-full sm:w-auto ${couplePortalSecondaryButtonClass}`}
              >
                Open Ceremony Timeline
              </PrimaryButton>
            </>
          )}
        </div>
      ),
      renderReview: () => (
        <div className={planningQuestionFieldShellClass}>
          <p className={couplePlanningQuestionLabelClass}>Ceremony Moments / Music</p>
          <p className="mt-3 text-sm leading-relaxed text-stone-900">
            {servicesValue === "no"
              ? "Ceremony will stay noted in your Reception Timeline for context."
              : "Ceremony music is managed on your Ceremony Timeline."}
          </p>
        </div>
      ),
    };

    const notesStep: CoupleGuidedQuestionStep = {
      id: "ceremony-notes",
      optional: true,
      isAnswered: () => Boolean(ceremonyNotes.trim()),
      renderGuided: () => (
        <div className={planningQuestionFieldShellClass}>
          <TextArea
            id="ceremony-notes-couple"
            label="Ceremony notes"
            value={ceremonyNotes}
            onChange={onCeremonyNotesChange}
            rows={4}
            placeholder="Any ceremony details, tone, special moments, or music notes you want us to know."
            labelClassName={`block ${couplePlanningQuestionLabelClass}`}
          />
          <p className={`mt-3 ${couplePlanningQuestionHelperClass}`}>
            Keep this high level. Our team can handle production details later.
          </p>
        </div>
      ),
      renderReview: () =>
        renderSingleReview("Ceremony notes", ceremonyNotes),
    };

    return [servicesStep, locationStep, ceremonyMomentsStep, notesStep];
  }, [answers, ceremonyNotes, onAnswerChange, onCeremonyNotesChange, onOpenTimeline, servicesValue]);

  const reviewIncompleteHint = useMemo(
    () => buildCeremonyChapterReviewIncompleteHint(answers),
    [answers],
  );

  return (
    <CoupleGuidedQuestionSection
      sectionId="ceremony-guided"
      eyebrow="Ceremony"
      title="Ceremony"
      intro="A calm pass through ceremony audio, location, music moments, and notes. Production details can come later."
      steps={steps}
      answers={answers}
      reviewIncompleteHint={reviewIncompleteHint}
      completionMessage="Thanks — this gives us a clear ceremony starting point."
      onContinueToNextChapter={onContinueToNextChapter}
      continueToNextChapterLabel={continueToNextChapterLabel}
      guidedResume={guidedResume}
      guidedResumeMode={guidedResumeMode}
      onGuidedResumeChange={onGuidedResumeChange}
    />
  );
}
