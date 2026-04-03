"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [checkIn, setCheckIn] = useState(params.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(params.get("checkOut") ?? "");
  const [guests, setGuests] = useState(params.get("guests") ?? "1");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (checkIn) sp.set("checkIn", checkIn);
    if (checkOut) sp.set("checkOut", checkOut);
    if (guests && guests !== "1") sp.set("guests", guests);
    const qs = sp.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-full border border-border bg-background p-2 shadow-sm sm:flex-row sm:items-center"
    >
      <label className="flex min-w-0 flex-1 flex-col px-3 py-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Where
        </span>
        <input
          className="mt-0.5 min-w-0 border-0 bg-transparent text-sm outline-none placeholder:text-muted"
          placeholder="Search destinations"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <div className="hidden h-8 w-px bg-border sm:block" />
      <label className="flex flex-col px-3 py-1 sm:w-36">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Check in
        </span>
        <input
          type="date"
          className="mt-0.5 border-0 bg-transparent text-sm outline-none"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
      </label>
      <label className="flex flex-col px-3 py-1 sm:w-36">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Check out
        </span>
        <input
          type="date"
          className="mt-0.5 border-0 bg-transparent text-sm outline-none"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </label>
      <label className="flex flex-col px-3 py-1 sm:w-28">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Guests
        </span>
        <select
          className="mt-0.5 border-0 bg-transparent text-sm outline-none"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={String(n)}>
              {n} guest{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        Search
      </button>
    </form>
  );
}
