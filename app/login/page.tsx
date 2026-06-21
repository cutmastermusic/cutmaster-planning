import Link from "next/link";
import Image from "next/image";

import { MagicLinkLoginForm } from "@/components/auth/magic-link-login-form";
import { PremiumCard, SectionTitle } from "@/components/planning-ui";
import {
  getAuthMode,
  isAuthBypassEnabled,
  isSupabaseConfigured,
  showPrototypeLogin,
  showSupabaseLogin,
} from "@/lib/auth/authConfig";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; next?: string; email?: string }>;
};

function sanitizeNextPath(next: string | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  return trimmed;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const authError = params?.error;
  const nextPath = sanitizeNextPath(params?.next);
  const defaultEmail = params?.email?.trim() ?? "";
  const supabaseConfigured = isSupabaseConfigured();
  const authMode = getAuthMode();
  const bypassEnabled = isAuthBypassEnabled();
  const canUseSupabaseLogin = showSupabaseLogin();
  const canUsePrototypeLogin = showPrototypeLogin();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-5 py-16 sm:px-6">
      <PremiumCard variant="accent">
        <div className="mx-auto mb-4 w-full max-w-[220px]">
          <Image
            src="/branding/showflow-horizontal-logo.svg"
            alt="ShowFlow"
            width={440}
            height={140}
            priority
            className="h-auto w-full object-contain"
          />
        </div>
        <SectionTitle>Sign in to ShowFlow</SectionTitle>

        {authError === "auth_callback_failed" ? (
          <p className="mt-2 text-xs text-red-700">
            Sign-in link expired or could not be verified. Request a new magic link below.
          </p>
        ) : null}

        {!supabaseConfigured ? (
          <div className="mt-3 space-y-3 text-xs text-stone-600">
            <p>Supabase auth is not configured in this environment.</p>
            {canUsePrototypeLogin ? (
              <Link
                href="/"
                className="inline-flex font-semibold text-stone-950 underline underline-offset-2"
              >
                Continue with prototype role picker
              </Link>
            ) : null}
          </div>
        ) : canUseSupabaseLogin ? (
          <div className="mt-4">
            <p className="mb-3 text-xs text-stone-600">
              We&apos;ll email you a secure sign-in link. No password required.
            </p>
            <MagicLinkLoginForm
              showPrototypeLink={canUsePrototypeLogin}
              nextPath={nextPath}
              defaultEmail={defaultEmail}
            />
          </div>
        ) : (
          <div className="mt-3 space-y-3 text-xs text-stone-600">
            <p>
              Auth mode is <span className="font-semibold text-stone-950">{authMode}</span>
              {bypassEnabled ? " with prototype bypass enabled" : ""}.
            </p>
            {canUsePrototypeLogin ? (
              <Link
                href="/"
                className="inline-flex font-semibold text-stone-950 underline underline-offset-2"
              >
                Continue with prototype role picker
              </Link>
            ) : null}
          </div>
        )}
      </PremiumCard>
    </main>
  );
}
