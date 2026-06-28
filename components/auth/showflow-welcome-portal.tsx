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
    title: "I'm a ShowFlow Pro",
    label: "STAFF ACCESS",
    description: "Manage events, timelines, music, and prepare for amazing shows.",
    buttonLabel: "Continue as Staff",
    accentClass: "bg-[#efe7d9] text-[#8a6938]",
    ringClass: "border-[#b08a45]/35 bg-[#fffaf1] shadow-[0_24px_70px_-52px_rgba(84,60,32,0.5)]",
    icon: StaffIcon,
  },
  {
    kind: "client",
    title: "I'm Planning an Event",
    label: "PLANNING PORTAL",
    description: "Continue planning your event, review your timeline, and collaborate with your DJ.",
    buttonLabel: "Continue to My Planner",
    accentClass: "bg-[#efe6f4] text-[#7E52A0]",
    ringClass: "border-[#7E52A0]/25 bg-white shadow-[0_24px_70px_-52px_rgba(83,53,107,0.45)]",
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
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(199,154,90,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(126,82,160,0.10),transparent_34%),linear-gradient(180deg,#fffdf9_0%,#f8f3eb_100%)]" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Image
          src="/branding/showflow-logo.svg"
          alt="ShowFlow"
          width={220}
          height={56}
          priority
          className="h-auto w-[150px] sm:w-[190px]"
        />
        <div className="flex items-center gap-3 text-[11px] font-medium text-stone-500 sm:text-xs">
          <a href="mailto:hello@cutmastermusic.com" className="hidden transition hover:text-stone-900 sm:inline">
            Need help?
          </a>
          <span className="hidden h-4 w-px bg-stone-200 sm:block" aria-hidden />
          <span className="text-stone-700">Cutmaster Music</span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 pb-10 pt-3 sm:px-8 lg:pb-16">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 shadow-[0_26px_90px_-72px_rgba(31,39,36,0.65)] ring-1 ring-stone-200/60 backdrop-blur">
          <div className="grid min-h-[25rem] lg:grid-cols-[minmax(0,1.02fr)_minmax(24rem,0.98fr)]">
            <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a07830]">
                Welcome to ShowFlow
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-stone-950 sm:text-5xl lg:text-6xl">
                Everything you need for an unforgettable event.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
                A calm, connected planning hub for timelines, music, event details, and the team bringing it all to life.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {FEATURE_POINTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-white/70 px-3.5 py-3">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadc] text-[#a07830]">
                        <Icon />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold tracking-tight text-stone-900">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-stone-500">
                          {item.description}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative min-h-[18rem] overflow-hidden border-t border-white/80 bg-[#e9dfd2] lg:border-l lg:border-t-0">
              <Image
                src="/images/default-event-hero.svg"
                alt=""
                fill
                priority
                className="object-cover opacity-80 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,250,247,0.88)_0%,rgba(251,250,247,0.45)_32%,rgba(251,250,247,0.1)_100%),radial-gradient(circle_at_70%_35%,rgba(255,255,255,0.72),transparent_34%),linear-gradient(180deg,rgba(199,154,90,0.12),rgba(31,39,36,0.18))]" />
              <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/70 bg-white/55 p-4 shadow-[0_18px_60px_-42px_rgba(31,39,36,0.8)] backdrop-blur-md sm:left-auto sm:w-80">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6938]">
                  Planning, in flow
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  One polished place for clients and pros to stay aligned before showtime.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mx-auto mt-9 max-w-5xl">
          <div className="text-center">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">
              Choose how you&apos;d like to continue
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              We&apos;ll send a secure access link to the email connected to your ShowFlow account.
            </p>
          </div>

          {authError === "auth_callback_failed" ? (
            <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-medium text-red-700">
              Sign-in link expired or could not be verified. Request a new magic link below.
            </p>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
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
                  className={`cursor-pointer rounded-[1.75rem] border p-5 transition-[border-color,box-shadow,background-color,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/35 sm:p-6 ${
                    expanded
                      ? card.ringClass
                      : "border-stone-200/90 bg-white/72 shadow-[0_20px_70px_-60px_rgba(31,39,36,0.45)] hover:border-[#b08a45]/35 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${card.accentClass}`}>
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
                          : "border border-[#7E52A0]/24 bg-white text-[#6d477f] hover:border-[#7E52A0]/35 hover:bg-[#fbf6ff]"
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

        <section className="mx-auto mt-7 grid max-w-5xl gap-3 rounded-[1.5rem] border border-stone-200/70 bg-white/58 p-4 shadow-[0_18px_70px_-62px_rgba(31,39,36,0.55)] sm:grid-cols-3 sm:p-5">
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
