"use client";

import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";

import { CouplePlanningChipSelect } from "@/components/couple-planning-chip-select";
import {
  CoupleGuidedQuestionSection,
  type CoupleGuidedQuestionStep,
  type CoupleGuidedResumeProps,
} from "@/components/couple-guided-question-section";
import { TextArea, TextInput } from "@/components/planning-ui";
import {
  couplePlanningEmptyAnswerClass,
  couplePlanningQuestionLabelClass,
  couplePlanningQuestionShellClass,
} from "@/components/couple-planning-ui";
import {
  YOUR_TEAM_OFFICIANT_DISPOSITION_OPTIONS,
  YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS,
  YOUR_TEAM_OTHER_PARTNER_ROLES,
  YOUR_TEAM_OTHER_PARTNERS_DISPOSITION_OPTIONS,
  YOUR_TEAM_PHOTOGRAPHER_DISPOSITION_OPTIONS,
  YOUR_TEAM_PLANNER_DISPOSITION_OPTIONS,
  YOUR_TEAM_QUESTION_IDS,
  YOUR_TEAM_VIDEOGRAPHER_DISPOSITION_OPTIONS,
  buildOtherPartnersFromDisposition,
  buildRoleSlotFromDisposition,
  dispositionLabelFromOtherPartners,
  dispositionLabelFromRoleSlot,
  formatYourTeamOtherPartnersForDisplay,
  formatYourTeamRoleSlotForDisplay,
  describeYourTeamChapterMissingFields,
  formatYourTeamChapterMissingSummary,
  isYourTeamOtherPartnersAnswered,
  isYourTeamRoleSlotAnswered,
  parseYourTeamOtherPartnersAnswer,
  parseYourTeamRoleSlotAnswer,
  serializeYourTeamOtherPartnersAnswer,
  serializeYourTeamRoleSlotAnswer,
  type YourTeamBookedContact,
  type YourTeamOtherPartnerEntry,
  type YourTeamOtherPartnersAnswer,
} from "@/lib/coupleYourTeamPlanning";

const YOUR_TEAM_STEP_QUESTIONS = {
  planner: "Have you hired a wedding planner or day-of coordinator yet?",
  photographer: "Have you booked your photographer yet?",
  videographer: "Have you booked a videographer?",
  officiant: "Have you chosen your officiant yet?",
  otherVendors: "Are there other vendors we should know about for your wedding day?",
  coordinationNotes:
    "Anything else about your vendors or day-of coordination we should know?",
} as const;

const OTHER_PARTNER_CHIP_OPTIONS = YOUR_TEAM_OTHER_PARTNER_ROLES.map(
  (role) => YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS[role],
);

const OTHER_PARTNER_CHIP_TO_ROLE = Object.fromEntries(
  YOUR_TEAM_OTHER_PARTNER_ROLES.map((role) => [YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS[role], role]),
) as Record<string, (typeof YOUR_TEAM_OTHER_PARTNER_ROLES)[number]>;

/** Space for portaled guided nav + bottom nav on mobile (see couple-guided-question-section). */
const MOBILE_GUIDED_NAV_CLEARANCE_PX = 180;

function revealBookedContactFields(container: HTMLElement | null) {
  if (!container || typeof window === "undefined") return;
  if (!window.matchMedia("(max-width: 767px)").matches) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollBehavior = reduceMotion ? ("auto" as const) : ("smooth" as const);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const firstInput = container.querySelector<HTMLElement>(
        "input:not([type='hidden']), textarea, select",
      );
      const scrollTarget = firstInput ?? container;

      scrollTarget.scrollIntoView({
        behavior: scrollBehavior,
        block: "center",
      });

      if (firstInput) {
        firstInput.focus({ preventScroll: true });
      }

      window.setTimeout(
        () => {
          const rect = scrollTarget.getBoundingClientRect();
          const visibleBottom = window.innerHeight - MOBILE_GUIDED_NAV_CLEARANCE_PX;
          if (rect.bottom > visibleBottom) {
            window.scrollBy({
              top: rect.bottom - visibleBottom + 16,
              behavior: scrollBehavior,
            });
          }
          if (rect.top < 12) {
            window.scrollBy({
              top: rect.top - 12,
              behavior: scrollBehavior,
            });
          }
        },
        reduceMotion ? 0 : 280,
      );
    });
  });
}

function useRevealOnBooked(status: string | undefined, containerRef: RefObject<HTMLElement | null>) {
  const wasBookedRef = useRef(status === "booked");

  useEffect(() => {
    const isBooked = status === "booked";
    if (isBooked && !wasBookedRef.current) {
      revealBookedContactFields(containerRef.current);
    }
    wasBookedRef.current = isBooked;
  }, [status, containerRef]);
}

export type CoupleYourTeamGuidedSectionProps = {
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  onOpenEventTeam: (answers: Record<string, string | undefined>) => void | Promise<void>;
  onContinueToNextChapter: (answers: Record<string, string | undefined>) => void | Promise<void>;
  continueToNextChapterLabel: string;
  continueBlockedMessage?: string | null;
} & CoupleGuidedResumeProps;

const bookedContactPromptClass =
  "rounded-xl border border-stone-200/60 bg-[#f8f6f2]/80 px-4 py-3 text-sm font-medium leading-snug text-stone-800";

function ContactFields({
  contact,
  onChange,
  idPrefix,
}: {
  contact: YourTeamBookedContact;
  onChange: (next: YourTeamBookedContact) => void;
  idPrefix: string;
}) {
  return (
    <div className="mt-3 space-y-3">
      <TextInput
        id={`${idPrefix}-company`}
        label="Business or studio name"
        value={contact.company}
        onChange={(next) => onChange({ ...contact, company: next })}
        placeholder="Optional if you add a contact name"
      />
      <TextInput
        id={`${idPrefix}-contact-name`}
        label="Contact name"
        value={contact.name}
        onChange={(next) => onChange({ ...contact, name: next })}
        placeholder="Who should we reach on the day?"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput
          id={`${idPrefix}-email`}
          label="Email"
          value={contact.email}
          onChange={(next) => onChange({ ...contact, email: next })}
          placeholder="Optional"
        />
        <TextInput
          id={`${idPrefix}-phone`}
          label="Phone"
          value={contact.phone}
          onChange={(next) => onChange({ ...contact, phone: next })}
          placeholder="Optional"
        />
      </div>
      <p className="text-xs leading-relaxed text-stone-600">
        A business name or contact name is enough—we can fill in the rest later.
      </p>
    </div>
  );
}

function RoleSlotStep({
  questionId,
  label,
  dispositionOptions,
  answers,
  onAnswerChange,
}: {
  questionId: string;
  label: string;
  dispositionOptions: readonly string[];
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
}) {
  const parsed = parseYourTeamRoleSlotAnswer(answers[questionId]);
  const disposition = dispositionLabelFromRoleSlot(questionId, answers[questionId]);
  const contact = parsed?.contact ?? { company: "", name: "", email: "", phone: "" };
  const contactSectionRef = useRef<HTMLDivElement>(null);

  useRevealOnBooked(parsed?.status, contactSectionRef);

  return (
    <div className={couplePlanningQuestionShellClass}>
      <CouplePlanningChipSelect
        label={label}
        mode="single"
        options={dispositionOptions}
        value={disposition}
        onChange={(next) => {
          const dispositionValue = next as string;
          const built = buildRoleSlotFromDisposition(questionId, dispositionValue, contact);
          if (!built) {
            onAnswerChange(questionId, "");
            return;
          }
          onAnswerChange(questionId, serializeYourTeamRoleSlotAnswer(built));
        }}
      />
      {parsed?.status === "booked" ? (
        <div
          ref={contactSectionRef}
          className="mt-4 border-t border-stone-200/80 pt-4"
        >
          <p className={bookedContactPromptClass}>
            Great — add their details below.
          </p>
          <ContactFields
            idPrefix={`your-team-${questionId}`}
            contact={contact}
            onChange={(next) =>
              onAnswerChange(
                questionId,
                serializeYourTeamRoleSlotAnswer({ status: "booked", contact: next }),
              )
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function OtherPartnersStep({
  answers,
  onAnswerChange,
}: {
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
}) {
  const questionId = YOUR_TEAM_QUESTION_IDS.otherPartners;
  const parsed: YourTeamOtherPartnersAnswer =
    parseYourTeamOtherPartnersAnswer(answers[questionId]) ?? { status: "not_booked" };
  const disposition = dispositionLabelFromOtherPartners(answers[questionId]);
  const bookedSectionRef = useRef<HTMLDivElement>(null);
  const partnerBlockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevPartnerRolesRef = useRef<string[]>([]);

  useRevealOnBooked(parsed.status, bookedSectionRef);

  const partnerRolesKey = (parsed.partners ?? []).map((partner) => partner.role).join("\u0000");

  useEffect(() => {
    if (parsed.status !== "booked") {
      prevPartnerRolesRef.current = [];
      return;
    }
    const roles = partnerRolesKey ? partnerRolesKey.split("\u0000") : [];
    const addedRole = roles.find((role) => !prevPartnerRolesRef.current.includes(role));
    prevPartnerRolesRef.current = roles;
    if (addedRole) {
      revealBookedContactFields(partnerBlockRefs.current[addedRole]);
    }
  }, [parsed.status, partnerRolesKey]);

  const selectedChips =
    parsed.status === "booked"
      ? (parsed.partners ?? []).map(
          (partner) =>
            YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS[
              partner.role as keyof typeof YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS
            ],
        )
      : [];

  const setPartners = (partners: YourTeamOtherPartnerEntry[]) => {
    onAnswerChange(
      questionId,
      serializeYourTeamOtherPartnersAnswer({ status: "booked", partners }),
    );
  };

  const upsertPartner = (role: YourTeamOtherPartnerEntry["role"], patch: Partial<YourTeamBookedContact>) => {
    if (parsed.status !== "booked") return;
    const current = parsed.partners ?? [];
    const index = current.findIndex((entry) => entry.role === role);
    if (index === -1) {
      setPartners([
        ...current,
        { role, company: "", name: "", email: "", phone: "", ...patch },
      ]);
      return;
    }
    const next = [...current];
    next[index] = { ...next[index], ...patch };
    setPartners(next);
  };

  return (
    <div className={couplePlanningQuestionShellClass}>
      <CouplePlanningChipSelect
        label={YOUR_TEAM_STEP_QUESTIONS.otherVendors}
        mode="single"
        options={YOUR_TEAM_OTHER_PARTNERS_DISPOSITION_OPTIONS}
        value={disposition}
            onChange={(next) => {
              const built = buildOtherPartnersFromDisposition(
                next as string,
                parsed.status === "booked" ? parsed : undefined,
              );
          if (!built) {
            onAnswerChange(questionId, "");
            return;
          }
          onAnswerChange(questionId, serializeYourTeamOtherPartnersAnswer(built));
        }}
      />
      {parsed.status === "booked" ? (
        <div ref={bookedSectionRef} className="mt-4 space-y-4 border-t border-stone-200/80 pt-4">
          <p className={bookedContactPromptClass}>
            Select each vendor below and add their contact info.
          </p>
          <CouplePlanningChipSelect
            label="Which vendors should we know about?"
            mode="multi"
            options={OTHER_PARTNER_CHIP_OPTIONS}
            value={selectedChips}
            onChange={(next) => {
              const labels = next as string[];
              const roles = labels
                .map((label) => OTHER_PARTNER_CHIP_TO_ROLE[label])
                .filter(Boolean);
              const existing = parsed.status === "booked" ? (parsed.partners ?? []) : [];
              const partners = roles.map((role) => {
                const prior = existing.find((entry) => entry.role === role);
                return (
                  prior ?? {
                    role,
                    company: "",
                    name: "",
                    email: "",
                    phone: "",
                  }
                );
              });
              setPartners(partners);
            }}
          />
          {parsed.status === "booked"
            ? (parsed.partners ?? []).map((partner) => (
            <div
              key={partner.role}
              ref={(node) => {
                partnerBlockRefs.current[partner.role] = node;
              }}
              className="rounded-xl border border-stone-200 bg-white/80 px-4 py-4"
            >
              <p className="text-sm font-semibold text-stone-950">
                {YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS[partner.role as keyof typeof YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS]}
              </p>
              <ContactFields
                idPrefix={`your-team-other-${partner.role}`}
                contact={partner}
                onChange={(next) => upsertPartner(partner.role, next)}
              />
              </div>
            ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

export function CoupleYourTeamGuidedSection({
  answers,
  onAnswerChange,
  onOpenEventTeam,
  onContinueToNextChapter,
  continueToNextChapterLabel,
  continueBlockedMessage = null,
  guidedResume,
  guidedResumeMode,
  onGuidedResumeChange,
}: CoupleYourTeamGuidedSectionProps) {
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const handleAnswerChange = useCallback(
    (questionId: string, next: string) => {
      answersRef.current = { ...answersRef.current, [questionId]: next };
      onAnswerChange(questionId, next);
    },
    [onAnswerChange],
  );

  const reviewIncompleteHint = useMemo(() => {
    const missing = describeYourTeamChapterMissingFields(answers);
    return formatYourTeamChapterMissingSummary(missing);
  }, [answers]);
  const steps = useMemo((): CoupleGuidedQuestionStep[] => {
    const renderRoleReview = (questionId: string, label: string) => (
      <div className={couplePlanningQuestionShellClass}>
        <p className={couplePlanningQuestionLabelClass}>{label}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-900">
          {formatYourTeamRoleSlotForDisplay(answers[questionId])}
        </p>
      </div>
    );

    return [
      {
        id: "your-team-planner",
        isAnswered: (nextAnswers) =>
          isYourTeamRoleSlotAnswered(nextAnswers[YOUR_TEAM_QUESTION_IDS.planner]),
        renderGuided: () => (
          <RoleSlotStep
            questionId={YOUR_TEAM_QUESTION_IDS.planner}
            label={YOUR_TEAM_STEP_QUESTIONS.planner}
            dispositionOptions={YOUR_TEAM_PLANNER_DISPOSITION_OPTIONS}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        ),
        renderReview: () =>
          renderRoleReview(YOUR_TEAM_QUESTION_IDS.planner, YOUR_TEAM_STEP_QUESTIONS.planner),
      },
      {
        id: "your-team-photographer",
        isAnswered: (nextAnswers) =>
          isYourTeamRoleSlotAnswered(nextAnswers[YOUR_TEAM_QUESTION_IDS.photographer]),
        renderGuided: () => (
          <RoleSlotStep
            questionId={YOUR_TEAM_QUESTION_IDS.photographer}
            label={YOUR_TEAM_STEP_QUESTIONS.photographer}
            dispositionOptions={YOUR_TEAM_PHOTOGRAPHER_DISPOSITION_OPTIONS}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        ),
        renderReview: () =>
          renderRoleReview(
            YOUR_TEAM_QUESTION_IDS.photographer,
            YOUR_TEAM_STEP_QUESTIONS.photographer,
          ),
      },
      {
        id: "your-team-videographer",
        isAnswered: (nextAnswers) =>
          isYourTeamRoleSlotAnswered(nextAnswers[YOUR_TEAM_QUESTION_IDS.videographer]),
        renderGuided: () => (
          <RoleSlotStep
            questionId={YOUR_TEAM_QUESTION_IDS.videographer}
            label={YOUR_TEAM_STEP_QUESTIONS.videographer}
            dispositionOptions={YOUR_TEAM_VIDEOGRAPHER_DISPOSITION_OPTIONS}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        ),
        renderReview: () =>
          renderRoleReview(
            YOUR_TEAM_QUESTION_IDS.videographer,
            YOUR_TEAM_STEP_QUESTIONS.videographer,
          ),
      },
      {
        id: "your-team-officiant",
        isAnswered: (nextAnswers) =>
          isYourTeamRoleSlotAnswered(nextAnswers[YOUR_TEAM_QUESTION_IDS.officiant]),
        renderGuided: () => (
          <RoleSlotStep
            questionId={YOUR_TEAM_QUESTION_IDS.officiant}
            label={YOUR_TEAM_STEP_QUESTIONS.officiant}
            dispositionOptions={YOUR_TEAM_OFFICIANT_DISPOSITION_OPTIONS}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        ),
        renderReview: () =>
          renderRoleReview(YOUR_TEAM_QUESTION_IDS.officiant, YOUR_TEAM_STEP_QUESTIONS.officiant),
      },
      {
        id: "your-team-other-partners",
        isAnswered: (nextAnswers) =>
          isYourTeamOtherPartnersAnswered(nextAnswers[YOUR_TEAM_QUESTION_IDS.otherPartners]),
        renderGuided: () => <OtherPartnersStep answers={answers} onAnswerChange={onAnswerChange} />,
        renderReview: () => (
          <div className={couplePlanningQuestionShellClass}>
            <p className={couplePlanningQuestionLabelClass}>{YOUR_TEAM_STEP_QUESTIONS.otherVendors}</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-900">
              {formatYourTeamOtherPartnersForDisplay(answers[YOUR_TEAM_QUESTION_IDS.otherPartners])}
            </p>
          </div>
        ),
      },
      {
        id: "your-team-coordination-notes",
        optional: true,
        isAnswered: () => true,
        renderGuided: () => (
          <div className={couplePlanningQuestionShellClass}>
            <TextArea
              id="your-team-coordination-notes"
              label={YOUR_TEAM_STEP_QUESTIONS.coordinationNotes}
              value={answers[YOUR_TEAM_QUESTION_IDS.coordinationNotes] ?? ""}
              onChange={(next) => onAnswerChange(YOUR_TEAM_QUESTION_IDS.coordinationNotes, next)}
              rows={4}
              placeholder="Parking, load-in, special requests, or vendors you're still waiting to confirm…"
              labelClassName={`block ${couplePlanningQuestionLabelClass}`}
            />
          </div>
        ),
        renderReview: () => (
          <div className={couplePlanningQuestionShellClass}>
            <p className={couplePlanningQuestionLabelClass}>{YOUR_TEAM_STEP_QUESTIONS.coordinationNotes}</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-900">
              {(answers[YOUR_TEAM_QUESTION_IDS.coordinationNotes] ?? "").trim() || (
                <span className={couplePlanningEmptyAnswerClass}>Nothing added—totally fine</span>
              )}
            </p>
          </div>
        ),
      },
    ];
  }, [answers, handleAnswerChange]);

  return (
    <CoupleGuidedQuestionSection
      sectionId="your-team-guided"
      eyebrow="Your Team"
      title="Tell us about your wedding vendors"
      intro="We'll go one vendor at a time. Share who's booked—or let us know what's still on your list."
      steps={steps}
      answers={answers}
      completionTitle="You're all set for now."
      completionBody="We'll keep your vendor contacts handy for day-of coordination. You can add or update details anytime."
      reviewIncompleteHint={reviewIncompleteHint}
      continueBlockedMessage={continueBlockedMessage}
      onContinueToNextChapter={() => onContinueToNextChapter(answersRef.current)}
      continueToNextChapterLabel={continueToNextChapterLabel}
      completionSecondaryLabel="Manage vendor contacts"
      onCompletionSecondary={() => onOpenEventTeam(answersRef.current)}
      guidedResume={guidedResume}
      guidedResumeMode={guidedResumeMode}
      onGuidedResumeChange={onGuidedResumeChange}
    />
  );
}
