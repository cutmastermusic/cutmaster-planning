"use client";

import type { DragEvent, TouchEvent } from "react";
import {
  resolveTimelineMomentType,
  coupleTimelineMomentGuidance,
  coupleTimelineSongCta,
} from "@/lib/timelineMomentType";
import type { TimelineMomentType } from "@/lib/timelineMomentType";

// ─── Drag grip dots ───────────────────────────────────────────────────────────

function DragGripDots({ active = false }: { active?: boolean }) {
  return (
    <span
      className="inline-grid grid-cols-2 gap-[3px]"
      aria-hidden
    >
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className={`size-[3px] rounded-full transition-colors ${
            active ? "bg-[#2f4a3e]/60" : "bg-[#2f4a3e]/35"
          }`}
        />
      ))}
    </span>
  );
}

// ─── + Add a moment strip ─────────────────────────────────────────────────────

export function CoupleAddMomentStrip({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-0.5">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2f4a3e]/10 to-[#2f4a3e]/5" />
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="rounded-full border border-transparent bg-transparent px-2.5 py-1 text-[10px] font-medium text-[#2f4a3e]/60 transition hover:border-[#2f4a3e]/15 hover:bg-white/70 hover:text-[#2f4a3e] disabled:opacity-40"
      >
        + Add a moment
      </button>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#2f4a3e]/10 to-[#2f4a3e]/5" />
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

type CoupleTimelineCardProps = {
  title: string;
  time?: string;
  songTitle?: string;
  artist?: string;
  momentType?: TimelineMomentType | string | null;
  isDragging: boolean;
  isDropTarget: boolean;
  dragActive: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onTouchStart: (e: TouchEvent<HTMLButtonElement>) => void;
  isEditing?: boolean;
};

export function CoupleTimelineCard({
  title,
  time,
  songTitle,
  artist,
  momentType,
  isDragging,
  isDropTarget,
  dragActive,
  canEdit,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onTouchStart,
  isEditing = false,
}: CoupleTimelineCardProps) {
  const resolvedType = resolveTimelineMomentType({ title, momentType });
  const guidance = coupleTimelineMomentGuidance(resolvedType, title);
  const songCta = coupleTimelineSongCta(resolvedType, title);

  const songDisplay = [songTitle?.trim(), artist?.trim()].filter(Boolean).join(" — ");
  const hasSong = Boolean(songDisplay);

  // For open dance / meal / speech, no song CTA — show a soft nudge instead
  const songSection = (() => {
    if (hasSong) {
      return (
        <p className="mt-2 text-sm italic text-[#a07830]">
          ♪ {songDisplay}
        </p>
      );
    }
    if (songCta) {
      return (
        <button
          type="button"
          onClick={canEdit ? onEdit : undefined}
          disabled={!canEdit}
          className="mt-2 text-sm text-[#2f4a3e]/60 underline underline-offset-2 transition hover:text-[#2f4a3e] disabled:no-underline disabled:opacity-50"
        >
          {songCta} →
        </button>
      );
    }
    return null;
  })();

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border bg-white px-4 py-3.5 transition-[transform,box-shadow,opacity,border-color,background-color] duration-200 ease-out md:gap-4 md:px-5 md:py-4 lg:px-6 lg:py-5 ${
        isDragging
          ? "z-10 scale-[1.02] border-[#2f4a3e]/40 shadow-[0_14px_32px_rgba(15,23,42,0.14)]"
          : isDropTarget
          ? "border-[#C79A5A] shadow-[0_0_0_1px_rgba(199,154,90,0.35)] ring-2 ring-[#C79A5A]/70 ring-offset-2 ring-offset-white"
          : dragActive
          ? "border-stone-200 opacity-[0.88] shadow-sm"
          : "border-stone-200 shadow-sm hover:border-[#2f4a3e]/25 hover:shadow-md"
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        draggable={canEdit}
        aria-label={`Drag to reorder ${title}`}
        title="Drag to reorder"
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onTouchStart={onTouchStart}
        disabled={!canEdit}
        className={`mt-0.5 flex shrink-0 touch-none select-none flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 transition disabled:cursor-default disabled:opacity-40 md:px-2.5 md:py-2.5 ${
          isDragging
            ? "cursor-grabbing bg-[#2f4a3e]/15"
            : "cursor-grab bg-[#2f4a3e]/8 hover:bg-[#2f4a3e]/15 active:cursor-grabbing"
        }`}
      >
        <DragGripDots active={isDragging} />
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1 md:space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 md:gap-x-3 md:gap-y-1">
          {time?.trim() ? (
            <span className="shrink-0 text-sm font-medium text-[#2f4a3e]/70">
              {time}
            </span>
          ) : null}
          <h3 className="text-base font-medium leading-snug text-[#1f2724]">
            {title}
          </h3>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-stone-500 md:mt-1.5">
          {guidance}
        </p>
        {songSection}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5 md:gap-2.5">
        {isEditing ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#7F8F7A]/35 bg-[#7F8F7A]/12 px-2.5 py-1.5 text-[11px] font-semibold text-[#2f4a3e]">
            <span className="size-1.5 rounded-full bg-[#7F8F7A]" aria-hidden />
            Editing
          </span>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            disabled={!canEdit}
            className="rounded-lg border border-[#2f4a3e]/22 bg-white px-3 py-1.5 text-[12px] font-medium text-[#2f4a3e] transition hover:border-[#2f4a3e]/35 hover:bg-[#f0ece5] disabled:opacity-40"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={!canEdit}
          aria-label={`Remove ${title}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-stone-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
