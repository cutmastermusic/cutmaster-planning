"use client";

import { useCallback, useState } from "react";

import {
  couplePortalPrimaryButtonClass,
  lightUiGhostButtonClass,
  lightUiInputClass,
} from "@/components/planning-ui";
import type { GuestRequestStatus, SongEntry, SongListType } from "@/types/planning";

const songTableHeaderClass =
  "hidden border-b border-stone-200 bg-[#f7f5f1]/90 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2f4a3e]/55 md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto] md:gap-2";

const songTableRowClass =
  "border-b border-stone-100 last:border-b-0 transition-colors hover:bg-[#f7f5f1]/60 md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto] md:items-center md:gap-2 md:px-2 md:py-1.5";

const songActionButtonClass = `${lightUiGhostButtonClass} min-h-8 px-2 py-1 text-[11px]`;

function truncateNotes(notes: string | undefined, max = 72): string {
  const trimmed = notes?.trim() ?? "";
  if (!trimmed) return "—";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

type MusicHubSongListProps = {
  songs: SongEntry[];
  listType: SongListType;
  onTogglePriority: (listType: SongListType, songId: string) => void;
  onRemove: (listType: SongListType, songId: string) => void;
  onUpdateSong: (
    listType: SongListType,
    songId: string,
    patch: Partial<Pick<SongEntry, "title" | "artist" | "notes">>,
  ) => void;
  disabled?: boolean;
  buttonVariant?: "default" | "couple";
};

function SongListRow({
  song,
  listType,
  onTogglePriority,
  onRemove,
  onUpdateSong,
  disabled = false,
  buttonVariant = "default",
}: {
  song: SongEntry;
  listType: SongListType;
  onTogglePriority: MusicHubSongListProps["onTogglePriority"];
  onRemove: MusicHubSongListProps["onRemove"];
  onUpdateSong: MusicHubSongListProps["onUpdateSong"];
  disabled?: boolean;
  buttonVariant?: MusicHubSongListProps["buttonVariant"];
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(song.title);
  const [draftArtist, setDraftArtist] = useState(song.artist ?? "");
  const [draftNotes, setDraftNotes] = useState(song.notes ?? "");
  const [notesExpanded, setNotesExpanded] = useState(false);

  const startEdit = useCallback(() => {
    setDraftTitle(song.title);
    setDraftArtist(song.artist ?? "");
    setDraftNotes(song.notes ?? "");
    setEditing(true);
    setNotesExpanded(true);
  }, [song.artist, song.notes, song.title]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setNotesExpanded(false);
  }, []);

  const saveEdit = useCallback(() => {
    const title = draftTitle.trim();
    if (!title) return;
    onUpdateSong(listType, song.id, {
      title,
      artist: draftArtist.trim() || undefined,
      notes: draftNotes.trim() || undefined,
    });
    setEditing(false);
  }, [draftArtist, draftNotes, draftTitle, listType, onUpdateSong, song.id]);

  const notesText = song.notes?.trim() ?? "";
  const showLongNotes = notesText.length > 72;
  const albumArtSrc = song.albumArtSmall ?? song.albumArt;

  return (
    <>
      <div className={`${songTableRowClass} px-2 py-2.5 md:py-1.5`}>
        <div className="min-w-0">
          <p className="md:hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
            Song
          </p>
          <div className="flex min-w-0 items-start gap-2">
            {albumArtSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={albumArtSrc} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" loading="lazy" />
            ) : null}
            <div className="min-w-0">
              <p className="min-w-0 truncate text-sm font-medium text-[#1f2724]">{song.title}</p>
              {song.album ? <p className="truncate text-[11px] text-stone-500">{song.album}</p> : null}
            </div>
            {song.highPriority ? (
              <span className="shrink-0 rounded-full border border-stone-300 bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-stone-700">
                Priority
              </span>
            ) : null}
            {song.source === "spotify-search" ? (
              <span className="shrink-0 rounded-full border border-[#C79A5A]/30 bg-[#C79A5A]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-stone-600">
                Imported from Spotify
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-2 min-w-0 md:mt-0">
          <p className="md:hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
            Artist
          </p>
          <p className="truncate text-sm text-stone-700">{song.artist?.trim() || "—"}</p>
        </div>
        <div className="mt-2 min-w-0 md:mt-0">
          <p className="md:hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
            Notes
          </p>
          {notesText ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setNotesExpanded((prev) => !prev)}
              className="max-w-full text-left text-sm leading-snug text-stone-700 hover:text-stone-950 disabled:opacity-50"
            >
              <span className={notesExpanded ? "whitespace-pre-wrap break-words" : "line-clamp-2 md:line-clamp-1"}>
                {notesExpanded ? notesText : truncateNotes(notesText)}
              </span>
              {showLongNotes && !notesExpanded ? (
                <span className="ml-1 text-[11px] font-semibold text-stone-500">More</span>
              ) : null}
            </button>
          ) : (
            <p className="text-sm text-stone-400">—</p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1 md:mt-0 md:justify-end">
          {song.previewUrl ? (
            <audio
              controls
              preload="none"
              src={song.previewUrl}
              className="h-8 max-w-[9.5rem] shrink-0"
              aria-label={`Preview ${song.title}`}
            />
          ) : null}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onTogglePriority(listType, song.id)}
            className={songActionButtonClass}
          >
            {song.highPriority ? "Unmark" : "Priority"}
          </button>
          <button type="button" disabled={disabled} onClick={startEdit} className={songActionButtonClass}>
            Edit
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(listType, song.id)}
            className={`${songActionButtonClass} text-rose-800 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-950`}
          >
            Remove
          </button>
        </div>
      </div>
      {editing ? (
        <div className="border-b border-stone-100 bg-stone-50/80 px-2 py-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                Song
              </span>
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                disabled={disabled}
                className={`mt-1 ${lightUiInputClass}`}
              />
            </label>
            <label className="block min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                Artist
              </span>
              <input
                value={draftArtist}
                onChange={(event) => setDraftArtist(event.target.value)}
                disabled={disabled}
                className={`mt-1 ${lightUiInputClass}`}
              />
            </label>
          </div>
          <label className="mt-3 block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
              Notes
            </span>
            <textarea
              value={draftNotes}
              onChange={(event) => setDraftNotes(event.target.value)}
              disabled={disabled}
              rows={2}
              className={`mt-1 ${lightUiInputClass} min-h-[4.5rem] resize-y`}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || !draftTitle.trim()}
              onClick={saveEdit}
              className={
                buttonVariant === "couple"
                  ? `${couplePortalPrimaryButtonClass} min-h-8 px-2 py-1 text-[11px] disabled:opacity-55`
                  : `${songActionButtonClass} border-[#1f2724] bg-[#1f2724] text-white hover:bg-[#2b3531] active:bg-[#171d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/45 focus-visible:ring-offset-2`
              }
            >
              Save
            </button>
            <button type="button" disabled={disabled} onClick={cancelEdit} className={songActionButtonClass}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function MusicHubSongList({
  songs,
  listType,
  onTogglePriority,
  onRemove,
  onUpdateSong,
  disabled = false,
  buttonVariant = "default",
}: MusicHubSongListProps) {
  if (songs.length === 0) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className={songTableHeaderClass}>
        <span>Song</span>
        <span>Artist</span>
        <span>Notes</span>
        <span className="text-right">Actions</span>
      </div>
      <div>
        {songs.map((song) => (
          <SongListRow
            key={song.id}
            song={song}
            listType={listType}
            onTogglePriority={onTogglePriority}
            onRemove={onRemove}
            onUpdateSong={onUpdateSong}
            disabled={disabled}
          buttonVariant={buttonVariant}
          />
        ))}
      </div>
    </div>
  );
}

export type MusicHubGuestRequestRow = {
  id: string;
  songTitle: string;
  artist: string;
  guestName: string;
  dedication: string;
  status: GuestRequestStatus;
};

type MusicHubGuestRequestListProps = {
  requests: MusicHubGuestRequestRow[];
  onOpenGuestRequests?: () => void;
};

function guestRequestNotes(request: MusicHubGuestRequestRow): string {
  const parts: string[] = [];
  if (request.dedication?.trim()) parts.push(request.dedication.trim());
  if (request.guestName?.trim()) parts.push(`From ${request.guestName.trim()}`);
  return parts.join(" · ") || "—";
}

export function MusicHubGuestRequestList({
  requests,
  onOpenGuestRequests,
}: MusicHubGuestRequestListProps) {
  if (requests.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className={songTableHeaderClass}>
        <span>Song</span>
        <span>Artist</span>
        <span>Notes</span>
        <span className="text-right">Actions</span>
      </div>
      <div>
        {requests.map((request) => (
          <div
            key={request.id}
            className={`${songTableRowClass} px-2 py-2.5 md:py-1.5`}
          >
            <div className="min-w-0">
              <p className="md:hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                Song
              </p>
              <p className="truncate text-sm font-medium text-stone-900">{request.songTitle}</p>
            </div>
            <div className="mt-2 min-w-0 md:mt-0">
              <p className="md:hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                Artist
              </p>
              <p className="truncate text-sm text-stone-700">{request.artist?.trim() || "—"}</p>
            </div>
            <div className="mt-2 min-w-0 md:mt-0">
              <p className="md:hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                Notes
              </p>
              <p className="line-clamp-2 text-sm leading-snug text-stone-700 md:line-clamp-1">
                {guestRequestNotes(request)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-end gap-1 md:mt-0">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
                {request.status}
              </span>
              {onOpenGuestRequests ? (
                <button type="button" onClick={onOpenGuestRequests} className={songActionButtonClass}>
                  Review
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
