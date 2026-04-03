"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { listingId: string; price: number };

export function BookListingForm({ listingId, price }: Props) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          check_in: checkIn,
          check_out: checkOut,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not complete booking.");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-surface/50 p-6">
        <h2 className="text-lg font-semibold">You&apos;re booked</h2>
        <p className="mt-2 text-sm text-muted">
          Payment will be collected in cash when you arrive. We&apos;ve saved
          this to your dashboard.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover"
        >
          View my trips
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="rounded-2xl border border-border p-4">
        <label className="block text-xs font-semibold uppercase tracking-wide">
          Check in
        </label>
        <input
          type="date"
          required
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide">
          Check out
        </label>
        <input
          type="date"
          required
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-4 text-sm text-foreground/90">
        <strong>Cash on arrival:</strong> no online payment is taken. Bring cash
        for your stay; the host will confirm the total when you check in.
      </div>

      {checkIn && checkOut && (
        <p className="text-sm text-muted">
          Estimated total:{" "}
          <span className="font-semibold text-foreground">
            $
            {(() => {
              const s = new Date(checkIn);
              const e = new Date(checkOut);
              const nights = Math.max(
                0,
                Math.round((e.getTime() - s.getTime()) / 86400000),
              );
              return (nights * price).toFixed(2);
            })()}{" "}
          </span>
          <span className="text-muted"> (before taxes & fees)</span>
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Confirming…" : "Confirm reservation"}
      </button>
    </form>
  );
}
