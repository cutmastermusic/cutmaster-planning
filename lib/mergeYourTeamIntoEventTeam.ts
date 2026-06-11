import {
  YOUR_TEAM_OTHER_PARTNER_ROLES,
  YOUR_TEAM_QUESTION_IDS,
  YOUR_TEAM_SINGLE_SLOT_ROLES,
  bookedContactIsValid,
  parseYourTeamOtherPartnersAnswer,
  parseYourTeamRoleSlotAnswer,
  type YourTeamSingleSlotRole,
} from "@/lib/coupleYourTeamPlanning";
import type { TeamMember, TeamMemberRole } from "@/types/planning";
import { isClientManagedEventTeamMember, isCutmasterEventTeamMember } from "@/utils/vendors";

const SINGLE_SLOT_QUESTION_BY_ROLE: Record<YourTeamSingleSlotRole, string> = {
  Planner: YOUR_TEAM_QUESTION_IDS.planner,
  Photographer: YOUR_TEAM_QUESTION_IDS.photographer,
  Videographer: YOUR_TEAM_QUESTION_IDS.videographer,
  Officiant: YOUR_TEAM_QUESTION_IDS.officiant,
};

const GUIDED_MANAGED_ROLES = new Set<TeamMemberRole>([
  ...YOUR_TEAM_SINGLE_SLOT_ROLES,
  ...YOUR_TEAM_OTHER_PARTNER_ROLES,
]);

function contactToTeamMember(
  role: TeamMemberRole,
  contact: { company: string; name: string; email: string; phone: string },
  existingId?: string,
): TeamMember {
  const company = contact.company.trim();
  const name = contact.name.trim();
  const resolvedCompany =
    role === "Planner" && !company && name ? name : company;
  const resolvedName = name || company;
  return {
    id: existingId ?? `tm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: resolvedName,
    role,
    company: resolvedCompany,
    email: contact.email.trim(),
    phone: contact.phone.trim(),
    notes: "",
    isActive: true,
  };
}

function membersEqual(a: TeamMember[], b: TeamMember[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((member, index) => {
    const other = b[index];
    return (
      member.id === other.id &&
      member.name === other.name &&
      member.role === other.role &&
      (member.company ?? "") === (other.company ?? "") &&
      member.email === other.email &&
      member.phone === other.phone &&
      member.isActive === other.isActive
    );
  });
}

export type MergeYourTeamIntoEventTeamInput = {
  planningQuestionAnswers: Record<string, string | undefined>;
  teamMembers: TeamMember[];
};

export type MergeYourTeamIntoEventTeamResult = {
  teamMembers: TeamMember[];
  changed: boolean;
};

export function mergeYourTeamIntoEventTeam(
  input: MergeYourTeamIntoEventTeamInput,
): MergeYourTeamIntoEventTeamResult {
  const { planningQuestionAnswers } = input;
  const preserved = input.teamMembers.filter(
    (member) =>
      isCutmasterEventTeamMember(member) ||
      !isClientManagedEventTeamMember(member) ||
      !GUIDED_MANAGED_ROLES.has(member.role),
  );

  const built: TeamMember[] = [];

  for (const role of YOUR_TEAM_SINGLE_SLOT_ROLES) {
    const questionId = SINGLE_SLOT_QUESTION_BY_ROLE[role];
    const parsed = parseYourTeamRoleSlotAnswer(planningQuestionAnswers[questionId]);
    if (parsed?.status !== "booked" || !bookedContactIsValid(parsed.contact)) continue;
    const existing = input.teamMembers.find(
      (member) =>
        member.role === role &&
        isClientManagedEventTeamMember(member) &&
        !isCutmasterEventTeamMember(member),
    );
    built.push(contactToTeamMember(role, parsed.contact!, existing?.id));
  }

  const otherParsed = parseYourTeamOtherPartnersAnswer(
    planningQuestionAnswers[YOUR_TEAM_QUESTION_IDS.otherPartners],
  );
  if (otherParsed?.status === "booked") {
    for (const partner of otherParsed.partners ?? []) {
      if (!bookedContactIsValid(partner)) continue;
      const existing = input.teamMembers.find(
        (member) =>
          member.role === partner.role &&
          isClientManagedEventTeamMember(member) &&
          !isCutmasterEventTeamMember(member),
      );
      built.push(
        contactToTeamMember(
          partner.role,
          {
            company: partner.company,
            name: partner.name,
            email: partner.email,
            phone: partner.phone,
          },
          existing?.id,
        ),
      );
    }
  }

  const coordinationNotes = (planningQuestionAnswers[YOUR_TEAM_QUESTION_IDS.coordinationNotes] ?? "").trim();
  if (coordinationNotes) {
    const plannerIndex = built.findIndex((member) => member.role === "Planner");
    if (plannerIndex >= 0) {
      built[plannerIndex] = {
        ...built[plannerIndex],
        specialCoordinationNotes: coordinationNotes,
      };
    }
  }

  const nextTeamMembers = [...preserved, ...built];
  return {
    teamMembers: nextTeamMembers,
    changed: !membersEqual(input.teamMembers, nextTeamMembers),
  };
}

export function yourTeamChapterHasMergeableBookings(
  planningQuestionAnswers: Record<string, string | undefined>,
): boolean {
  for (const role of YOUR_TEAM_SINGLE_SLOT_ROLES) {
    const parsed = parseYourTeamRoleSlotAnswer(
      planningQuestionAnswers[SINGLE_SLOT_QUESTION_BY_ROLE[role]],
    );
    if (parsed?.status === "booked" && bookedContactIsValid(parsed.contact)) return true;
  }
  const other = parseYourTeamOtherPartnersAnswer(
    planningQuestionAnswers[YOUR_TEAM_QUESTION_IDS.otherPartners],
  );
  return Boolean(other?.status === "booked" && (other.partners?.length ?? 0) > 0);
}
