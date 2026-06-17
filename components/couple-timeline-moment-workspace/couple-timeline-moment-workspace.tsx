"use client";

import { CeremonyMomentWorkspace } from "@/components/couple-timeline-moment-workspace/ceremony-workspace";
import { DanceFirstMomentWorkspace } from "@/components/couple-timeline-moment-workspace/dance-first-workspace";
import { DanceParentMomentWorkspace } from "@/components/couple-timeline-moment-workspace/dance-parent-workspace";
import { GrandEntranceMomentWorkspace } from "@/components/couple-timeline-moment-workspace/grand-entrance-workspace";
import { SpeechToastsMomentWorkspace } from "@/components/couple-timeline-moment-workspace/speech-toasts-workspace";
import type {
  CeremonyMomentWorkspaceRef,
  CoupleTimelineMomentWorkspaceId,
  GrandEntranceMomentWorkspaceRef,
  MusicHubMomentWorkspaceRef,
  ParentDanceMomentWorkspaceRef,
} from "@/lib/timelineMomentWorkspace";
import type { TimelineMomentType } from "@/lib/timelineMomentType";
import type { SpeechesToastEntry } from "@/lib/speechesToasts";

export type CoupleTimelineMomentWorkspaceProps = {
  workspaceId: CoupleTimelineMomentWorkspaceId;
  title: string;
  time: string;
  notes: string;
  songTitle: string;
  artist: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  toastsRaw: string;
  musicHubRef: MusicHubMomentWorkspaceRef;
  ceremonyRef: CeremonyMomentWorkspaceRef;
  grandEntranceRef: GrandEntranceMomentWorkspaceRef;
  parentDanceRef: ParentDanceMomentWorkspaceRef;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onSpeechesToastsChange: (entries: SpeechesToastEntry[]) => void;
  onOpenGrandEntranceLineup: () => void;
  onOpenMusicHub: () => void;
  onOpenCeremonyPlanning: () => void;
  onOpenCeremonyTimeline: () => void;
  onDone: () => void;
};

export function CoupleTimelineMomentWorkspace({
  workspaceId,
  title,
  time,
  notes,
  songTitle,
  artist,
  momentType,
  canEdit,
  toastsRaw,
  musicHubRef,
  ceremonyRef,
  grandEntranceRef,
  parentDanceRef,
  onTimeChange,
  onNotesChange,
  onSongTitleChange,
  onArtistChange,
  onSpeechesToastsChange,
  onOpenGrandEntranceLineup,
  onOpenMusicHub,
  onOpenCeremonyPlanning,
  onOpenCeremonyTimeline,
  onDone,
}: CoupleTimelineMomentWorkspaceProps) {
  switch (workspaceId) {
    case "dance_first":
      return (
        <DanceFirstMomentWorkspace
          title={title}
          time={time}
          notes={notes}
          songTitle={songTitle}
          artist={artist}
          momentType={momentType}
          canEdit={canEdit}
          musicHubRef={musicHubRef}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          onSongTitleChange={onSongTitleChange}
          onArtistChange={onArtistChange}
          onOpenMusicHub={onOpenMusicHub}
          onDone={onDone}
        />
      );
    case "dance_parent":
      return (
        <DanceParentMomentWorkspace
          title={title}
          time={time}
          notes={notes}
          songTitle={songTitle}
          artist={artist}
          momentType={momentType}
          canEdit={canEdit}
          parentDanceRef={parentDanceRef}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          onSongTitleChange={onSongTitleChange}
          onArtistChange={onArtistChange}
          onDone={onDone}
        />
      );
    case "speech_toasts":
      return (
        <SpeechToastsMomentWorkspace
          title={title}
          time={time}
          notes={notes}
          momentType={momentType}
          canEdit={canEdit}
          toastsRaw={toastsRaw}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          onSpeechesToastsChange={onSpeechesToastsChange}
          onDone={onDone}
        />
      );
    case "grand_entrance":
      return (
        <GrandEntranceMomentWorkspace
          title={title}
          time={time}
          notes={notes}
          songTitle={songTitle}
          artist={artist}
          momentType={momentType}
          canEdit={canEdit}
          grandEntranceRef={grandEntranceRef}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          onSongTitleChange={onSongTitleChange}
          onArtistChange={onArtistChange}
          onOpenLineup={onOpenGrandEntranceLineup}
          onDone={onDone}
        />
      );
    case "ceremony":
      return (
        <CeremonyMomentWorkspace
          title={title}
          time={time}
          notes={notes}
          momentType={momentType}
          canEdit={canEdit}
          ceremonyRef={ceremonyRef}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          onOpenCeremonyPlanning={onOpenCeremonyPlanning}
          onOpenCeremonyTimeline={onOpenCeremonyTimeline}
          onDone={onDone}
        />
      );
  }
}
