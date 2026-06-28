import type { UserRole } from "@/types/planning";

export const SHOWFLOW_ACCOUNT_ROLES = ["ADMIN", "STAFF", "CLIENT"] as const;
export type ShowFlowAccountRole = (typeof SHOWFLOW_ACCOUNT_ROLES)[number];

export const STAFF_CAPABILITIES = ["DJ", "PLANNER"] as const;
export type StaffCapability = (typeof STAFF_CAPABILITIES)[number];

export type ShowFlowAccessProfile = {
  role: ShowFlowAccountRole;
  staffCapabilities: StaffCapability[];
};

export const FUTURE_PERMISSION_TOGGLES = [
  "timeline:access",
  "music-hub:access",
  "people-vendors:access",
  "dj-prep:access",
  "run-of-show:access",
  "clients:invite",
  "team:manage",
] as const;
export type FuturePermissionToggle = (typeof FUTURE_PERMISSION_TOGGLES)[number];

function uniqueStaffCapabilities(capabilities: StaffCapability[]): StaffCapability[] {
  return [...new Set(capabilities)];
}

export function isAdmin(profile: ShowFlowAccessProfile | null | undefined): boolean {
  return profile?.role === "ADMIN";
}

export function isStaff(profile: ShowFlowAccessProfile | null | undefined): boolean {
  return profile?.role === "STAFF";
}

export function isClient(profile: ShowFlowAccessProfile | null | undefined): boolean {
  return profile?.role === "CLIENT";
}

export function hasDjCapability(profile: ShowFlowAccessProfile | null | undefined): boolean {
  return isAdmin(profile) || Boolean(profile?.staffCapabilities.includes("DJ"));
}

export function hasPlannerCapability(profile: ShowFlowAccessProfile | null | undefined): boolean {
  return isAdmin(profile) || Boolean(profile?.staffCapabilities.includes("PLANNER"));
}

export function staffCapabilitiesFromLegacyRole(role: UserRole | string | null | undefined): StaffCapability[] {
  switch (role) {
    case "Admin":
    case "ADMIN":
      return ["DJ", "PLANNER"];
    case "DJ":
      return ["DJ"];
    case "Planner":
    case "PLANNER":
      return ["PLANNER"];
    default:
      return [];
  }
}

export function accessProfileFromLegacyRole(role: UserRole | string | null | undefined): ShowFlowAccessProfile | null {
  switch (role) {
    case "Admin":
    case "ADMIN":
      return { role: "ADMIN", staffCapabilities: ["DJ", "PLANNER"] };
    case "DJ":
    case "Planner":
    case "PLANNER":
      return {
        role: "STAFF",
        staffCapabilities: staffCapabilitiesFromLegacyRole(role),
      };
    case "Couple":
    case "COUPLE":
    case "CLIENT":
      return { role: "CLIENT", staffCapabilities: [] };
    case "STAFF":
      return { role: "STAFF", staffCapabilities: [] };
    default:
      return null;
  }
}

export function accessProfileFromPlatformAndMemberships(params: {
  platformRole?: string | null;
  membershipRoles?: Array<string | null | undefined>;
}): ShowFlowAccessProfile | null {
  if (params.platformRole === "ADMIN") {
    return { role: "ADMIN", staffCapabilities: ["DJ", "PLANNER"] };
  }

  const capabilities = uniqueStaffCapabilities(
    (params.membershipRoles ?? []).flatMap((role) => staffCapabilitiesFromLegacyRole(role)),
  );

  if (params.platformRole === "STAFF" || capabilities.length > 0) {
    return { role: "STAFF", staffCapabilities: capabilities };
  }

  if ((params.membershipRoles ?? []).some((role) => role === "COUPLE" || role === "Couple")) {
    return { role: "CLIENT", staffCapabilities: [] };
  }

  return null;
}

export function legacyUserRoleFromAccessProfile(profile: ShowFlowAccessProfile | null | undefined): UserRole | null {
  if (!profile) return null;
  if (profile.role === "ADMIN") return "Admin";
  if (profile.role === "CLIENT") return "Couple";
  if (profile.staffCapabilities.includes("DJ")) return "DJ";
  if (profile.staffCapabilities.includes("PLANNER")) return "Planner";
  return "Planner";
}

