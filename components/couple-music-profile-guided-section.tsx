"use client";

import { useMemo } from "react";

import { CouplePlanningChipSelect } from "@/components/couple-planning-chip-select";
import {
  CoupleGuidedQuestionSection,
  type CoupleGuidedQuestionStep,
  type CoupleGuidedResumeProps,
} from "@/components/couple-guided-question-section";
import { TextArea, lightUiFormLabelClass } from "@/components/planning-ui";
import {
  MUSIC_PROFILE_DECADE_OPTIONS,
  MUSIC_PROFILE_DANCE_FLOOR_OPTIONS,
  MUSIC_PROFILE_GENRE_OPTIONS,
  MUSIC_PROFILE_IMPORTANCE_OPTIONS,
  MUSIC_PROFILE_LINE_DANCE_ATTITUDE_OPTIONS,
  MUSIC_PROFILE_LINE_DANCE_PICK_OPTIONS,
  MUSIC_PROFILE_QUESTION_IDS,
  normalizeMusicProfileImportanceAnswer,
  parseMusicProfileDanceFloorAnswer,
  parseMusicProfileDecadesAnswer,
  parseMusicProfileGenresAnswer,
  parseMusicProfileLineDancesPickAnswer,
  resolveMusicProfileAnswersForDisplay,
  serializePlanningQuestionChipAnswer,
} from "@/lib/coupleMusicProfilePlanning";
import { buildGuidedChapterReviewIncompleteHint } from "@/lib/coupleGuidedChapterMissingFields";

const planningQuestionFieldShellClass =
  "rounded-xl border border-stone-200/95 bg-stone-50/90 px-5 py-5 shadow-none sm:px-6 sm:py-6";

export type CoupleMusicProfileGuidedSectionProps = {
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  onOpenMusicHub: () => void;
  onContinueToNextChapter: () => void;
  continueToNextChapterLabel: string;
} & CoupleGuidedResumeProps;

export function CoupleMusicProfileGuidedSection({
  answers,
  onAnswerChange,
  onOpenMusicHub,
  onContinueToNextChapter,
  continueToNextChapterLabel,
  guidedResume,
  guidedResumeMode,
  onGuidedResumeChange,
}: CoupleMusicProfileGuidedSectionProps) {
  const resolvedAnswers = useMemo(() => resolveMusicProfileAnswersForDisplay(answers), [answers]);

  const steps = useMemo((): CoupleGuidedQuestionStep[] => {
    const setSingle = (questionId: string, next: string) => onAnswerChange(questionId, next);
    const setChips = (questionId: string, next: string[]) =>
      onAnswerChange(questionId, serializePlanningQuestionChipAnswer(next));

    const renderChipReview = (label: string, values: string[]) => (
      <div className={planningQuestionFieldShellClass}>
        <p className={lightUiFormLabelClass}>{label}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-900">
          {values.length > 0 ? values.join(", ") : (
            <span className="text-stone-500">None selected</span>
          )}
        </p>
      </div>
    );

    const renderSingleReview = (label: string, raw: string | undefined) => (
      <div className={planningQuestionFieldShellClass}>
        <p className={lightUiFormLabelClass}>{label}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-900">
          {(raw ?? "").trim() || <span className="text-stone-500">Not answered</span>}
        </p>
      </div>
    );

    return [
      {
        id: "music-profile-importance",
        missingLabel: "How important is music to your wedding?",
        isAnswered: (nextAnswers) =>
          Boolean(
            normalizeMusicProfileImportanceAnswer(
              resolveMusicProfileAnswersForDisplay(nextAnswers)[MUSIC_PROFILE_QUESTION_IDS.importance],
            ),
          ),
        renderGuided: () => (
          <CouplePlanningChipSelect
            label="How important is music to your wedding?"
            mode="single"
            options={MUSIC_PROFILE_IMPORTANCE_OPTIONS}
            value={normalizeMusicProfileImportanceAnswer(
              resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.importance],
            )}
            onChange={(next) => setSingle(MUSIC_PROFILE_QUESTION_IDS.importance, next as string)}
          />
        ),
        renderReview: () =>
          renderSingleReview(
            "How important is music to your wedding?",
            normalizeMusicProfileImportanceAnswer(
              resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.importance],
            ),
          ),
      },
      {
        id: "music-profile-dance-floor",
        missingLabel: "What kind of dance floor are you hoping for?",
        isAnswered: (nextAnswers) =>
          parseMusicProfileDanceFloorAnswer(
            resolveMusicProfileAnswersForDisplay(nextAnswers)[
              MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle
            ],
          ).length > 0,
        renderGuided: () => (
          <CouplePlanningChipSelect
            label="What kind of dance floor are you hoping for?"
            mode="multi"
            options={MUSIC_PROFILE_DANCE_FLOOR_OPTIONS}
            value={parseMusicProfileDanceFloorAnswer(
              resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle],
            )}
            onChange={(next) =>
              setChips(MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle, next as string[])
            }
          />
        ),
        renderReview: () =>
          renderChipReview(
            "What kind of dance floor are you hoping for?",
            parseMusicProfileDanceFloorAnswer(
              resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle],
            ),
          ),
      },
      {
        id: "music-profile-decades",
        missingLabel: "Which decades should we lean into?",
        isAnswered: (nextAnswers) =>
          parseMusicProfileDecadesAnswer(
            resolveMusicProfileAnswersForDisplay(nextAnswers)[MUSIC_PROFILE_QUESTION_IDS.decades],
          ).length > 0,
        renderGuided: () => (
          <CouplePlanningChipSelect
            label="Which decades should we lean into?"
            mode="multi"
            options={MUSIC_PROFILE_DECADE_OPTIONS}
            value={parseMusicProfileDecadesAnswer(resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.decades])}
            onChange={(next) => setChips(MUSIC_PROFILE_QUESTION_IDS.decades, next as string[])}
          />
        ),
        renderReview: () =>
          renderChipReview(
            "Which decades should we lean into?",
            parseMusicProfileDecadesAnswer(resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.decades]),
          ),
      },
      {
        id: "music-profile-genres-love",
        missingLabel: "What genres do you love?",
        isAnswered: (nextAnswers) =>
          parseMusicProfileGenresAnswer(
            resolveMusicProfileAnswersForDisplay(nextAnswers)[MUSIC_PROFILE_QUESTION_IDS.genresLove],
          ).length > 0,
        renderGuided: () => (
          <CouplePlanningChipSelect
            label="What genres do you love?"
            mode="multi"
            options={MUSIC_PROFILE_GENRE_OPTIONS}
            value={parseMusicProfileGenresAnswer(resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.genresLove])}
            onChange={(next) => setChips(MUSIC_PROFILE_QUESTION_IDS.genresLove, next as string[])}
          />
        ),
        renderReview: () =>
          renderChipReview(
            "What genres do you love?",
            parseMusicProfileGenresAnswer(resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.genresLove]),
          ),
      },
      {
        id: "music-profile-genres-avoid",
        optional: true,
        isAnswered: () => true,
        renderGuided: () => (
          <CouplePlanningChipSelect
            label="Are there any genres you'd rather avoid?"
            optionalHint="Optional — skip if nothing comes to mind."
            mode="multi"
            options={MUSIC_PROFILE_GENRE_OPTIONS}
            value={parseMusicProfileGenresAnswer(resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.genresAvoid])}
            onChange={(next) => setChips(MUSIC_PROFILE_QUESTION_IDS.genresAvoid, next as string[])}
          />
        ),
        renderReview: () =>
          renderChipReview(
            "Are there any genres you'd rather avoid?",
            parseMusicProfileGenresAnswer(resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.genresAvoid]),
          ),
      },
      {
        id: "music-profile-line-dances",
        missingLabel: "How do you feel about line dances?",
        isAnswered: (nextAnswers) =>
          Boolean(
            (
              resolveMusicProfileAnswersForDisplay(nextAnswers)[
                MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude
              ] ?? ""
            ).trim(),
          ),
        renderGuided: () => (
          <div className="space-y-4">
            <CouplePlanningChipSelect
              label="How do you feel about line dances?"
              mode="single"
              options={MUSIC_PROFILE_LINE_DANCE_ATTITUDE_OPTIONS}
              value={resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude] ?? ""}
              onChange={(next) =>
                setSingle(MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude, next as string)
              }
            />
            <CouplePlanningChipSelect
              label="Any line dances you'd welcome?"
              optionalHint="Optional — select any you'd enjoy."
              mode="multi"
              options={MUSIC_PROFILE_LINE_DANCE_PICK_OPTIONS}
              value={parseMusicProfileLineDancesPickAnswer(
                resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.lineDancesPick],
              )}
              onChange={(next) =>
                setChips(MUSIC_PROFILE_QUESTION_IDS.lineDancesPick, next as string[])
              }
            />
          </div>
        ),
        renderReview: () => (
          <div className="space-y-4">
            {renderSingleReview(
              "How do you feel about line dances?",
              resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude],
            )}
            {renderChipReview(
              "Any line dances you'd welcome?",
              parseMusicProfileLineDancesPickAnswer(
                resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.lineDancesPick],
              ),
            )}
          </div>
        ),
      },
      {
        id: "music-profile-other-notes",
        optional: true,
        isAnswered: () => true,
        renderGuided: () => (
          <div className={planningQuestionFieldShellClass}>
            <TextArea
              id="music-profile-other-notes"
              label="Anything else about your music preferences you'd like us to know?"
              value={resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.otherNotes] ?? ""}
              onChange={(next) => setSingle(MUSIC_PROFILE_QUESTION_IDS.otherNotes, next)}
              rows={4}
              placeholder="Share anything unique about your guests, culture, or dance-floor vision…"
              labelClassName={`block ${lightUiFormLabelClass}`}
            />
            <p className="mt-3 border-t border-stone-200/80 pt-3 text-xs leading-relaxed text-stone-600">
              Tell us anything unique about your guests, culture, family, music tastes, concerns, or
              vision for the dance floor.
            </p>
          </div>
        ),
        renderReview: () => (
          <div className={planningQuestionFieldShellClass}>
            <p className={lightUiFormLabelClass}>
              Anything else about your music preferences you&apos;d like us to know?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-900">
              {(resolvedAnswers[MUSIC_PROFILE_QUESTION_IDS.otherNotes] ?? "").trim() || (
                <span className="text-stone-500">No additional notes</span>
              )}
            </p>
          </div>
        ),
      },
    ];
  }, [resolvedAnswers, onAnswerChange]);

  const reviewIncompleteHint = useMemo(
    () => buildGuidedChapterReviewIncompleteHint(steps, resolvedAnswers),
    [steps, resolvedAnswers],
  );

  return (
    <CoupleGuidedQuestionSection
      sectionId="music-profile-guided"
      eyebrow="Music Profile"
      title="Let's talk about the music"
      intro="Most couples add songs over time, but before we build playlists, we'd love to understand the kind of celebration you're imagining."
      steps={steps}
      answers={resolvedAnswers}
      reviewIncompleteHint={reviewIncompleteHint}
      completionTitle="We've got your vibe."
      completionBody="Your music profile is saved. You can add songs in Music Hub anytime, but let's keep moving through your planning journey."
      onContinueToNextChapter={onContinueToNextChapter}
      continueToNextChapterLabel={continueToNextChapterLabel}
      completionSecondaryLabel="Open Music Hub"
      onCompletionSecondary={onOpenMusicHub}
      guidedResume={guidedResume}
      guidedResumeMode={guidedResumeMode}
      onGuidedResumeChange={onGuidedResumeChange}
    />
  );
}
