import type { HTMLAttributes, ReactNode } from "react";

import {
  danger,
  info,
  radius,
  success,
  textMuted,
  warning,
} from "@/components/design-system/tokens";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

const badgeVariantClass: Record<BadgeVariant, string> = {
  neutral: cx("border border-[var(--cm-border)] bg-[var(--cm-admin-surface-muted)]", textMuted),
  success: cx("border", success.border, success.surface),
  warning: cx("border", warning.border, warning.surface),
  danger: cx("border", danger.border, danger.surface),
  info: cx("border", info.border, info.surface),
};

/**
 * Admin/DJ status badge / pill primitive for future migrations.
 */
export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={cx(
        "inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        radius.pill,
        badgeVariantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const Pill = Badge;
