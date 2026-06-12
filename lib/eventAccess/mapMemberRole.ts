import type { UserRole } from "@/types/planning";

export function eventMemberRoleToUserRole(role: string): UserRole | null {
  switch (role) {
    case "COUPLE":
      return "Couple";
    case "DJ":
      return "DJ";
    case "PLANNER":
      return "Planner";
    case "ADMIN":
      return "Admin";
    default:
      return null;
  }
}
