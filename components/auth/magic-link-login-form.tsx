"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { getAuthCallbackUrl } from "@/lib/auth/authConfig";
import { createClient } from "@/lib/supabase/client";
import { PrimaryButton, TextInput } from "@/components/planning-ui";

type MagicLinkLoginFormProps = {
  showPrototypeLink?: boolean;
  nextPath?: string;
  defaultEmail?: string;
};

type FormStatus = "idle" | "sending" | "sent" | "error";

function sanitizeNextPath(next: string | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  return trimmed;
}

export function MagicLinkLoginForm({
  showPrototypeLink = true,
  nextPath = "/",
  defaultEmail = "",
}: MagicLinkLoginFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage("Enter your email address.");
      return;
    }

    setStatus("sending");
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: getAuthCallbackUrl(sanitizeNextPath(nextPath)),
        },
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not send magic link.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <TextInput
          id="magic-link-email"
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          disabled={status === "sending" || status === "sent"}
        />
        <PrimaryButton
          type="submit"
          disabled={status === "sending" || status === "sent"}
          className="w-full rounded-xl border border-[#1f2724] bg-[#1f2724] px-3 py-2.5 text-xs font-semibold text-white shadow-none hover:bg-[#2b3531] active:bg-[#171d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/45 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : status === "sent" ? "Access link sent" : "Email me my secure access link"}
        </PrimaryButton>
      </form>

      {status === "sent" ? (
        <p className="text-xs text-stone-600">
          Check your email for your secure ShowFlow access link. You can close this tab after clicking it.
        </p>
      ) : null}

      {errorMessage ? <p className="text-xs text-red-700">{errorMessage}</p> : null}

      {showPrototypeLink ? (
        <p className="text-xs text-stone-600">
          Prefer the prototype?{" "}
          <Link href="/" className="font-semibold text-stone-950 underline underline-offset-2">
            Continue with role picker
          </Link>
        </p>
      ) : null}
    </div>
  );
}
