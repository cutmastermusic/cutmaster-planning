"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  DEFAULT_STAFF_PROFILE_PHOTO_TRANSFORM,
  type StaffProfilePhotoTransform,
  normalizeStaffProfilePhotoTransform,
} from "@/lib/staffProfilePhoto";

type AccountMenuProps = {
  email: string | null;
  roleLabel: string;
  profilePhotoUrl?: string;
  profilePhotoTransform?: Partial<StaffProfilePhotoTransform> | null;
  profilePhotoUploading?: boolean;
  profilePhotoStatus?: { kind: "success" | "error"; message: string } | null;
  onProfilePhotoUpload?: (file: File, transform: StaffProfilePhotoTransform) => void | Promise<void>;
  onProfilePhotoTransformChange?: (transform: StaffProfilePhotoTransform) => void | Promise<void>;
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

export function AccountMenu({
  email,
  roleLabel,
  profilePhotoUrl,
  profilePhotoTransform,
  profilePhotoUploading = false,
  profilePhotoStatus,
  onProfilePhotoUpload,
  onProfilePhotoTransformChange,
  onSignOut,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [draftTransform, setDraftTransform] = useState<StaffProfilePhotoTransform>(
    () => normalizeStaffProfilePhotoTransform(profilePhotoTransform),
  );
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

  useEffect(() => {
    setDraftTransform(normalizeStaffProfilePhotoTransform(profilePhotoTransform));
  }, [profilePhotoTransform]);

  const updateDraftTransform = (patch: Partial<StaffProfilePhotoTransform>) => {
    const next = normalizeStaffProfilePhotoTransform({ ...draftTransform, ...patch });
    setDraftTransform(next);
    void onProfilePhotoTransformChange?.(next);
  };

  const triggerLabel = email ? truncateEmail(email) : "Account";
  const previewStyle = {
    objectPosition: `${draftTransform.positionX}% ${draftTransform.positionY}%`,
    transformOrigin: `${draftTransform.positionX}% ${draftTransform.positionY}%`,
    transform: `scale(${draftTransform.scale})`,
  };

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
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-stone-200 bg-white py-2 shadow-[0_12px_32px_-12px_rgba(28,25,23,0.22)]"
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
          {onProfilePhotoUpload || onProfilePhotoTransformChange ? (
            <div className="border-b border-stone-100 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                My Profile Photo
              </p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                <div className="relative aspect-[16/7] overflow-hidden bg-[#1f2724]">
                  {profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profilePhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      style={previewStyle}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f1eadf,#d8e0d0)] text-sm font-semibold text-[#8a6938]">
                      Upload a hero photo
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,39,36,0.45),transparent_60%)]" />
                </div>
              </div>
              <label className="mt-3 flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 transition hover:border-stone-900 hover:bg-stone-50">
                {profilePhotoUploading ? "Uploading…" : profilePhotoUrl ? "Replace Photo" : "Upload Photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={profilePhotoUploading}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file) {
                      void onProfilePhotoUpload?.(file, draftTransform);
                    }
                  }}
                />
              </label>
              {profilePhotoUrl ? (
                <div className="mt-3 space-y-2">
                  <label className="block text-[11px] font-medium text-stone-600">
                    Zoom
                    <input
                      type="range"
                      min="1"
                      max="1.8"
                      step="0.01"
                      value={draftTransform.scale}
                      onChange={(event) => updateDraftTransform({ scale: Number(event.target.value) })}
                      className="mt-1 w-full accent-[#c79a5a]"
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-stone-600">
                    Horizontal position
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={draftTransform.positionX}
                      onChange={(event) => updateDraftTransform({ positionX: Number(event.target.value) })}
                      className="mt-1 w-full accent-[#c79a5a]"
                    />
                    <span className="mt-1 block text-[10px] font-normal leading-snug text-stone-400">
                      Most visible when zoom is above 1.0 or the photo is wider than the hero crop.
                    </span>
                  </label>
                  <label className="block text-[11px] font-medium text-stone-600">
                    Vertical position
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={draftTransform.positionY}
                      onChange={(event) => updateDraftTransform({ positionY: Number(event.target.value) })}
                      className="mt-1 w-full accent-[#c79a5a]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => updateDraftTransform(DEFAULT_STAFF_PROFILE_PHOTO_TRANSFORM)}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-950"
                  >
                    Reset crop
                  </button>
                </div>
              ) : null}
              {profilePhotoStatus ? (
                <p
                  className={`mt-3 rounded-lg px-3 py-2 text-[11px] ${
                    profilePhotoStatus.kind === "success"
                      ? "border border-[#7F8F7A]/55 bg-[#7F8F7A]/10 text-[#3f4d3d]"
                      : "border border-rose-300/80 bg-rose-50 text-rose-950"
                  }`}
                >
                  {profilePhotoStatus.message}
                </p>
              ) : null}
            </div>
          ) : null}
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
