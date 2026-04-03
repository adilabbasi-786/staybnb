"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { UserRole } from "@/types/database";

type GuestBooking = {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_note: string;
  listing: {
    id: string;
    title: string;
    location: string;
    images: string[];
  } | null;
};

type HostBooking = {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_note: string;
  guest: { id: string; name: string; email: string } | null;
  listing: { id: string; title: string } | null;
};

type ListingRow = {
  id: string;
  title: string;
  location: string;
  price: number;
  images: string[];
};

export function DashboardClient({
  initialRole,
}: {
  initialRole: UserRole;
}) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [savingRole, setSavingRole] = useState(false);
  const [guestBookings, setGuestBookings] = useState<GuestBooking[]>([]);
  const [hostBookings, setHostBookings] = useState<HostBooking[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gb, hb, ml] = await Promise.all([
        fetch("/api/bookings").then((r) => r.json()),
        fetch("/api/host/bookings").then((r) => r.json()),
        fetch("/api/me/listings").then((r) => r.json()),
      ]);
      if (gb.error) setError(gb.error);
      setGuestBookings(gb.bookings ?? []);
      setHostBookings(hb.bookings ?? []);
      setListings(ml.listings ?? []);
    } catch {
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function switchRole(next: UserRole) {
    setSavingRole(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update role.");
        return;
      }
      setRole(next);
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <div className="mt-10 space-y-12">
      <section className="rounded-2xl border border-border bg-surface/40 p-6">
        <h2 className="text-lg font-semibold">Account mode</h2>
        <p className="mt-1 text-sm text-muted">
          Switch between guest trips and hosting tools. You can always change
          this later.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={savingRole || role === "guest"}
            onClick={() => switchRole("guest")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              role === "guest"
                ? "bg-foreground text-background"
                : "border border-border bg-background hover:bg-surface"
            }`}
          >
            Guest
          </button>
          <button
            type="button"
            disabled={savingRole || role === "host"}
            onClick={() => switchRole("host")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              role === "host"
                ? "bg-foreground text-background"
                : "border border-border bg-background hover:bg-surface"
            }`}
          >
            Host
          </button>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
      ) : (
        <>
          <section>
            <h2 className="text-xl font-semibold">Your trips</h2>
            <p className="mt-1 text-sm text-muted">
              Cash-on-arrival is noted on each reservation.
            </p>
            {guestBookings.length === 0 ? (
              <p className="mt-4 text-muted">
                No trips yet.{" "}
                <Link href="/" className="text-accent">
                  Browse listings
                </Link>
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {guestBookings.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-2xl border border-border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {b.listing?.title ?? "Listing"}
                        </p>
                        <p className="text-sm text-muted">
                          {b.listing?.location}
                        </p>
                        <p className="mt-2 text-sm">
                          {b.check_in} → {b.check_out}{" "}
                          <span className="text-muted">· {b.status}</span>
                        </p>
                      </div>
                      <Link
                        href={`/listings/${b.listing?.id}`}
                        className="text-sm font-medium text-accent"
                      >
                        View listing
                      </Link>
                    </div>
                    <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-foreground/90">
                      {b.payment_note}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {role === "host" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Your listings</h2>
                <Link
                  href="/host/new"
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
                >
                  Add listing
                </Link>
              </div>
              {listings.length === 0 ? (
                <p className="mt-4 text-muted">
                  You have not published a home yet.
                </p>
              ) : (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {listings.map((l) => (
                    <li
                      key={l.id}
                      className="rounded-2xl border border-border p-4"
                    >
                      <p className="font-medium">{l.title}</p>
                      <p className="text-sm text-muted">{l.location}</p>
                      <p className="mt-2 text-sm">
                        ${Number(l.price).toFixed(0)} / night
                      </p>
                      <Link
                        href={`/listings/${l.id}`}
                        className="mt-3 inline-block text-sm text-accent"
                      >
                        View public page
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {role === "host" && (
            <section>
              <h2 className="text-xl font-semibold">Bookings on your homes</h2>
              {hostBookings.length === 0 ? (
                <p className="mt-4 text-muted">No guest bookings yet.</p>
              ) : (
                <ul className="mt-6 space-y-4">
                  {hostBookings.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-2xl border border-border p-4"
                    >
                      <p className="font-medium">{b.listing?.title}</p>
                      <p className="text-sm text-muted">
                        Guest: {b.guest?.name || "Guest"} (
                        {b.guest?.email})
                      </p>
                      <p className="mt-2 text-sm">
                        {b.check_in} → {b.check_out}{" "}
                        <span className="text-muted">· {b.status}</span>
                      </p>
                      <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs">
                        {b.payment_note}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
