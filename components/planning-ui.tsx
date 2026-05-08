import Image from "next/image";
import type { HTMLAttributes, ReactNode } from "react";

import type {
  AppSettings,
  PlanningInsight,
  Screen,
  SongEntry,
  SongListType,
  WeddingDetails,
} from "@/types/planning";

type AppHeaderProps = {
  screenTitle: string;
  weddingDetails: WeddingDetails;
  savedLocally: boolean;
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
};

type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
};

function InsightAlertCard({ insight }: { insight: PlanningInsight }) {
  const label = insight.variant === "suggestion" ? "Suggestion" : "Heads up";
  return (
    <div className="rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.08] via-[#c9a35c]/[0.06] to-transparent px-3 py-2.5 shadow-[0_6px_24px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-100/90">
          {label}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-zinc-400">
          {insight.section}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-200">{insight.message}</p>
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
      <p className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-xs text-zinc-500">
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
      className={`rounded-2xl border border-white/12 bg-gradient-to-b from-[#1b1b20] to-[#141419] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-[2px] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-safe:hover:-translate-y-[1px] motion-safe:hover:shadow-[0_14px_38px_rgba(0,0,0,0.5)] ${className}`}
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
      className={`min-h-11 rounded-xl px-3 py-2.5 text-[13px] font-medium leading-none tracking-[0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return <h2 className={`text-[15px] font-semibold tracking-tight ${className}`}>{children}</h2>;
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: TextInputProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </label>
      <input
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition-[border-color,background-color,box-shadow] duration-200 focus:border-[#c9a35c]/70 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(201,163,92,0.15)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
}: TextAreaProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition-[border-color,background-color,box-shadow] duration-200 focus:border-[#c9a35c]/70 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(201,163,92,0.15)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
          ? "rounded-xl border border-[#c9a35c]/30 bg-gradient-to-r from-[#c9a35c]/12 to-white/[0.02] p-3 shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-200 ease-out motion-safe:hover:-translate-y-[1px] motion-safe:hover:shadow-[0_10px_22px_rgba(0,0,0,0.42)]"
          : "rounded-xl border border-[#7a5c5c]/35 bg-gradient-to-r from-[#7a5c5c]/25 to-[#1d1d22] p-3 shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-200 ease-out motion-safe:hover:-translate-y-[1px] motion-safe:hover:shadow-[0_10px_22px_rgba(0,0,0,0.42)]"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-100">{song.title}</p>
          {song.artist && <p className="mt-0.5 text-xs text-zinc-400">{song.artist}</p>}
        </div>
        {song.highPriority && (
          <span className="rounded-full bg-[#c9a35c]/22 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[#f5e6c8]">
            Priority
          </span>
        )}
      </div>
      {song.notes && <p className="mt-2 text-xs text-zinc-300">{song.notes}</p>}
      <div className="mt-3 flex gap-2">
        <PrimaryButton
          onClick={() => onTogglePriority(listType, song.id)}
          disabled={disabled}
          className="flex-1 rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
        >
          {song.highPriority ? "Unmark Priority" : "Mark Priority"}
        </PrimaryButton>
        <PrimaryButton
          onClick={() => onRemove(listType, song.id)}
          disabled={disabled}
          className="rounded-lg bg-[#6f5353]/40 px-3 py-2 text-[11px] text-[#f2dede] hover:bg-[#6f5353]/55"
        >
          Remove
        </PrimaryButton>
      </div>
    </div>
  );
}

export function AppHeader({
  screenTitle,
  weddingDetails,
  savedLocally,
  appSettings,
}: AppHeaderProps) {
  return (
    <header
      className="rounded-3xl border bg-gradient-to-b from-white/10 to-white/[0.03] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur"
      style={{ borderColor: `${appSettings.accentColor}4d` }}
    >
      <div className="relative mx-auto w-full max-w-[220px]">
        <Image
          src={appSettings.logoUrl || "/cmm-logo-white.png"}
          alt={appSettings.companyName}
          width={440}
          height={140}
          priority
          sizes="(max-width: 640px) 220px, 260px"
          className="h-auto w-full object-contain drop-shadow-[0_0_16px_rgba(255,255,255,0.12)]"
        />
      </div>
      <p className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-zinc-400">
        {appSettings.companyName}
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">{screenTitle}</h1>
      {weddingDetails.couple ? (
        <>
          <p className="mt-4 text-sm text-zinc-300">
            {appSettings.coupleWelcomeMessage}, {weddingDetails.couple}
          </p>
          <p className="mt-1 text-sm text-zinc-400">Wedding Date: {weddingDetails.date}</p>
          <p className="mt-1 text-sm text-zinc-500">{weddingDetails.venue}</p>
        </>
      ) : null}
      {savedLocally && (
        <div className="mt-3 flex items-center justify-center">
          <span className="rounded-full border border-[#c9a35c]/30 bg-[#c9a35c]/10 px-3 py-1 text-[11px] font-medium text-[#f5e6c8] shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            Saved locally
          </span>
        </div>
      )}
    </header>
  );
}

export function BottomNav({ items, activeScreen, onSelect }: BottomNavProps) {
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-[#c9a35c]/20 bg-[#0a0a0c]/90 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2.5 backdrop-blur-md lg:hidden">
      <ul className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {items.map((item) => (
          <li key={item.screen} className="shrink-0">
            <PrimaryButton
              onClick={() => onSelect(item.screen)}
              className={`min-w-[88px] px-3 ${
                activeScreen === item.screen
                  ? "border border-[#c9a35c]/35 bg-[#c9a35c]/20 text-[#f5e6c8] shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                  : "border border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/5"
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
