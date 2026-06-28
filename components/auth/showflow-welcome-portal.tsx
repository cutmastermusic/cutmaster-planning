"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { MagicLinkLoginForm } from "@/components/auth/magic-link-login-form";

type WelcomePortalKind = "staff" | "client";

type ShowFlowWelcomePortalProps = {
  defaultEmail?: string;
  nextPath?: string;
  initialKind?: WelcomePortalKind | null;
  showPrototypeLink?: boolean;
  authError?: string;
};

const FEATURE_POINTS = [
  {
    title: "Plan every detail",
    description: "Stay organized",
    icon: CalendarIcon,
  },
  {
    title: "Curate the perfect soundtrack",
    description: "Music that moves",
    icon: MusicIcon,
  },
  {
    title: "Collaborate with your team",
    description: "Everyone in sync",
    icon: PeopleIcon,
  },
  {
    title: "Deliver an incredible experience",
    description: "Show-ready flow",
    icon: WaveIcon,
  },
] as const;

const PORTAL_CARDS = [
  {
    kind: "staff",
    title: "I'm on the ShowFlow Team",
    label: "SHOWFLOW PRO",
    description: "DJs, planners, and staff managing amazing events.",
    buttonLabel: "Continue as ShowFlow Pro",
    accentClass: "bg-[#f1eadf] text-[#8a6938]",
    ringClass: "border-[#b08a45]/35 bg-[#fffaf6] shadow-[0_28px_90px_-64px_rgba(84,60,32,0.55)]",
    icon: StaffIcon,
  },
  {
    kind: "client",
    title: "I'm Planning My Event",
    label: "PLANNING PORTAL",
    description: "Continue planning your event, review your timeline, and collaborate with your DJ.",
    buttonLabel: "Continue to My Planner",
    accentClass: "bg-[#edf1e8] text-[#2f4a3e]",
    ringClass: "border-[#7F8F7A]/35 bg-white shadow-[0_28px_90px_-64px_rgba(47,74,62,0.48)]",
    icon: ClientIcon,
  },
] as const;

const TRUST_ITEMS = [
  {
    title: "Secure & Private",
    description: "Your event details stay protected.",
    icon: ShieldIcon,
  },
  {
    title: "Always in Sync",
    description: "Real-time updates keep your team aligned.",
    icon: CloudIcon,
  },
  {
    title: "Built by Cutmaster Music",
    description: "Designed by DJs who care about every detail.",
    icon: HeartIcon,
  },
] as const;

function sanitizeNextPath(next: string | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  return trimmed;
}

export function ShowFlowWelcomePortal({
  defaultEmail = "",
  nextPath = "/",
  initialKind = null,
  showPrototypeLink = false,
  authError,
}: ShowFlowWelcomePortalProps) {
  const [activeKind, setActiveKind] = useState<WelcomePortalKind | null>(initialKind);
  const [clientQueryDefaults, setClientQueryDefaults] = useState<{
    email: string;
    nextPath: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email")?.trim() ?? "";
    const next = sanitizeNextPath(params.get("next") ?? undefined);
    if (email || next !== "/") {
      setClientQueryDefaults({ email, nextPath: next });
      setActiveKind((current) => current ?? "client");
    }
  }, []);

  const resolvedDefaultEmail = clientQueryDefaults?.email || defaultEmail;
  const resolvedNextPath = sanitizeNextPath(clientQueryDefaults?.nextPath || nextPath);

  const activeCard = useMemo(
    () => PORTAL_CARDS.find((card) => card.kind === activeKind) ?? null,
    [activeKind],
  );

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#fbfaf7] text-[#1f2724]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(199,154,90,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(127,143,122,0.10),transparent_34%),linear-gradient(180deg,#fffdf9_0%,#f8f3eb_100%)]" />

      <header className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6">
        <div>
          <Image
            src="/branding/showflow-logo.svg"
            alt="ShowFlow"
            width={220}
            height={56}
            priority
            className="h-auto w-[150px] sm:w-[190px]"
          />
          <p className="mt-1.5 pl-[3.45rem] text-[8px] font-semibold uppercase tracking-[0.24em] text-stone-400 sm:pl-[4.35rem] sm:text-[9px]">
            Ready for your best day.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium text-stone-500 sm:text-xs">
          <a href="mailto:hello@cutmastermusic.com" className="hidden transition hover:text-stone-900 sm:inline">
            Need help?
          </a>
          <span className="hidden h-4 w-px bg-stone-200 sm:block" aria-hidden />
          <span className="text-stone-700">Cutmaster Music</span>
        </div>
      </header>

      <section className="w-full pb-14 lg:pb-20">
        <div className="relative overflow-hidden border-y border-stone-200/70 bg-[#fbfaf7]">
          <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block">
            <Image
              src="/images/showflow-welcome-hero.jpg"
              alt=""
              fill
              priority
              sizes="48vw"
              className="scale-[1.07] object-cover object-[62%_50%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#fbfaf7_0%,#fbfaf7_6%,rgba(251,250,247,0.7)_15%,rgba(251,250,247,0.2)_24%,transparent_30%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,250,247,0.04)_0%,transparent_48%,rgba(31,39,36,0.12)_100%)]" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[28rem] w-full max-w-7xl flex-col justify-center px-5 py-12 sm:px-8 sm:py-14 lg:py-16">
            <div className="max-w-[38rem]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a07830]">
                Welcome to ShowFlow
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-stone-950 sm:text-5xl lg:text-6xl">
                Everything you need for an unforgettable event.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
                A calm, connected planning hub for timelines, music, event details, and the team bringing it all to life.
              </p>
            </div>

            <div className="mt-10 grid max-w-4xl gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-12">
              {FEATURE_POINTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-[#a07830]/80">
                      <Icon />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-medium leading-snug tracking-tight text-stone-800">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[10px] font-medium leading-snug text-stone-400">
                        {item.description}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative h-64 overflow-hidden border-t border-stone-200/70 lg:hidden">
            <Image
              src="/images/showflow-welcome-hero.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="scale-[1.03] object-cover object-[58%_50%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbfaf7_0%,rgba(251,250,247,0.24)_28%,rgba(31,39,36,0.18)_100%)]" />
          </div>
        </div>

        <section className="mx-auto mt-12 max-w-5xl px-5 sm:px-8 lg:mt-14">
          <div className="text-center">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">
              Choose how you&apos;d like to continue
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              We&apos;ll email you a secure sign-in link.
            </p>
          </div>

          {authError === "auth_callback_failed" ? (
            <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-medium text-red-700">
              Sign-in link expired or could not be verified. Request a new magic link below.
            </p>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {PORTAL_CARDS.map((card) => {
              const Icon = card.icon;
              const expanded = activeKind === card.kind;
              return (
                <article
                  key={card.kind}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded}
                  onClick={() => setActiveKind(card.kind)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveKind(card.kind);
                    }
                  }}
                  className={`cursor-pointer rounded-[2rem] border p-6 transition-[border-color,box-shadow,background-color,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/35 sm:p-7 ${
                    expanded
                      ? card.ringClass
                      : "border-stone-200/90 bg-white/76 shadow-[0_24px_82px_-66px_rgba(31,39,36,0.5)] hover:border-[#b08a45]/35 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <span className={`flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] ${card.accentClass}`}>
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6938]">
                        {card.label}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-stone-600">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {expanded ? (
                    <div
                      className="mt-6 rounded-2xl border border-stone-200/70 bg-white/78 p-4 shadow-inner shadow-stone-100/70"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <h4 className="text-sm font-semibold text-stone-950">Enter your email</h4>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">
                        We&apos;ll send you a secure access link.
                      </p>
                      <div className="mt-4">
                        <MagicLinkLoginForm
                          key={`${card.kind}-${resolvedDefaultEmail}-${resolvedNextPath}`}
                          showPrototypeLink={showPrototypeLink}
                          nextPath={resolvedNextPath}
                          defaultEmail={resolvedDefaultEmail}
                        />
                      </div>
                    </div>
                  ) : (
                    <span
                      className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        card.kind === "staff"
                          ? "border border-[#1f2724] bg-[#1f2724] text-white shadow-none hover:bg-[#2b3531]"
                          : "border border-[#2f4a3e]/24 bg-white text-[#2f4a3e] hover:border-[#2f4a3e]/35 hover:bg-[#f4f7ef]"
                      }`}
                    >
                      {card.buttonLabel}
                      <span className="ml-2" aria-hidden>
                        →
                      </span>
                    </span>
                  )}
                </article>
              );
            })}
          </div>

          {activeCard ? (
            <p className="mt-4 text-center text-[11px] font-medium text-stone-500">
              Continuing through {activeCard.label.toLowerCase()}.
            </p>
          ) : null}
        </section>

        <section className="mx-auto mt-8 grid max-w-5xl gap-4 rounded-[1.75rem] border border-stone-200/70 bg-white/56 p-5 shadow-[0_18px_70px_-62px_rgba(31,39,36,0.55)] sm:grid-cols-3 sm:p-6">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3 px-1 py-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f2eadc] text-[#a07830]">
                  <Icon />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-stone-900">{item.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-stone-500">{item.description}</span>
                </span>
              </div>
            );
          })}
        </section>

        <footer className="mt-8 text-center">
          <p className="text-[11px] font-medium text-stone-400">
            Invited by Cutmaster Music. Powered by ShowFlow.
          </p>
        </footer>
      </section>
    </div>
  );
}

function IconSvg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" aria-hidden className="size-5">
      {children}
    </svg>
  );
}

function CalendarIcon() {
  return (
    <IconSvg>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5v3M17 3.5v3M4.5 9h15M6.5 5.5h11A2.5 2.5 0 0 1 20 8v9.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5V8a2.5 2.5 0 0 1 2.5-2.5Z" />
    </IconSvg>
  );
}

function MusicIcon() {
  return (
    <IconSvg>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </IconSvg>
  );
}

function PeopleIcon() {
  return (
    <IconSvg>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 11.5a2.5 2.5 0 1 0 0-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19a5 5 0 0 1 10 0M13.5 15.5A4.5 4.5 0 0 1 20.5 19" />
    </IconSvg>
  );
}

function WaveIcon() {
  return (
    <IconSvg>
      <path strokeLinecap="round" d="M4 12h2.5M9 6v12M12 9v6M15 4.5v15M18 10v4.5M21 12h-1" />
    </IconSvg>
  );
}

function StaffIcon() {
  return (
    <IconSvg>
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </IconSvg>
  );
}

function ClientIcon() {
  return (
    <IconSvg>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a2.5 2.5 0 1 0 0-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19a5 5 0 0 1 9 0M13.5 16a4.5 4.5 0 0 1 6.5 3" />
    </IconSvg>
  );
}

function ShieldIcon() {
  return (
    <IconSvg>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 19 6v5.5c0 4.1-2.8 7.2-7 8.9-4.2-1.7-7-4.8-7-8.9V6l7-2.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </IconSvg>
  );
}

function CloudIcon() {
  return (
    <IconSvg>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 18h9.25a4.25 4.25 0 0 0 .85-8.4A6 6 0 0 0 6.25 8.25 4.9 4.9 0 0 0 7.5 18Z" />
    </IconSvg>
  );
}

function HeartIcon() {
  return (
    <IconSvg>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 8.75c0 5.25-8 10.25-8 10.25S4 14 4 8.75A4.25 4.25 0 0 1 12 6.7a4.25 4.25 0 0 1 8 2.05Z" />
    </IconSvg>
  );
}
