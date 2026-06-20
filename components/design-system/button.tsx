"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { actionPrimary, danger, focusRing, radius } from "@/components/design-system/tokens";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: cx("border border-transparent", actionPrimary.solid),
  secondary: cx(actionPrimary.outline, "bg-[var(--cm-admin-surface)]"),
  ghost:
    "border border-transparent bg-transparent text-[var(--cm-admin-text-muted)] hover:bg-[var(--cm-admin-surface-muted)] hover:text-[var(--cm-admin-text-primary)]",
  danger: cx("border", danger.border, danger.surface, "hover:bg-rose-100"),
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-xs",
  md: "min-h-11 px-3.5 py-2.5 text-sm",
  lg: "min-h-12 px-4 py-3 text-sm",
};

/**
 * Admin/DJ design-system button primitive.
 *
 * Phase 1B only: available for future migrations, but existing screens should
 * keep their current classes until intentionally moved onto these primitives.
 */
export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex touch-manipulation items-center justify-center gap-2 font-semibold leading-none transition-[transform,background-color,border-color,color,box-shadow] duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100",
        radius.control,
        focusRing,
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {loading ? <span aria-hidden>Saving...</span> : children}
    </button>
  );
}
