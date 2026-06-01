import type { EventSettings } from "@/types/planning";

export type EventLayoutProfile = EventSettings["eventLayoutProfile"];

export const DEFAULT_NEW_EVENT_LAYOUT_PROFILE: EventLayoutProfile = "Wedding";

export type EventCreationDraft = {
  eventName: string;
  coupleNames: string;
  eventType: string;
  eventLayoutProfile: EventLayoutProfile;
  weddingDate: string;
  venue: string;
  venueAddress: string;
  ceremonyLocation: string;
  receptionLocation: string;
  assignedDj: string;
  packageName: string;
  plannerName: string;
  plannerEmail: string;
  internalNotes: string;
};

export type EventCreationFieldConfig = {
  primaryPartyLabel: string;
  dateLabel: string;
  showEventName: boolean;
  showPrimaryParty: boolean;
  showPackage: boolean;
  showCeremonyLocations: boolean;
  eventNameLabel: string;
  eventNameOptional: boolean;
};

const PRIMARY_PARTY_LABEL: Record<EventLayoutProfile, string> = {
  Wedding: "Couple Names",
  "Gender-Neutral Wedding": "Partner Names",
  Corporate: "Company or Event Name",
  "Holiday Party": "Host or Event Name",
  "Graduation Celebration": "Graduate or School Name",
  "Birthday Party": "Event Name",
  "Bar/Club Event": "Venue or Event Name",
  "School Dance": "School or Event Name",
  "Private Party": "Event Name",
};

function isWeddingProfile(profile: EventLayoutProfile): boolean {
  return profile === "Wedding" || profile === "Gender-Neutral Wedding";
}

/** Field visibility for the create-event modal — wedding stays the richest path. */
export function getEventCreationFieldConfig(
  profile: EventLayoutProfile,
): EventCreationFieldConfig {
  const wedding = isWeddingProfile(profile);

  if (wedding) {
    return {
      primaryPartyLabel: PRIMARY_PARTY_LABEL[profile],
      dateLabel: wedding ? "Wedding Date" : "Event Date",
      showEventName: true,
      showPrimaryParty: true,
      showPackage: true,
      showCeremonyLocations: true,
      eventNameLabel: "Event Name",
      eventNameOptional: true,
    };
  }

  if (profile === "Private Party" || profile === "Birthday Party") {
    return {
      primaryPartyLabel: PRIMARY_PARTY_LABEL[profile],
      dateLabel: wedding ? "Wedding Date" : "Event Date",
      showEventName: true,
      showPrimaryParty: false,
      showPackage: false,
      showCeremonyLocations: false,
      eventNameLabel: PRIMARY_PARTY_LABEL[profile],
      eventNameOptional: false,
    };
  }

  return {
    primaryPartyLabel: PRIMARY_PARTY_LABEL[profile],
    dateLabel: "Event Date",
    showEventName: false,
    showPrimaryParty: true,
    showPackage: profile === "Corporate",
    showCeremonyLocations: false,
    eventNameLabel: "Event Name",
    eventNameOptional: false,
  };
}

export function buildNewEventDraft(): EventCreationDraft {
  return {
    eventName: "",
    coupleNames: "",
    eventType: DEFAULT_NEW_EVENT_LAYOUT_PROFILE,
    eventLayoutProfile: DEFAULT_NEW_EVENT_LAYOUT_PROFILE,
    weddingDate: "",
    venue: "",
    venueAddress: "",
    ceremonyLocation: "",
    receptionLocation: "",
    assignedDj: "",
    packageName: "",
    plannerName: "",
    plannerEmail: "",
    internalNotes: "",
  };
}

export function resolveNewEventIdentity(
  draft: EventCreationDraft,
): { eventName: string; coupleNames: string } | { error: string } {
  const config = getEventCreationFieldConfig(draft.eventLayoutProfile);
  const eventName = draft.eventName.trim();
  const coupleNames = draft.coupleNames.trim();

  if (config.showPrimaryParty && config.showEventName) {
    if (!coupleNames) {
      return { error: `${config.primaryPartyLabel} is required to create an event.` };
    }
    return {
      eventName: eventName || coupleNames,
      coupleNames,
    };
  }

  if (config.showEventName && !config.showPrimaryParty) {
    if (!eventName) {
      return { error: `${config.eventNameLabel} is required to create an event.` };
    }
    return { eventName, coupleNames: eventName };
  }

  if (!coupleNames) {
    return { error: `${config.primaryPartyLabel} is required to create an event.` };
  }

  return {
    eventName: eventName || coupleNames,
    coupleNames,
  };
}
