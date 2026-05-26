import {
  getCompanyTeamMembers,
  replaceCompanyTeamMembers,
} from "@/lib/actions/companyTeamMembers";
import { assertPayloadFitsServerAction } from "@/lib/payloadSize";

type ReplaceCompanyTeamMembersArgs = Parameters<typeof replaceCompanyTeamMembers>[0];

export { getCompanyTeamMembers };

export async function replaceCompanyTeamMembersGuarded(
  teamMembers: ReplaceCompanyTeamMembersArgs,
) {
  assertPayloadFitsServerAction("replaceCompanyTeamMembers", teamMembers);
  return replaceCompanyTeamMembers(teamMembers);
}
