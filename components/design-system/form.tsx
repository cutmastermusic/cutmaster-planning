"use client";

import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import {
  danger,
  focusRing,
  radius,
  textMuted,
  textSecondary,
  typography,
} from "@/components/design-system/tokens";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const fieldControlClass = cx(
  "w-full touch-manipulation border border-[var(--cm-border-strong)] bg-[var(--cm-admin-surface)] px-3 py-3 text-sm text-[var(--cm-admin-text-primary)] shadow-[var(--cm-shadow-surface)] transition-colors placeholder:text-[var(--cm-text-subtle)] disabled:cursor-not-allowed disabled:opacity-60",
  radius.control,
  focusRing,
);

export function FieldLabel({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) {
  return (
    <label {...props} className={cx(typography.eyebrow, className)}>
      {children}
    </label>
  );
}

export function FieldHint({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={cx("mt-1.5", typography.caption, textMuted, className)}>
      {children}
    </p>
  );
}

export function FieldError({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={cx("mt-1.5 text-xs font-medium", danger.text, className)}>
      {children}
    </p>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldControlClass, "min-h-11", className)} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(fieldControlClass, "min-h-[7rem] resize-y leading-relaxed", className)}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={cx(
        fieldControlClass,
        "min-h-12 cursor-pointer appearance-none pr-10 leading-snug",
        textSecondary,
        className,
      )}
    >
      {children}
    </select>
  );
}
