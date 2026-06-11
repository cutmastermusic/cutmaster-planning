import type { TeamMember, VendorType } from "@/types/planning";
import { isClientManagedEventTeamMember, isCutmasterEventTeamMember } from "@/utils/vendors";

export const YOUR_TEAM_QUESTION_IDS = {
  planner: "pq_team_planner",
  photographer: "pq_team_photographer",
  videographer: "pq_team_videographer",
  officiant: "pq_team_officiant",
  otherPartners: "pq_team_other_partners",
  coordinationNotes: "pq_team_coordination_notes",
} as const;

export const YOUR_TEAM_REQUIRED_QUESTION_IDS = [
  YOUR_TEAM_QUESTION_IDS.planner,
  YOUR_TEAM_QUESTION_IDS.photographer,
  YOUR_TEAM_QUESTION_IDS.videographer,
  YOUR_TEAM_QUESTION_IDS.officiant,
  YOUR_TEAM_QUESTION_IDS.otherPartners,
] as const;

export const YOUR_TEAM_GUIDED_STEP_COUNT = 6;

export type YourTeamSlotDisposition = "booked" | "not_booked" | "not_using";

export type YourTeamBookedContact = {
  company: string;
  name: string;
  email: string;
  phone: string;
};

export type YourTeamRoleSlotAnswer = {
  status: YourTeamSlotDisposition;
  contact?: YourTeamBookedContact;
};

export type YourTeamOtherPartnerEntry = YourTeamBookedContact & {
  role: YourTeamOtherPartnerRole;
};

export type YourTeamOtherPartnersAnswer = {
  status: YourTeamSlotDisposition;
  partners?: YourTeamOtherPartnerEntry[];
};

export const YOUR_TEAM_SINGLE_SLOT_ROLES = [
  "Planner",
  "Photographer",
  "Videographer",
  "Officiant",
] as const satisfies readonly VendorType[];

export type YourTeamSingleSlotRole = (typeof YOUR_TEAM_SINGLE_SLOT_ROLES)[number];

export const YOUR_TEAM_OTHER_PARTNER_ROLES = [
  "Caterer",
  "Florist",
  "Hair/Makeup",
  "Transportation",
  "Photo Booth",
  "Content Creator",
  "Other",
] as const satisfies readonly VendorType[];

export type YourTeamOtherPartnerRole = (typeof YOUR_TEAM_OTHER_PARTNER_ROLES)[number];

function isYourTeamOtherPartnerRole(role: string): role is YourTeamOtherPartnerRole {
  return (YOUR_TEAM_OTHER_PARTNER_ROLES as readonly string[]).includes(role);
}

export const YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS: Record<
  YourTeamOtherPartnerRole,
  string
> = {
  Caterer: "Catering",
  Florist: "Florist",
  "Hair/Makeup": "Hair & makeup",
  Transportation: "Transportation",
  "Photo Booth": "Photo booth",
  "Content Creator": "Content creator",
  Other: "Other",
};

export const YOUR_TEAM_PLANNER_DISPOSITION_OPTIONS = [
  "Yes, we've hired one",
  "Not yet",
  "We're planning on our own",
] as const;

export const YOUR_TEAM_PHOTOGRAPHER_DISPOSITION_OPTIONS = [
  "Yes, we've booked one",
  "Not yet",
  "Still deciding",
] as const;

export const YOUR_TEAM_VIDEOGRAPHER_DISPOSITION_OPTIONS = [
  "Yes, we've booked one",
  "Not yet",
  "We're skipping videography",
] as const;

export const YOUR_TEAM_OFFICIANT_DISPOSITION_OPTIONS = [
  "Yes, we've chosen one",
  "Not yet",
  "Still deciding",
] as const;

export const YOUR_TEAM_OTHER_PARTNERS_DISPOSITION_OPTIONS = [
  "Yes, a few others",
  "Not right now",
] as const;

const PLANNER_DISPOSITION_TO_STATUS: Record<
  (typeof YOUR_TEAM_PLANNER_DISPOSITION_OPTIONS)[number],
  YourTeamSlotDisposition
> = {
  "Yes, we've hired one": "booked",
  "Not yet": "not_booked",
  "We're planning on our own": "not_using",
};

const PHOTOGRAPHER_DISPOSITION_TO_STATUS: Record<
  (typeof YOUR_TEAM_PHOTOGRAPHER_DISPOSITION_OPTIONS)[number],
  YourTeamSlotDisposition
> = {
  "Yes, we've booked one": "booked",
  "Not yet": "not_booked",
  "Still deciding": "not_booked",
};

const VIDEOGRAPHER_DISPOSITION_TO_STATUS: Record<
  (typeof YOUR_TEAM_VIDEOGRAPHER_DISPOSITION_OPTIONS)[number],
  YourTeamSlotDisposition
> = {
  "Yes, we've booked one": "booked",
  "Not yet": "not_booked",
  "We're skipping videography": "not_using",
};

const OFFICIANT_DISPOSITION_TO_STATUS: Record<
  (typeof YOUR_TEAM_OFFICIANT_DISPOSITION_OPTIONS)[number],
  YourTeamSlotDisposition
> = {
  "Yes, we've chosen one": "booked",
  "Not yet": "not_booked",
  "Still deciding": "not_booked",
};

const OTHER_PARTNERS_DISPOSITION_TO_STATUS: Record<
  (typeof YOUR_TEAM_OTHER_PARTNERS_DISPOSITION_OPTIONS)[number],
  YourTeamSlotDisposition
> = {
  "Yes, a few others": "booked",
  "Not right now": "not_booked",
};

function emptyContact(): YourTeamBookedContact {
  return { company: "", name: "", email: "", phone: "" };
}

export function bookedContactIsValid(contact: YourTeamBookedContact | undefined): boolean {
  if (!contact) return false;
  return Boolean(contact.company.trim() || contact.name.trim());
}

export function parseYourTeamRoleSlotAnswer(raw: string | undefined): YourTeamRoleSlotAnswer | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const status = (parsed as { status?: unknown }).status;
    if (status !== "booked" && status !== "not_booked" && status !== "not_using") return null;
    const contactRaw = (parsed as { contact?: unknown }).contact;
    if (status === "booked") {
      if (!contactRaw || typeof contactRaw !== "object") return { status, contact: emptyContact() };
      const contact = contactRaw as Record<string, unknown>;
      return {
        status,
        contact: {
          company: typeof contact.company === "string" ? contact.company : "",
          name: typeof contact.name === "string" ? contact.name : "",
          email: typeof contact.email === "string" ? contact.email : "",
          phone: typeof contact.phone === "string" ? contact.phone : "",
        },
      };
    }
    return { status };
  } catch {
    return null;
  }
}

export function serializeYourTeamRoleSlotAnswer(answer: YourTeamRoleSlotAnswer): string {
  return JSON.stringify(answer);
}

export function parseYourTeamOtherPartnersAnswer(raw: string | undefined): YourTeamOtherPartnersAnswer | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const status = (parsed as { status?: unknown }).status;
    if (status !== "booked" && status !== "not_booked" && status !== "not_using") return null;
    const partnersRaw = (parsed as { partners?: unknown }).partners;
    const partners = Array.isArray(partnersRaw)
      ? partnersRaw
          .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const row = entry as Record<string, unknown>;
            const role = row.role;
            if (typeof role !== "string" || !isYourTeamOtherPartnerRole(role)) {
              return null;
            }
            return {
              role,
              company: typeof row.company === "string" ? row.company : "",
              name: typeof row.name === "string" ? row.name : "",
              email: typeof row.email === "string" ? row.email : "",
              phone: typeof row.phone === "string" ? row.phone : "",
            };
          })
          .filter((entry): entry is YourTeamOtherPartnerEntry => entry !== null)
      : [];
    return { status, partners: status === "booked" ? partners : undefined };
  } catch {
    return null;
  }
}

export function serializeYourTeamOtherPartnersAnswer(answer: YourTeamOtherPartnersAnswer): string {
  return JSON.stringify(answer);
}

export function isYourTeamRoleSlotAnswered(raw: string | undefined): boolean {
  const parsed = parseYourTeamRoleSlotAnswer(raw);
  if (!parsed) return false;
  if (parsed.status !== "booked") return true;
  return bookedContactIsValid(parsed.contact);
}

export function isYourTeamOtherPartnersAnswered(raw: string | undefined): boolean {
  const parsed = parseYourTeamOtherPartnersAnswer(raw);
  if (!parsed) return false;
  if (parsed.status !== "booked") return true;
  const partners = parsed.partners ?? [];
  return partners.length > 0 && partners.every((partner) => bookedContactIsValid(partner));
}

export function computeYourTeamChapterCompletionPct(
  answers: Record<string, string | undefined>,
): number {
  const checks = YOUR_TEAM_REQUIRED_QUESTION_IDS.map((questionId) => {
    if (questionId === YOUR_TEAM_QUESTION_IDS.otherPartners) {
      return isYourTeamOtherPartnersAnswered(answers[questionId]);
    }
    return isYourTeamRoleSlotAnswered(answers[questionId]);
  });
  const answered = checks.filter(Boolean).length;
  return Math.round((answered / checks.length) * 100);
}

export function isYourTeamChapterComplete(answers: Record<string, string | undefined>): boolean {
  return computeYourTeamChapterCompletionPct(answers) >= 100;
}

export function formatYourTeamRoleSlotForDisplay(raw: string | undefined): string {
  const parsed = parseYourTeamRoleSlotAnswer(raw);
  if (!parsed) return "Not answered yet";
  if (parsed.status === "not_booked") return "Not yet";
  if (parsed.status === "not_using") return "Not part of our plans";
  const contact = parsed.contact;
  if (!contact || !bookedContactIsValid(contact)) return "Booked — add a name or business";
  const parts = [contact.company.trim(), contact.name.trim()].filter(Boolean);
  const contactLine = [contact.email.trim(), contact.phone.trim()].filter(Boolean).join(" · ");
  return contactLine ? `${parts.join(" · ")} (${contactLine})` : parts.join(" · ");
}

export function formatYourTeamOtherPartnersForDisplay(raw: string | undefined): string {
  const parsed = parseYourTeamOtherPartnersAnswer(raw);
  if (!parsed) return "Not answered yet";
  if (parsed.status === "not_booked") return "None right now";
  if (parsed.status === "not_using") return "Not part of our plans";
  const partners = parsed.partners ?? [];
  if (partners.length === 0) return "Add at least one vendor";
  return partners
    .map((partner) => {
      const label = YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS[partner.role as keyof typeof YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS] ?? partner.role;
      const who = [partner.company.trim(), partner.name.trim()].filter(Boolean).join(" · ");
      return who ? `${label}: ${who}` : label;
    })
    .join("; ");
}

function teamMemberToSlotAnswer(member: TeamMember): YourTeamRoleSlotAnswer {
  return {
    status: "booked",
    contact: {
      company: member.company?.trim() ?? "",
      name: member.name.trim(),
      email: member.email.trim(),
      phone: member.phone.trim(),
    },
  };
}

function findClientManagedMemberByRole(
  teamMembers: TeamMember[],
  role: YourTeamSingleSlotRole,
): TeamMember | undefined {
  return teamMembers.find(
    (member) =>
      member.role === role &&
      member.isActive !== false &&
      isClientManagedEventTeamMember(member) &&
      !isCutmasterEventTeamMember(member),
  );
}

export type BuildYourTeamPrefillInput = {
  answers: Record<string, string | undefined>;
  teamMembers: TeamMember[];
  plannerName: string;
  plannerEmail: string;
  officiantName: string;
};

/** Fill only missing Your Team answers from Event Team, Event Settings, or Ceremony. */
export function buildYourTeamPrefillAnswers(input: BuildYourTeamPrefillInput): Record<string, string> {
  const next: Record<string, string> = {};
  const { answers, teamMembers } = input;

  const maybePrefillRole = (questionId: string, role: YourTeamSingleSlotRole) => {
    if ((answers[questionId] ?? "").trim()) return;
    const existing = findClientManagedMemberByRole(teamMembers, role);
    if (existing) {
      next[questionId] = serializeYourTeamRoleSlotAnswer(teamMemberToSlotAnswer(existing));
    }
  };

  maybePrefillRole(YOUR_TEAM_QUESTION_IDS.planner, "Planner");
  maybePrefillRole(YOUR_TEAM_QUESTION_IDS.photographer, "Photographer");
  maybePrefillRole(YOUR_TEAM_QUESTION_IDS.videographer, "Videographer");
  maybePrefillRole(YOUR_TEAM_QUESTION_IDS.officiant, "Officiant");

  if (!(answers[YOUR_TEAM_QUESTION_IDS.planner] ?? "").trim()) {
    const plannerName = input.plannerName.trim();
    const plannerEmail = input.plannerEmail.trim();
    if (plannerName || plannerEmail) {
      next[YOUR_TEAM_QUESTION_IDS.planner] = serializeYourTeamRoleSlotAnswer({
        status: "booked",
        contact: {
          company: "",
          name: plannerName,
          email: plannerEmail,
          phone: "",
        },
      });
    }
  }

  if (!(answers[YOUR_TEAM_QUESTION_IDS.officiant] ?? "").trim()) {
    const officiantName = input.officiantName.trim();
    if (officiantName) {
      next[YOUR_TEAM_QUESTION_IDS.officiant] = serializeYourTeamRoleSlotAnswer({
        status: "booked",
        contact: {
          company: "",
          name: officiantName,
          email: "",
          phone: "",
        },
      });
    }
  }

  if (!(answers[YOUR_TEAM_QUESTION_IDS.otherPartners] ?? "").trim()) {
    const partners = teamMembers
      .filter(
        (member) =>
          member.isActive !== false &&
          isClientManagedEventTeamMember(member) &&
          !isCutmasterEventTeamMember(member) &&
          YOUR_TEAM_OTHER_PARTNER_ROLES.includes(member.role as YourTeamOtherPartnerRole),
      )
      .map((member) => ({
        role: member.role as YourTeamOtherPartnerRole,
        company: member.company?.trim() ?? "",
        name: member.name.trim(),
        email: member.email.trim(),
        phone: member.phone.trim(),
      }));
    if (partners.length > 0) {
      next[YOUR_TEAM_QUESTION_IDS.otherPartners] = serializeYourTeamOtherPartnersAnswer({
        status: "booked",
        partners,
      });
    }
  }

  return next;
}

export function buildRoleSlotFromDisposition(
  questionId: string,
  disposition: string,
  existingContact?: YourTeamBookedContact,
): YourTeamRoleSlotAnswer | null {
  const contact = existingContact ?? emptyContact();
  if (questionId === YOUR_TEAM_QUESTION_IDS.planner) {
    const status = PLANNER_DISPOSITION_TO_STATUS[disposition as keyof typeof PLANNER_DISPOSITION_TO_STATUS];
    if (!status) return null;
    return status === "booked" ? { status, contact } : { status };
  }
  if (questionId === YOUR_TEAM_QUESTION_IDS.photographer) {
    const status =
      PHOTOGRAPHER_DISPOSITION_TO_STATUS[disposition as keyof typeof PHOTOGRAPHER_DISPOSITION_TO_STATUS];
    if (!status) return null;
    return status === "booked" ? { status, contact } : { status };
  }
  if (questionId === YOUR_TEAM_QUESTION_IDS.videographer) {
    const status =
      VIDEOGRAPHER_DISPOSITION_TO_STATUS[disposition as keyof typeof VIDEOGRAPHER_DISPOSITION_TO_STATUS];
    if (!status) return null;
    return status === "booked" ? { status, contact } : { status };
  }
  if (questionId === YOUR_TEAM_QUESTION_IDS.officiant) {
    const status =
      OFFICIANT_DISPOSITION_TO_STATUS[disposition as keyof typeof OFFICIANT_DISPOSITION_TO_STATUS];
    if (!status) return null;
    return status === "booked" ? { status, contact } : { status };
  }
  return null;
}

export function dispositionLabelFromRoleSlot(questionId: string, raw: string | undefined): string {
  const parsed = parseYourTeamRoleSlotAnswer(raw);
  if (!parsed) return "";
  if (questionId === YOUR_TEAM_QUESTION_IDS.planner) {
    if (parsed.status === "booked") return YOUR_TEAM_PLANNER_DISPOSITION_OPTIONS[0];
    if (parsed.status === "not_using") return YOUR_TEAM_PLANNER_DISPOSITION_OPTIONS[2];
    return YOUR_TEAM_PLANNER_DISPOSITION_OPTIONS[1];
  }
  if (questionId === YOUR_TEAM_QUESTION_IDS.photographer) {
    if (parsed.status === "booked") return YOUR_TEAM_PHOTOGRAPHER_DISPOSITION_OPTIONS[0];
    return YOUR_TEAM_PHOTOGRAPHER_DISPOSITION_OPTIONS[1];
  }
  if (questionId === YOUR_TEAM_QUESTION_IDS.videographer) {
    if (parsed.status === "booked") return YOUR_TEAM_VIDEOGRAPHER_DISPOSITION_OPTIONS[0];
    if (parsed.status === "not_using") return YOUR_TEAM_VIDEOGRAPHER_DISPOSITION_OPTIONS[2];
    return YOUR_TEAM_VIDEOGRAPHER_DISPOSITION_OPTIONS[1];
  }
  if (questionId === YOUR_TEAM_QUESTION_IDS.officiant) {
    if (parsed.status === "booked") return YOUR_TEAM_OFFICIANT_DISPOSITION_OPTIONS[0];
    return YOUR_TEAM_OFFICIANT_DISPOSITION_OPTIONS[1];
  }
  return "";
}

export function buildOtherPartnersFromDisposition(
  disposition: string,
  existing?: YourTeamOtherPartnersAnswer,
): YourTeamOtherPartnersAnswer | null {
  const status =
    OTHER_PARTNERS_DISPOSITION_TO_STATUS[
      disposition as keyof typeof OTHER_PARTNERS_DISPOSITION_TO_STATUS
    ];
  if (!status) return null;
  if (status === "booked") {
    return {
      status,
      partners: existing?.partners?.length ? existing.partners : [],
    };
  }
  return { status };
}

export function dispositionLabelFromOtherPartners(raw: string | undefined): string {
  const parsed = parseYourTeamOtherPartnersAnswer(raw);
  if (!parsed) return "";
  return parsed.status === "booked"
    ? YOUR_TEAM_OTHER_PARTNERS_DISPOSITION_OPTIONS[0]
    : YOUR_TEAM_OTHER_PARTNERS_DISPOSITION_OPTIONS[1];
}

export function countYourTeamRequiredStepsAnswered(
  answers: Record<string, string | undefined>,
): number {
  return YOUR_TEAM_REQUIRED_QUESTION_IDS.filter((questionId) => {
    if (questionId === YOUR_TEAM_QUESTION_IDS.otherPartners) {
      return isYourTeamOtherPartnersAnswered(answers[questionId]);
    }
    return isYourTeamRoleSlotAnswered(answers[questionId]);
  }).length;
}

export function yourTeamChapterHasBookedAnswers(
  answers: Record<string, string | undefined>,
): boolean {
  for (const questionId of YOUR_TEAM_REQUIRED_QUESTION_IDS) {
    if (questionId === YOUR_TEAM_QUESTION_IDS.otherPartners) {
      const other = parseYourTeamOtherPartnersAnswer(answers[questionId]);
      if (other?.status === "booked" && (other.partners?.length ?? 0) > 0) return true;
      continue;
    }
    const parsed = parseYourTeamRoleSlotAnswer(answers[questionId]);
    if (parsed?.status === "booked" && bookedContactIsValid(parsed.contact)) return true;
  }
  return false;
}
