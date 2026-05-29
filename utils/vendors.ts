import type {
  InternalTeamRole,
  TeamMember,
  TeamMemberRole,
  Vendor,
  VendorAffiliation,
  VendorType,
} from "@/types/planning";

/** Ordered list for add/edit vendor dropdown (aligned with event-team UX categories). */
export const VENDOR_TYPES_ORDERED: VendorType[] = [
  "Planner",
  "Photographer",
  "Videographer",
  "Venue",
  "DJ/Entertainment",
  "Caterer",
  "Bar",
  "Florist",
  "Hair/Makeup",
  "Transportation",
  "Photo Booth",
  "Officiant",
  "Content Creator",
  "Other",
];

const KNOWN_VENDOR_TYPES = new Set<string>(VENDOR_TYPES_ORDERED);

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  Planner: "Planner / Coordinator",
  Photographer: "Photographer",
  Videographer: "Videographer",
  Venue: "Venue",
  "DJ/Entertainment": "DJ / Entertainment",
  Caterer: "Catering",
  Bar: "Bar",
  Florist: "Florist",
  "Hair/Makeup": "Hair / Makeup",
  Transportation: "Transportation",
  "Photo Booth": "Photo Booth",
  Officiant: "Officiant",
  "Content Creator": "Content Creator",
  Other: "Other",
};

export type VendorSectionSpec = {
  id: string;
  label: string;
  types: VendorType[];
};

/** UI grouping for external partners (Cutmaster team uses affiliation, not these buckets). */
export const VENDOR_UI_SECTIONS: VendorSectionSpec[] = [
  { id: "planner", label: "Planner / Coordinator", types: ["Planner"] },
  { id: "photographer", label: "Photographer", types: ["Photographer"] },
  { id: "videographer", label: "Videographer", types: ["Videographer"] },
  { id: "venue", label: "Venue", types: ["Venue"] },
  { id: "dj", label: "DJ / Entertainment", types: ["DJ/Entertainment"] },
  { id: "catering", label: "Catering", types: ["Caterer"] },
  { id: "bar", label: "Bar", types: ["Bar"] },
  { id: "florist", label: "Florist", types: ["Florist"] },
  { id: "hair", label: "Hair / Makeup", types: ["Hair/Makeup"] },
  { id: "transport", label: "Transportation", types: ["Transportation"] },
  {
    id: "other",
    label: "Also involved",
    types: ["Photo Booth", "Officiant", "Content Creator", "Other"],
  },
];

export function coerceVendorType(raw: unknown): VendorType {
  if (typeof raw !== "string") return "Other";
  if (raw === "Band") return "DJ/Entertainment";
  if (KNOWN_VENDOR_TYPES.has(raw)) return raw as VendorType;
  return "Other";
}

export function normalizeVendor(raw: Partial<Vendor> & { id?: string }): Vendor {
  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id
      : `vendor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const affiliation: VendorAffiliation =
    raw.affiliation === "cutmaster_event_team" ? "cutmaster_event_team" : "event_partner";

  return {
    id,
    vendorType: coerceVendorType(raw.vendorType),
    companyName: typeof raw.companyName === "string" ? raw.companyName : "",
    contactName: typeof raw.contactName === "string" ? raw.contactName : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    website: typeof raw.website === "string" ? raw.website : "",
    instagram: typeof raw.instagram === "string" ? raw.instagram : "",
    arrivalTime: typeof raw.arrivalTime === "string" ? raw.arrivalTime : "",
    specialCoordinationNotes:
      typeof raw.specialCoordinationNotes === "string" ? raw.specialCoordinationNotes : "",
    affiliation,
  };
}

export function normalizeVendorsArray(vendors: unknown): Vendor[] {
  if (!Array.isArray(vendors)) return [];
  return vendors.map((v) => normalizeVendor(v as Partial<Vendor>));
}

export function vendorTypeLabel(type: VendorType): string {
  return VENDOR_TYPE_LABELS[type] ?? type;
}

/**
 * Roles available on the unified Event Team dropdown. Internal Cutmaster
 * staff first (Admin/DJ/Planner), then every external {@link VendorType}.
 * "Planner" appears only under Internal team to avoid an ambiguous
 * duplicate; an external coordinator should use "Planner / Coordinator"
 * via the same option.
 */
export const INTERNAL_TEAM_ROLES: InternalTeamRole[] = ["Admin", "DJ", "Planner"];

export type TeamRoleGroup = { label: string; roles: TeamMemberRole[] };

export const EVENT_TEAM_VENDOR_ROLES: TeamMemberRole[] = [
  "Planner",
  "Photographer",
  "Videographer",
  "Venue",
  "DJ/Entertainment",
  "Caterer",
  "Bar",
  "Florist",
  "Hair/Makeup",
  "Transportation",
  "Photo Booth",
  "Officiant",
  "Content Creator",
  "Other",
];

/** External vendors & day-of contacts — safe for client (couple) editing. */
export const EVENT_TEAM_VENDOR_ROLE_GROUP: TeamRoleGroup = {
  label: "Vendors & day-of contacts",
  roles: EVENT_TEAM_VENDOR_ROLES,
};

export const EVENT_TEAM_ROLE_GROUPS: TeamRoleGroup[] = [
  { label: "Internal team", roles: ["Admin", "DJ", "Planner"] },
  {
    label: "Event partners",
    roles: EVENT_TEAM_VENDOR_ROLES.filter(
      (role) => role !== "Planner",
    ) as TeamMemberRole[],
  },
];

/** Role dropdown groups for the team modal (internal staff only when allowed). */
export function eventTeamRoleGroupsForActor(canManageInternalStaff: boolean): TeamRoleGroup[] {
  if (canManageInternalStaff) {
    return EVENT_TEAM_ROLE_GROUPS;
  }
  return [EVENT_TEAM_VENDOR_ROLE_GROUP];
}

export const DEFAULT_EVENT_TEAM_VENDOR_ROLE: TeamMemberRole = "Photographer";

const TEAM_ROLE_LABEL_OVERRIDES: Partial<Record<TeamMemberRole, string>> = {
  Admin: "Admin",
  DJ: "DJ (internal)",
  Planner: "Planner / Coordinator",
  Venue: "Venue / venue contact",
  Other: "Other vendor",
};

/** Human-readable label for any unified Event Team role. */
export function teamMemberRoleLabel(role: TeamMemberRole | string): string {
  if (role in TEAM_ROLE_LABEL_OVERRIDES) {
    return TEAM_ROLE_LABEL_OVERRIDES[role as TeamMemberRole] ?? role;
  }
  if ((VENDOR_TYPE_LABELS as Record<string, string>)[role]) {
    return VENDOR_TYPE_LABELS[role as VendorType];
  }
  return role;
}

/** True if the role represents internal Cutmaster staff. */
export function isInternalTeamRole(role: TeamMemberRole | string): boolean {
  return role === "Admin" || role === "DJ" || role === "Planner";
}

/**
 * Whether a client (couple) may add/edit/remove this event-team row.
 * Admin/DJ are always staff-only; Planner without a company is treated as internal.
 */
export function isClientManagedEventTeamMember(member: Pick<TeamMember, "role" | "company">): boolean {
  if (member.role === "Admin" || member.role === "DJ") return false;
  if (member.role === "Planner" && !(member.company?.trim() ?? "")) return false;
  return true;
}

/** Role dropdown options when the actor cannot assign internal staff. */
export function canActorManageEventTeamMember(
  member: Pick<TeamMember, "role" | "company">,
  canManageInternalStaff: boolean,
): boolean {
  if (canManageInternalStaff) return true;
  return isClientManagedEventTeamMember(member);
}

export function filterVendorsByTypes(list: Vendor[], types: VendorType[]): Vendor[] {
  const set = new Set(types);
  return list.filter((v) => set.has(v.vendorType));
}

export function isCutmasterEventTeam(vendor: Vendor): boolean {
  return vendor.affiliation === "cutmaster_event_team";
}

const DOC_TYPE_RANK: Partial<Record<VendorType, number>> = {
  Planner: 2,
  Venue: 3,
  Caterer: 4,
  Photographer: 5,
  Videographer: 6,
  "DJ/Entertainment": 7,
  Bar: 8,
  Florist: 9,
  "Hair/Makeup": 10,
  Transportation: 11,
  "Photo Booth": 20,
  Officiant: 21,
  "Content Creator": 22,
  Other: 99,
};

/** Coordinator + “key” partners first, then remaining roles, alphabetically within band. */
export function sortVendorsForEventDocument(vendors: Vendor[]): Vendor[] {
  const copy = [...vendors];
  copy.sort((a, b) => {
    const ac = isCutmasterEventTeam(a) ? 0 : 1;
    const bc = isCutmasterEventTeam(b) ? 0 : 1;
    if (ac !== bc) return ac - bc;

    const ar =
      a.vendorType === "Planner"
        ? 1
        : ["Venue", "Caterer", "Photographer", "Videographer", "DJ/Entertainment"].includes(
              a.vendorType,
            )
          ? 2
          : 3;
    const br =
      b.vendorType === "Planner"
        ? 1
        : ["Venue", "Caterer", "Photographer", "Videographer", "DJ/Entertainment"].includes(
              b.vendorType,
            )
          ? 2
          : 3;
    if (ar !== br) return ar - br;

    const tr = (DOC_TYPE_RANK[a.vendorType] ?? 50) - (DOC_TYPE_RANK[b.vendorType] ?? 50);
    if (tr !== 0) return tr;

    return a.companyName.localeCompare(b.companyName, undefined, { sensitivity: "base" });
  });
  return copy;
}

/** Internal Cutmaster staff on the event team roster (not external partners with a company). */
export function isCutmasterEventTeamMember(member: Pick<TeamMember, "role" | "company">): boolean {
  if (member.role === "Admin" || member.role === "DJ") return true;
  if (member.role === "Planner" && !(member.company?.trim() ?? "")) return true;
  return false;
}

function docTeamRoleBand(role: TeamMemberRole | string): number {
  if (role === "Planner") return 1;
  if (
    ["Venue", "Caterer", "Photographer", "Videographer", "DJ/Entertainment"].includes(role)
  ) {
    return 2;
  }
  return 3;
}

/** Event Document ordering — mirrors vendor sort using unified Event Team roles. */
export function sortTeamMembersForEventDocument(members: TeamMember[]): TeamMember[] {
  const copy = members.filter((member) => member.isActive !== false);
  copy.sort((a, b) => {
    const ac = isCutmasterEventTeamMember(a) ? 0 : 1;
    const bc = isCutmasterEventTeamMember(b) ? 0 : 1;
    if (ac !== bc) return ac - bc;

    const ar = docTeamRoleBand(a.role);
    const br = docTeamRoleBand(b.role);
    if (ar !== br) return ar - br;

    const aRank = DOC_TYPE_RANK[a.role as VendorType] ?? 50;
    const bRank = DOC_TYPE_RANK[b.role as VendorType] ?? 50;
    if (aRank !== bRank) return aRank - bRank;

    const aLabel = (a.company?.trim() || a.name.trim()).toLowerCase();
    const bLabel = (b.company?.trim() || b.name.trim()).toLowerCase();
    return aLabel.localeCompare(bLabel, undefined, { sensitivity: "base" });
  });
  return copy;
}

export function formatTeamMemberContactLines(member: TeamMember): string[] {
  const lines: string[] = [];
  const role = teamMemberRoleLabel(member.role);
  const primaryName = member.name.trim() || member.company?.trim() || "Contact";
  lines.push(primaryName);
  if (member.company?.trim() && member.name.trim()) {
    lines.push(member.company.trim());
  }
  lines.push(role);
  if (member.phone.trim()) lines.push(`Phone: ${member.phone.trim()}`);
  if (member.email.trim()) lines.push(`Email: ${member.email.trim()}`);
  if (member.website?.trim()) lines.push(`Web: ${member.website.trim()}`);
  if (member.instagram?.trim()) lines.push(`Social: ${member.instagram.trim()}`);
  if (member.arrivalTime?.trim()) lines.push(`Arrival: ${member.arrivalTime.trim()}`);
  if (member.specialCoordinationNotes?.trim()) {
    lines.push(`Coordination: ${member.specialCoordinationNotes.trim()}`);
  }
  if (member.notes.trim()) lines.push(`Notes: ${member.notes.trim()}`);
  return lines;
}

export function formatVendorContactLines(vendor: Vendor): string[] {
  const lines: string[] = [];
  const role = vendorTypeLabel(vendor.vendorType);
  const primaryName = vendor.contactName.trim() || vendor.companyName.trim() || "Contact";
  lines.push(primaryName);
  if (vendor.companyName.trim() && vendor.contactName.trim()) {
    lines.push(vendor.companyName.trim());
  }
  lines.push(role);
  if (vendor.phone.trim()) lines.push(`Phone: ${vendor.phone.trim()}`);
  if (vendor.email.trim()) lines.push(`Email: ${vendor.email.trim()}`);
  if (vendor.website.trim()) lines.push(`Web: ${vendor.website.trim()}`);
  if (vendor.instagram.trim()) lines.push(`Social: ${vendor.instagram.trim()}`);
  if (vendor.arrivalTime.trim()) lines.push(`Arrival: ${vendor.arrivalTime.trim()}`);
  return lines;
}

export function smsHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `sms:${digits}`;
}
