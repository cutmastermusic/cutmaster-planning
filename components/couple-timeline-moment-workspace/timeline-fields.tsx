"use client";

import { TextArea, TextInput } from "@/components/planning-ui";

const labelClass = "text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500";
const inputClass =
  "mt-1.5 w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-3 text-base text-stone-900 shadow-none transition focus:border-[#2f4a3e]/40 focus:outline-none focus:ring-2 focus:ring-[#2f4a3e]/15 disabled:cursor-default disabled:bg-stone-100/80";

type CoupleTimelineMomentTimelineFieldsProps = {
  time: string;
  notes: string;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  disabled?: boolean;
  notesLabel?: string;
  notesPlaceholder?: string;
};

export function CoupleTimelineMomentTimelineFields({
  time,
  notes,
  onTimeChange,
  onNotesChange,
  disabled = false,
  notesLabel = "Notes for your team",
  notesPlaceholder = "Timing cues, introductions, or anything your DJ should know for this moment.",
}: CoupleTimelineMomentTimelineFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:items-start">
      <TextInput
        id="couple-moment-workspace-time"
        label="Time"
        value={time}
        onChange={onTimeChange}
        disabled={disabled}
        labelClassName={labelClass}
        inputClassName={inputClass}
        placeholder="e.g. 6:30 PM"
      />
      <TextArea
        id="couple-moment-workspace-notes"
        label={notesLabel}
        value={notes}
        onChange={onNotesChange}
        disabled={disabled}
        labelClassName={labelClass}
        textareaClassName={`${inputClass} min-h-[6.5rem] resize-y`}
        rows={3}
        placeholder={notesPlaceholder}
      />
    </div>
  );
}

type CoupleTimelineMomentSongCueFieldsProps = {
  songTitle: string;
  artist: string;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  disabled?: boolean;
};

export function CoupleTimelineMomentSongCueFields({
  songTitle,
  artist,
  onSongTitleChange,
  onArtistChange,
  disabled = false,
}: CoupleTimelineMomentSongCueFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextInput
        id="couple-moment-workspace-song"
        label="Scheduled song"
        value={songTitle}
        onChange={onSongTitleChange}
        disabled={disabled}
        labelClassName={labelClass}
        inputClassName={inputClass}
        placeholder="Song title"
      />
      <TextInput
        id="couple-moment-workspace-artist"
        label="Artist"
        value={artist}
        onChange={onArtistChange}
        disabled={disabled}
        labelClassName={labelClass}
        inputClassName={inputClass}
        placeholder="Artist"
      />
    </div>
  );
}
