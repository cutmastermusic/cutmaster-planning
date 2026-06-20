import type { HTMLAttributes, ReactNode } from "react";

import {
  radius,
  shadow,
  spacing,
  surface,
  textSecondary,
  typography,
} from "@/components/design-system/tokens";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type CardVariant = "default" | "elevated" | "muted";

export type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  children: ReactNode;
};

const cardVariantClass: Record<CardVariant, string> = {
  default: cx(surface.default, shadow.surface),
  elevated: cx(surface.elevated, shadow.elevated),
  muted: cx(surface.muted, shadow.surface),
};

/**
 * Admin/DJ design-system card primitive.
 *
 * Phase 1B only: future shared surface language. Existing screens are not
 * migrated automatically.
 */
export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <article
      {...props}
      className={cx(
        "border border-[var(--cm-border)]",
        radius.card,
        spacing.paddingCard,
        cardVariantClass[variant],
        className,
      )}
    >
      {children}
    </article>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cx("mb-4 space-y-1.5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 {...props} className={cx(typography.cardTitle, className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={cx("max-w-prose", typography.caption, textSecondary, className)}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cx("min-w-0", className)}>
      {children}
    </div>
  );
}
