import type { HTMLAttributes, ReactNode } from "react";

import {
  radius,
  shadow,
  surface,
  textSecondary,
  typography,
} from "@/components/design-system/tokens";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ModalShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * Styling-only modal shell primitive.
 *
 * Phase 1B intentionally includes no open/close behavior. Consumers own modal
 * state, focus management, and backdrop behavior until later migration phases.
 */
export function ModalShell({
  className,
  children,
  ...props
}: ModalShellProps) {
  return (
    <div
      {...props}
      className={cx(
        "flex max-h-[min(90dvh,44rem)] w-full max-w-2xl flex-col overflow-hidden border border-[var(--cm-border)]",
        radius.xl,
        surface.elevated,
        shadow.modal,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      {...props}
      className={cx(
        "flex shrink-0 items-start justify-between gap-4 border-b border-[var(--cm-border)] px-5 py-4",
        className,
      )}
    >
      {children}
    </header>
  );
}

export function ModalTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 {...props} className={cx(typography.pageTitle, className)}>
      {children}
    </h2>
  );
}

export function ModalBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cx("min-h-0 flex-1 overflow-y-auto px-5 py-5", textSecondary, className)}
    >
      {children}
    </div>
  );
}

export function ModalFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <footer
      {...props}
      className={cx(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--cm-border)] px-5 py-4",
        className,
      )}
    >
      {children}
    </footer>
  );
}
