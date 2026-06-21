/**
 * ShowFlow design-system tokens.
 *
 * Phase 1A only: these semantic class maps are a future-facing foundation for
 * Admin/DJ standardization. Do not migrate screen styling here yet; existing UI
 * should opt in gradually through shared components in later phases.
 */

export const canvas = {
  default: "bg-[var(--cm-admin-canvas)]",
  subtle: "bg-[var(--cm-canvas-subtle)]",
} as const;

export const surface = {
  default: "bg-[var(--cm-admin-surface)]",
  muted: "bg-[var(--cm-admin-surface-muted)]",
  elevated: "bg-[var(--cm-surface-elevated)]",
} as const;

export const surfaceMuted = surface.muted;
export const surfaceElevated = surface.elevated;

export const textPrimary = "text-[var(--cm-admin-text-primary)]";
export const textSecondary = "text-[var(--cm-admin-text-secondary)]";
export const textMuted = "text-[var(--cm-admin-text-muted)]";
export const textSubtle = "text-[var(--cm-text-subtle)]";

export const actionPrimary = {
  solid:
    "bg-[var(--cm-admin-action-primary)] text-white hover:brightness-110 active:brightness-95",
  outline:
    "border border-[var(--cm-admin-action-primary)] bg-transparent text-[var(--cm-admin-action-primary)] hover:bg-stone-100",
  subtle:
    "border border-transparent bg-stone-100 text-[var(--cm-admin-action-primary)] hover:bg-stone-200/80",
} as const;

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cm-admin-focus)] focus-visible:ring-offset-2";

export const danger = {
  text: "text-[var(--cm-admin-danger)]",
  surface: "bg-rose-50 text-rose-950",
  border: "border-rose-300/90",
  focus: "focus-visible:ring-rose-400/35",
} as const;

export const warning = {
  text: "text-[var(--cm-admin-warning)]",
  surface: "bg-amber-50 text-amber-950",
  border: "border-amber-300/90",
  focus: "focus-visible:ring-amber-400/35",
} as const;

export const success = {
  text: "text-[var(--cm-admin-success)]",
  surface: "bg-emerald-50 text-emerald-950",
  border: "border-emerald-300/90",
  focus: "focus-visible:ring-emerald-400/35",
} as const;

export const info = {
  text: "text-[var(--cm-admin-info)]",
  surface: "bg-sky-50 text-sky-950",
  border: "border-sky-300/90",
  focus: "focus-visible:ring-sky-400/35",
} as const;

export const radius = {
  small: "rounded-lg",
  medium: "rounded-xl",
  large: "rounded-2xl",
  xl: "rounded-3xl",
  pill: "rounded-full",
  control: "rounded-[var(--cm-radius-control)]",
  card: "rounded-[var(--cm-radius-card)]",
} as const;

export const shadow = {
  surface: "shadow-[var(--cm-shadow-surface)]",
  elevated: "shadow-[var(--cm-shadow-elevated)]",
  modal: "shadow-[var(--cm-shadow-modal)]",
  none: "shadow-none",
} as const;

export const spacing = {
  8: "gap-[var(--cm-space-8)]",
  12: "gap-[var(--cm-space-12)]",
  16: "gap-[var(--cm-space-16)]",
  24: "gap-[var(--cm-space-24)]",
  32: "gap-[var(--cm-space-32)]",
  48: "gap-[var(--cm-space-48)]",
  paddingCard: "p-[var(--cm-space-card-padding)]",
  sectionGap: "gap-[var(--cm-space-section-gap)]",
} as const;

export const typography = {
  display: "text-3xl font-semibold tracking-tight text-[var(--cm-admin-text-primary)]",
  pageTitle: "text-2xl font-semibold tracking-tight text-[var(--cm-admin-text-primary)]",
  sectionHeader:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cm-admin-text-muted)]",
  cardTitle: "text-base font-semibold tracking-tight text-[var(--cm-admin-text-primary)]",
  body: "text-sm leading-relaxed text-[var(--cm-admin-text-secondary)]",
  caption: "text-xs leading-relaxed text-[var(--cm-admin-text-muted)]",
  eyebrow:
    "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--cm-admin-text-muted)]",
} as const;

export const designTokens = {
  canvas,
  surface,
  surfaceMuted,
  surfaceElevated,
  textPrimary,
  textSecondary,
  textMuted,
  textSubtle,
  actionPrimary,
  focusRing,
  danger,
  warning,
  success,
  info,
  radius,
  shadow,
  spacing,
  typography,
} as const;
