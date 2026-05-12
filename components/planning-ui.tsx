import Image from "next/image";
import type { HTMLAttributes, ReactNode } from "react";

import type { PersistFeedbackPhase } from "@/hooks/usePlanningApp";
import type {
  AppSettings,
  PlanningInsight,
  Screen,
  SongEntry,
  SongListType,
  WeddingDetails,
} from "@/types/planning";

export type PersistFeedback = {
  phase: PersistFeedbackPhase;
  hasBaseline: boolean;
};

type AppHeaderProps = {
  screenTitle: string;
  weddingDetails: WeddingDetails;
  persistFeedback: PersistFeedback;
  appSettings: AppSettings;
};

type BottomNavProps = {
  items: Array<{ screen: Screen; label: string }>;
  activeScreen: Screen;
  onSelect: (screen: Screen) => void;
};

type PremiumCardProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

type PrimaryButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

type SectionTitleProps = {
  children: ReactNode;
  className?: string;
};

type SongCardProps = {
  song: SongEntry;
  listType: SongListType;
  onTogglePriority: (listType: SongListType, songId: string) => void;
  onRemove: (listType: SongListType, songId: string) => void;
  disabled?: boolean;
};

type TextInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Replace default {@link lightUiInputClass} (e.g. {@link darkUiInputClass} on zinc panels). */
  inputClassName?: string;
  /** Replace default {@link lightUiFormLabelClass}. */
  labelClassName?: string;
};

type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  textareaClassName?: string;
  labelClassName?: string;
};

function InsightAlertCard({ insight }: { insight: PlanningInsight }) {
  const label = insight.variant === "suggestion" ? "Suggestion" : "Heads up";
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-none">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">
          {label}
        </span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-stone-600">
          {insight.section}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-stone-800">{insight.message}</p>
    </div>
  );
}

export function InsightStack({
  insights,
  emptyLabel = "No notes from the assistant right now.",
}: {
  insights: PlanningInsight[];
  emptyLabel?: string;
}) {
  if (insights.length === 0) {
    return (
      <p className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-xs font-medium text-stone-600">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {insights.map((insight) => (
        <InsightAlertCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

export function PremiumCard({ children, className = "", ...rest }: PremiumCardProps) {
  return (
    <article
      {...rest}
      className={`rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors duration-150 ${className}`}
    >
      {children}
    </article>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 touch-manipulation rounded-xl px-3 py-2.5 text-[13px] font-medium leading-none tracking-[0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  );
}

/** Secondary control on white / stone-50 cards (workspace, All Events, admin). */
export const lightUiSecondaryButtonClass =
  "rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-sm transition-[transform,background-color,border-color,color,box-shadow] hover:bg-stone-50 active:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/35 focus-visible:ring-offset-2";

/** Brand primary on light surfaces: charcoal on solid cyan (readable on mobile). */
export const lightUiCyanPrimaryButtonClass =
  "rounded-xl bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-stone-950 shadow-sm transition-[transform,background-color,box-shadow] hover:brightness-105 active:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600/40 focus-visible:ring-offset-2";

/** Destructive control on light surfaces. */
export const lightUiDestructiveButtonClass =
  "rounded-xl border border-rose-300/90 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-950 shadow-sm transition-[transform,background-color,border-color,color,box-shadow] hover:bg-rose-100/90 active:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/35 focus-visible:ring-offset-2";

/** Micro-label for filters / admin fields on white cards (pairs with inputs below). */
export const lightUiFormLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600";

/** Shared field chrome for inputs and selects on light surfaces (TextInput, All Events filters). */
export const lightUiTextControlClass =
  "w-full min-h-11 touch-manipulation rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900 shadow-sm transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Text/search input on light workspace cards; use below {@link lightUiFormLabelClass}. */
export const lightUiInputClass = `mt-1.5 ${lightUiTextControlClass} placeholder:text-stone-500`;

/** Native `<select>` on light workspace cards; use below {@link lightUiFormLabelClass}. */
export const lightUiSelectClass = `mt-1.5 ${lightUiTextControlClass}`;

/** Caption under a section title on white / stone cards (vendors, admin). */
export const lightUiSectionCaptionClass = "mt-1 text-[11px] leading-relaxed text-stone-600";

/** List row on white PremiumCard (arrival rows, etc.). */
export const lightUiListRowClass =
  "rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-stone-800";

/** Empty / hint line inside a white card. */
export const lightUiEmptyHintInCardClass =
  "rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs leading-relaxed text-stone-600";

/** Solid accent CTA on dark panels (timeline preset editor, music import on zinc-950). */
export const darkUiAccentPrimaryButtonClass =
  "rounded-xl bg-[#00D4FF] px-3 py-2 text-[11px] font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-50";

/** Secondary outline on dark panels. */
export const darkUiSecondaryOutlineButtonClass =
  "rounded-xl border border-zinc-500/80 bg-zinc-800/90 px-3 py-2 text-[11px] font-semibold text-zinc-100 shadow-sm hover:border-zinc-400 hover:bg-zinc-800 disabled:opacity-50";

/** Text field on dark zinc panels (Global Settings timeline rows, etc.). */
export const darkUiInputClass =
  "mt-1.5 w-full min-h-11 touch-manipulation rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 shadow-inner placeholder:text-zinc-500 transition-colors focus:border-cyan-500/55 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60";

/** Micro label above fields on dark panels. */
export const darkUiFieldLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400";

/** `<select>` on dark zinc panels. */
export const darkUiSelectClass =
  "mt-1.5 w-full min-h-11 touch-manipulation rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 shadow-inner transition-colors focus:border-cyan-500/55 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:ring-offset-0 disabled:opacity-60";

/** Compact secondary control on dark panel rows. */
export const darkUiCompactGhostButtonClass =
  "rounded-lg border border-zinc-500/70 bg-zinc-800 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-100 shadow-sm hover:bg-zinc-700/90";

/** Inline danger on dark panel. */
export const darkUiDangerGhostButtonClass =
  "rounded-lg border border-rose-500/45 bg-rose-950/40 px-2.5 py-1.5 text-[11px] font-semibold text-rose-100 shadow-sm hover:bg-rose-950/55";

/** Empty state inside a dark accordion/panel. */
export const darkUiEmptyStateInPanelClass =
  "rounded-xl border border-dashed border-zinc-600 bg-zinc-950/60 px-4 py-6 text-center text-xs leading-relaxed text-zinc-300";

/**
 * “Jump to workspace settings” from a dark dashboard card (e.g. Admin quick actions).
 * Opaque charcoal surface + light text — avoids dark-on-dark from translucent cyan over zinc-950.
 */
export const darkUiWorkspaceJumpButtonClass =
  "rounded-xl border border-[#9a7c3d]/55 bg-zinc-900 px-3 py-2.5 text-[11px] font-semibold leading-snug text-zinc-100 shadow-sm shadow-black/25 transition-[transform,background-color,border-color,box-shadow] hover:border-[#b8924a]/70 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8924a]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.99]";

type EventHomeNavAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/** Consistent back control + compact breadcrumb for event workspace screens (especially client/couple flows). */
export function EventHomeNav({
  trail,
  onBack,
  backLabel = "← Back to Event Home",
  primaryAction,
  className = "",
}: {
  trail: string[];
  onBack: () => void;
  backLabel?: string;
  primaryAction?: EventHomeNavAction;
  className?: string;
}) {
  return (
    <div className={`no-print flex min-w-0 flex-col gap-3 ${className}`.trim()}>
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <PrimaryButton
            type="button"
            onClick={onBack}
            className="min-h-12 w-full shrink-0 justify-start rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-left text-sm font-semibold text-stone-900 shadow-none transition hover:border-stone-900 hover:bg-stone-50 sm:inline-flex sm:min-h-11 sm:w-auto sm:py-3"
          >
            {backLabel}
          </PrimaryButton>
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-snug text-stone-600 sm:text-[11px]">
              <li className="font-semibold text-stone-700">Event Home</li>
              {trail.map((segment) => (
                <li key={segment} className="flex min-w-0 items-center gap-1.5">
                  <span aria-hidden className="select-none text-stone-400">
                    →
                  </span>
                  <span className="min-w-0 break-words font-semibold text-stone-900">{segment}</span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        {primaryAction ? (
          <PrimaryButton
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="min-h-12 w-full shrink-0 rounded-xl border border-black bg-[#00D4FF] px-4 py-3.5 text-sm font-semibold text-black shadow-none hover:brightness-[0.97] disabled:opacity-45 sm:min-h-11 sm:py-2.5 lg:w-auto lg:self-start"
          >
            {primaryAction.label}
          </PrimaryButton>
        ) : null}
      </div>
    </div>
  );
}

type EmptyStateAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type SectionEmptyStateProps = {
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** When false, renders a subtle inset panel for use inside an existing card. */
  wrapWithCard?: boolean;
  cardClassName?: string;
};

export function SectionEmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  wrapWithCard = true,
  cardClassName = "",
}: SectionEmptyStateProps) {
  const inner = (
    <>
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-600">{description}</p>
      {primaryAction || secondaryAction ? (
        <div className="mt-4 flex flex-col gap-2 sm:mx-auto sm:max-w-lg sm:flex-row sm:justify-center sm:gap-3">
          {primaryAction ? (
            <PrimaryButton
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="min-h-11 w-full rounded-xl border border-black bg-[#00D4FF] px-4 py-2.5 text-sm font-semibold text-black shadow-none hover:brightness-[0.97] disabled:opacity-45 sm:min-h-10 sm:flex-1 sm:py-2"
            >
              {primaryAction.label}
            </PrimaryButton>
          ) : null}
          {secondaryAction ? (
            <PrimaryButton
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-none hover:bg-stone-50 disabled:opacity-45 sm:min-h-10 sm:flex-1 sm:py-2"
            >
              {secondaryAction.label}
            </PrimaryButton>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (!wrapWithCard) {
    return (
      <div
        className={`rounded-xl border border-stone-300 bg-stone-50 px-3 py-4 text-center sm:px-4 ${cardClassName}`.trim()}
      >
        {inner}
      </div>
    );
  }

  return (
    <PremiumCard
      className={`border-dashed border-stone-300 bg-white py-5 sm:py-6 ${cardClassName}`.trim()}
    >
      <div className="px-1 text-center sm:px-2">{inner}</div>
    </PremiumCard>
  );
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <h2 className={`text-[15px] font-semibold tracking-tight text-stone-950 ${className}`.trim()}>
      {children}
    </h2>
  );
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  inputClassName,
  labelClassName,
}: TextInputProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName ?? lightUiFormLabelClass}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClassName ?? lightUiInputClass}
      />
    </div>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  textareaClassName,
  labelClassName,
}: TextAreaProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName ?? lightUiFormLabelClass}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={
          textareaClassName ??
          `mt-1.5 ${lightUiTextControlClass} min-h-[5.5rem] resize-y placeholder:text-stone-500`
        }
      />
    </div>
  );
}

export function SongCard({
  song,
  listType,
  onTogglePriority,
  onRemove,
  disabled = false,
}: SongCardProps) {
  const isMustPlay = listType === "mustPlay";
  return (
    <div
      className={
        isMustPlay
          ? "rounded-xl border border-stone-200 border-l-[3px] border-l-[#7E52A0] bg-white p-3 shadow-none"
          : "rounded-xl border border-stone-200 bg-white p-3 shadow-none"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-stone-900">{song.title}</p>
          {song.artist && <p className="mt-0.5 text-xs font-medium text-stone-600">{song.artist}</p>}
        </div>
        {song.highPriority && (
          <span className="rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-800">
            Priority
          </span>
        )}
      </div>
      {song.notes && <p className="mt-2 text-xs font-medium text-stone-700">{song.notes}</p>}
      <div className="mt-3 flex gap-2">
        <PrimaryButton
          onClick={() => onTogglePriority(listType, song.id)}
          disabled={disabled}
          className="flex-1 rounded-lg border border-stone-300 bg-white px-2 py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
        >
          {song.highPriority ? "Unmark Priority" : "Mark Priority"}
        </PrimaryButton>
        <PrimaryButton
          onClick={() => onRemove(listType, song.id)}
          disabled={disabled}
          className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-[11px] font-semibold text-rose-900 hover:bg-rose-50"
        >
          Remove
        </PrimaryButton>
      </div>
    </div>
  );
}

export function PersistEcho({
  persistFeedback,
  variant = "light",
  className = "",
}: {
  persistFeedback: PersistFeedback;
  variant?: "light" | "dark";
  className?: string;
}) {
  const { phase } = persistFeedback;
  if (phase === "idle") return null;
  const label = phase === "pending" ? "Saving…" : "Saved";
  const tone =
    variant === "dark"
      ? phase === "pending"
        ? "text-[#9ae8ff]/95"
        : "text-zinc-200"
      : phase === "pending"
        ? "text-stone-600"
        : "text-stone-800";
  return (
    <span
      className={`shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] ${tone} ${className}`.trim()}
      aria-live="polite"
    >
      {label}
    </span>
  );
}

export function AppHeader({
  screenTitle,
  weddingDetails,
  persistFeedback,
  appSettings,
}: AppHeaderProps) {
  const saveLabel =
    persistFeedback.phase === "pending"
      ? "Saving…"
      : persistFeedback.phase === "saved"
        ? "Saved just now"
        : persistFeedback.hasBaseline
          ? "All changes saved"
          : null;
  const saveTone =
    persistFeedback.phase === "pending"
      ? "text-stone-600"
      : persistFeedback.phase === "saved"
        ? "text-stone-900"
        : "text-stone-500";

  return (
    <header className="rounded-2xl border border-stone-200 bg-white p-5 shadow-none">
      <div className="relative mx-auto w-full max-w-[220px]">
        <Image
          src={appSettings.logoUrl || "/cmm-logo-white.png"}
          alt={appSettings.companyName}
          width={440}
          height={140}
          priority
          sizes="(max-width: 640px) 220px, 260px"
          className="h-auto w-full object-contain brightness-0"
        />
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
        {appSettings.companyName}
      </p>
      <div className="mt-3 flex min-w-0 items-start justify-between gap-3">
        <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-stone-950">{screenTitle}</h1>
        {saveLabel ? (
          <p
            className={`shrink-0 pt-1 text-right text-[11px] font-medium leading-snug tracking-tight ${saveTone}`}
            aria-live="polite"
          >
            {saveLabel}
          </p>
        ) : null}
      </div>
      {weddingDetails.couple ? (
        <>
          <p className="mt-4 text-sm font-medium text-stone-800">
            {appSettings.coupleWelcomeMessage}, {weddingDetails.couple}
          </p>
          <p className="mt-1 text-sm text-stone-600">Wedding Date: {weddingDetails.date}</p>
          <p className="mt-1 text-sm text-stone-600">{weddingDetails.venue}</p>
        </>
      ) : null}
    </header>
  );
}

export function BottomNav({ items, activeScreen, onSelect }: BottomNavProps) {
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg border-t border-stone-300 bg-white px-2 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pt-3 shadow-none lg:hidden">
      <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 pl-0.5 pr-2 pt-0.5 no-scrollbar">
        {items.map((item) => (
          <li key={item.screen} className="snap-start shrink-0">
            <PrimaryButton
              onClick={() => onSelect(item.screen)}
              className={`min-h-[3.25rem] min-w-[96px] touch-manipulation px-3.5 ${
                activeScreen === item.screen
                  ? "border border-black bg-[#00D4FF] font-semibold text-black shadow-none"
                  : "border border-stone-300 bg-white font-medium text-stone-900 hover:bg-stone-50"
              }`}
            >
              {item.label}
            </PrimaryButton>
          </li>
        ))}
      </ul>
    </nav>
  );
}
