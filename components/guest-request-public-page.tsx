"use client";

import { useState } from "react";

type GuestRequestPublicPageProps = {
  token: string;
  enabled: boolean;
  limitReached: boolean;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

export function GuestRequestPublicPage({
  token,
  enabled,
  limitReached,
}: GuestRequestPublicPageProps) {
  const [guestName, setGuestName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const closed = !enabled || limitReached;

  async function submitRequest() {
    const cleanName = guestName.trim();
    const cleanTitle = songTitle.trim();
    if (!cleanName || !cleanTitle || closed) {
      setSubmitState({ status: "error", message: "Please add your name and song title." });
      return;
    }

    setSubmitState({ status: "submitting" });
    try {
      const response = await fetch(`/api/guest-requests/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: cleanName,
          songTitle: cleanTitle,
          artist: artist.trim(),
        }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setSubmitState({
          status: "error",
          message: data.message || "We could not send your request. Please try again.",
        });
        return;
      }
      setSubmitState({ status: "success" });
    } catch {
      setSubmitState({ status: "error", message: "We could not send your request. Please try again." });
    }
  }

  function submitAnother() {
    setSongTitle("");
    setArtist("");
    setSubmitState({ status: "idle" });
  }

  return (
    <main className="min-h-screen bg-[#f7f5f1] px-4 py-8 text-[#1f2724]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center">
        <div className="w-full rounded-[2rem] border border-[#2f4a3e]/15 bg-white p-6 shadow-[0_24px_70px_-50px_rgba(47,74,62,0.75)] sm:p-8">
          {submitState.status === "success" ? (
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#2f4a3e]/10 text-3xl">
                🎉
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#214637]">Thanks!</h1>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                Your song suggestion has been sent to the couple.
              </p>
              <p className="mt-2 text-base leading-relaxed text-stone-600">
                We can’t wait to celebrate with you.
              </p>
              <button
                type="button"
                onClick={submitAnother}
                className="mt-7 min-h-11 rounded-xl bg-[#2f4a3e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3a5a4c]"
              >
                Submit Another Song
              </button>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b08a45]">
                ShowFlow
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#214637]">
                🎵 Suggest a Song
              </h1>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                We’re putting together the soundtrack for our wedding, and we’d love your suggestions.
              </p>

              {closed ? (
                <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-700">
                  Guest song requests are closed for this event.
                </div>
              ) : (
                <div className="mt-7 space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Your Name
                    </span>
                    <input
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base outline-none ring-[#2f4a3e]/25 transition focus:border-[#2f4a3e]/50 focus:ring-4"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Song Title
                    </span>
                    <input
                      value={songTitle}
                      onChange={(event) => setSongTitle(event.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base outline-none ring-[#2f4a3e]/25 transition focus:border-[#2f4a3e]/50 focus:ring-4"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Artist
                    </span>
                    <input
                      value={artist}
                      onChange={(event) => setArtist(event.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base outline-none ring-[#2f4a3e]/25 transition focus:border-[#2f4a3e]/50 focus:ring-4"
                    />
                  </label>
                  {submitState.status === "error" ? (
                    <p className="text-sm font-semibold text-rose-700">{submitState.message}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={submitRequest}
                    disabled={submitState.status === "submitting"}
                    className="min-h-12 w-full rounded-xl bg-[#2f4a3e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3a5a4c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitState.status === "submitting" ? "Sending..." : "Submit Request"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
