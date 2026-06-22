"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type AccountMenuProps = {
  email: string | null;
  roleLabel: string;
  onSignOut: () => void | Promise<void>;
};

function truncateEmail(email: string, maxLength = 22): string {
  if (email.length <= maxLength) return email;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex >= email.length - 1) {
    return `${email.slice(0, maxLength - 1)}…`;
  }
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  if (local.length <= 8) {
    return `${local}${domain.length > maxLength - local.length ? `${domain.slice(0, maxLength - local.length - 1)}…` : domain}`;
  }
  return `${local.slice(0, 8)}…${domain}`;
}

export function AccountMenu({ email, roleLabel, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, open]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    closeMenu();
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  const triggerLabel = email ? truncateEmail(email) : "Account";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex min-h-9 max-w-[12.5rem] items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-900 shadow-none transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C79A5A]/70"
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold uppercase text-white"
          aria-hidden
        >
          {(email?.trim()[0] ?? roleLabel.trim()[0] ?? "?").toUpperCase()}
        </span>
        <span className="truncate">{triggerLabel}</span>
        <span className="text-[10px] text-stone-500" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-stone-200 bg-white py-2 shadow-[0_12px_32px_-12px_rgba(28,25,23,0.22)]"
        >
          <div className="border-b border-stone-100 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Signed in
            </p>
            {email ? (
              <p className="mt-1 break-all text-sm font-medium text-stone-950">{email}</p>
            ) : (
              <p className="mt-1 text-sm font-medium text-stone-700">Prototype session</p>
            )}
            <p className="mt-2 text-xs text-stone-600">
              Role: <span className="font-semibold text-stone-900">{roleLabel}</span>
            </p>
          </div>
          <div className="px-2 pt-2">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={() => {
                void handleSignOut();
              }}
              className="flex w-full items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 transition hover:border-stone-900 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
