import type { SongEntry, TeamMember, Vendor, VendorType } from "@/types/planning";

export type SongListPreviewRow = {
  id: string;
  primary: string;
  highPriority: boolean;
};

export type SongListPreviewContent = {
  rows: SongListPreviewRow[];
  moreCount: number;
  isEmpty: boolean;
};

export type RunOfShowQuickContactRow = {
  id: string;
  roleLabel: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
};

export function formatSongListPreviewLine(song: SongEntry): string {
  const title = song.title?.trim() ?? "";
  const artist = song.artist?.trim() ?? "";
  if (!title) return "";
  return artist ? `${title} — ${artist}` : title;
}

/** Compact read-only song rows for Run Of Show live reference. */
export function getSongListPreviewContent(
  songs: SongEntry[],
  maxVisible = 5,
): SongListPreviewContent {
  const entries = songs
    .filter((song) => song.title?.trim())
    .map((song) => ({
      id: song.id,
      primary: formatSongListPreviewLine(song),
      highPriority: Boolean(song.highPriority),
    }))
    .filter((row) => row.primary);

  if (entries.length === 0) {
    return { rows: [], moreCount: 0, isEmpty: true };
  }

  return {
    rows: entries.slice(0, maxVisible),
    moreCount: Math.max(0, entries.length - maxVisible),
    isEmpty: false,
  };
}

function isActiveTeamMember(member: TeamMember): boolean {
  return member.isActive !== false;
}

function firstTeamMemberByRole(
  teamMembers: TeamMember[],
  role: TeamMember["role"],
): TeamMember | null {
  return (
    teamMembers.find(
      (member) =>
        member.role === role &&
        isActiveTeamMember(member) &&
        (member.name.trim() ||
          member.company?.trim() ||
          member.phone.trim() ||
          member.email.trim()),
    ) ?? null
  );
}

function firstVendorByType(vendors: Vendor[], type: VendorType): Vendor | null {
  return (
    vendors.find(
      (vendor) =>
        vendor.vendorType === type &&
        (vendor.contactName.trim() || vendor.companyName.trim() || vendor.phone.trim() || vendor.email.trim()),
    ) ?? null
  );
}

function vendorContactRow(vendor: Vendor, roleLabel: string, id: string): RunOfShowQuickContactRow {
  const name = vendor.contactName.trim() || vendor.companyName.trim();
  return {
    id,
    roleLabel,
    name,
    company:
      vendor.contactName.trim() && vendor.companyName.trim()
        ? vendor.companyName.trim()
        : undefined,
    phone: vendor.phone.trim() || undefined,
    email: vendor.email.trim() || undefined,
  };
}

function teamMemberContactRow(
  member: TeamMember,
  roleLabel: string,
  id: string,
): RunOfShowQuickContactRow {
  return {
    id,
    roleLabel,
    name: member.name.trim(),
    company: member.company?.trim() || undefined,
    phone: member.phone.trim() || undefined,
    email: member.email.trim() || undefined,
  };
}

function resolveTeamMemberById(
  memberId: string,
  companyTeamMembers: TeamMember[],
  teamMembers: TeamMember[],
): TeamMember | null {
  const trimmed = memberId.trim();
  if (!trimmed) return null;
  return (
    companyTeamMembers.find((member) => member.id === trimmed) ??
    teamMembers.find((member) => member.id === trimmed) ??
    null
  );
}

export type BuildRunOfShowQuickContactsInput = {
  vendors: Vendor[];
  assignedDjId: string;
  plannerName: string;
  plannerEmail: string;
  venueFallback: string;
  companyTeamMembers: TeamMember[];
  teamMembers: TeamMember[];
};

/** Read-only quick contacts for Run Of Show — no new storage. */
export function buildRunOfShowQuickContacts(
  input: BuildRunOfShowQuickContactsInput,
): RunOfShowQuickContactRow[] {
  const rows: RunOfShowQuickContactRow[] = [];
  const seen = new Set<string>();

  const push = (row: RunOfShowQuickContactRow | null) => {
    if (!row?.name.trim()) return;
    const key = `${row.roleLabel}:${row.name}:${row.phone ?? ""}:${row.email ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  const plannerFromTeam = firstTeamMemberByRole(input.teamMembers, "Planner");
  if (plannerFromTeam) {
    push(teamMemberContactRow(plannerFromTeam, "Planner", `team-planner-${plannerFromTeam.id}`));
  } else {
    const plannerVendor = firstVendorByType(input.vendors, "Planner");
    if (plannerVendor) {
      push(vendorContactRow(plannerVendor, "Planner", `vendor-planner-${plannerVendor.id}`));
    } else if (input.plannerName.trim()) {
      push({
        id: "settings-planner",
        roleLabel: "Planner",
        name: input.plannerName.trim(),
        email: input.plannerEmail.trim() || undefined,
      });
    }
  }

  const photographerFromTeam = firstTeamMemberByRole(input.teamMembers, "Photographer");
  if (photographerFromTeam) {
    push(
      teamMemberContactRow(
        photographerFromTeam,
        "Photographer",
        `team-photo-${photographerFromTeam.id}`,
      ),
    );
  } else {
    const photographer = firstVendorByType(input.vendors, "Photographer");
    if (photographer) {
      push(vendorContactRow(photographer, "Photographer", `vendor-photo-${photographer.id}`));
    }
  }

  const venueFromTeam = firstTeamMemberByRole(input.teamMembers, "Venue");
  if (venueFromTeam) {
    push(teamMemberContactRow(venueFromTeam, "Venue", `team-venue-${venueFromTeam.id}`));
  } else {
    const venueVendor = firstVendorByType(input.vendors, "Venue");
    if (venueVendor) {
      push(vendorContactRow(venueVendor, "Venue", `vendor-venue-${venueVendor.id}`));
    } else if (input.venueFallback.trim()) {
      push({
        id: "settings-venue",
        roleLabel: "Venue",
        name: input.venueFallback.trim(),
      });
    }
  }

  const assignedDj = resolveTeamMemberById(
    input.assignedDjId,
    input.companyTeamMembers,
    input.teamMembers,
  );
  if (assignedDj?.name.trim()) {
    push(teamMemberContactRow(assignedDj, "Assigned DJ", `assigned-dj-${assignedDj.id}`));
  }

  return rows;
}

export function phoneTelHref(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "";
}

export function emailMailtoHref(email: string): string {
  const trimmed = email.trim();
  return trimmed ? `mailto:${trimmed}` : "";
}
