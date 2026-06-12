/**
 * Client-side guarded wrappers around the `lib/actions/events.ts` Server
 * Actions. Each wrapper estimates the size of the outgoing arguments and
 * throws a clear diagnostic error *before* the request hits the wire,
 * preventing the cryptic Next.js "Body exceeded 1 MB limit." failure and
 * surfacing the offending field path so the root cause is obvious.
 *
 * The actions themselves are untouched — these wrappers exist purely as a
 * thin diagnostic shim. Callers should import from this file instead of
 * `lib/actions/events.ts` directly.
 *
 * If the guard fires, the next step is *not* to raise the body limit — it
 * is to find the unbounded field (almost always a notes / body / dedication
 * / data URL field) and either truncate, strip, or move it to a separate
 * persistence channel.
 */

import {
  createEvent,
  deleteEvent,
  getEvents,
  replaceCeremonyPlan,
  replaceMusicHubPlan,
  replaceDjScripts,
  replaceDjMusicNotes,
  replaceCeremonyTimelineItems,
  replaceEventNotes,
  replaceEventSongs,
  replaceEventTeamMembers,
  replaceGuestRequests,
  replaceMainTimelineItems,
  replacePlanningQuestionAnswers,
  updateEvent,
  updateGrandEntranceDetail,
} from "@/lib/actions/events";
import { assertPayloadFitsServerAction } from "@/lib/payloadSize";

type ReplaceMainTimelineArgs = Parameters<typeof replaceMainTimelineItems>[1];
type ReplaceCeremonyTimelineArgs = Parameters<typeof replaceCeremonyTimelineItems>[1];
type ReplaceEventSongsArgs = Parameters<typeof replaceEventSongs>[2];
type ReplaceGuestRequestsArgs = Parameters<typeof replaceGuestRequests>[1];
type ReplaceEventTeamMembersArgs = Parameters<typeof replaceEventTeamMembers>[1];
type ReplaceEventNotesArgs = Parameters<typeof replaceEventNotes>[1];
type ReplacePlanningQuestionAnswersArgs = Parameters<typeof replacePlanningQuestionAnswers>[1];
type ReplaceCeremonyPlanArgs = Parameters<typeof replaceCeremonyPlan>[1];
type ReplaceMusicHubPlanArgs = Parameters<typeof replaceMusicHubPlan>[1];
type ReplaceDjScriptsArgs = Parameters<typeof replaceDjScripts>[1];
type ReplaceDjMusicNotesArgs = Parameters<typeof replaceDjMusicNotes>[1];
type CreateEventArgs = Parameters<typeof createEvent>[0];
type UpdateEventArgs = Parameters<typeof updateEvent>[1];
type UpdateGrandEntranceDetailArgs = Parameters<typeof updateGrandEntranceDetail>[1];

export { getEvents };

export async function createEventGuarded(data: CreateEventArgs) {
  assertPayloadFitsServerAction("createEvent", data);
  return createEvent(data);
}

export async function updateEventGuarded(id: string, data: UpdateEventArgs) {
  assertPayloadFitsServerAction("updateEvent", data);
  return updateEvent(id, data);
}

export async function deleteEventGuarded(id: string) {
  assertPayloadFitsServerAction("deleteEvent", { id });
  return deleteEvent(id);
}

export async function updateGrandEntranceDetailGuarded(
  eventId: string,
  detail: UpdateGrandEntranceDetailArgs,
) {
  assertPayloadFitsServerAction("updateGrandEntranceDetail", detail);
  return updateGrandEntranceDetail(eventId, detail);
}

export async function replaceMainTimelineItemsGuarded(
  eventId: string,
  items: ReplaceMainTimelineArgs,
) {
  assertPayloadFitsServerAction("replaceMainTimelineItems", items);
  return replaceMainTimelineItems(eventId, items);
}

export async function replaceCeremonyTimelineItemsGuarded(
  eventId: string,
  items: ReplaceCeremonyTimelineArgs,
) {
  assertPayloadFitsServerAction("replaceCeremonyTimelineItems", items);
  return replaceCeremonyTimelineItems(eventId, items);
}

export async function replaceEventSongsGuarded(
  eventId: string,
  listType: string,
  songs: ReplaceEventSongsArgs,
) {
  assertPayloadFitsServerAction(`replaceEventSongs[${listType}]`, songs);
  return replaceEventSongs(eventId, listType, songs);
}

export async function replaceGuestRequestsGuarded(
  eventId: string,
  guestRequests: ReplaceGuestRequestsArgs,
) {
  assertPayloadFitsServerAction("replaceGuestRequests", guestRequests);
  return replaceGuestRequests(eventId, guestRequests);
}

export async function replaceEventTeamMembersGuarded(
  eventId: string,
  teamMembers: ReplaceEventTeamMembersArgs,
) {
  assertPayloadFitsServerAction("replaceEventTeamMembers", teamMembers);
  return replaceEventTeamMembers(eventId, teamMembers);
}

export async function replaceEventNotesGuarded(
  eventId: string,
  notes: ReplaceEventNotesArgs,
) {
  assertPayloadFitsServerAction("replaceEventNotes", notes);
  return replaceEventNotes(eventId, notes);
}

export async function replacePlanningQuestionAnswersGuarded(
  eventId: string,
  answers: ReplacePlanningQuestionAnswersArgs,
) {
  assertPayloadFitsServerAction("replacePlanningQuestionAnswers", answers);
  return replacePlanningQuestionAnswers(eventId, answers);
}

export async function replaceCeremonyPlanGuarded(
  eventId: string,
  plan: ReplaceCeremonyPlanArgs,
) {
  assertPayloadFitsServerAction("replaceCeremonyPlan", plan);
  return replaceCeremonyPlan(eventId, plan);
}

export async function replaceMusicHubPlanGuarded(
  eventId: string,
  plan: ReplaceMusicHubPlanArgs,
) {
  assertPayloadFitsServerAction("replaceMusicHubPlan", plan);
  return replaceMusicHubPlan(eventId, plan);
}

export async function replaceDjScriptsGuarded(
  eventId: string,
  scripts: ReplaceDjScriptsArgs,
) {
  assertPayloadFitsServerAction("replaceDjScripts", scripts);
  return replaceDjScripts(eventId, scripts);
}

export async function replaceDjMusicNotesGuarded(
  eventId: string,
  notes: ReplaceDjMusicNotesArgs,
) {
  assertPayloadFitsServerAction("replaceDjMusicNotes", notes);
  return replaceDjMusicNotes(eventId, notes);
}
