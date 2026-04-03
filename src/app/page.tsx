import { headers } from "next/headers";
import { Suspense } from "react";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import type { Listing } from "@/types/database";

async function fetchListings(searchParams: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  if (searchParams.q) sp.set("q", searchParams.q);
  if (searchParams.checkIn) sp.set("checkIn", searchParams.checkIn);
  if (searchParams.checkOut) sp.set("checkOut", searchParams.checkOut);
  if (searchParams.guests) sp.set("guests", searchParams.guests);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/listings?${sp.toString()}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return { listings: [] as Listing[], error: "Could not load listings." };
  }

  const data = await res.json();
  return {
    listings: (data.listings ?? []) as Listing[],
    error: null as string | null,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { listings, error } = await fetchListings(params);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Find your next stay
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Browse places with photos, clear pricing, and flexible dates — pay in
          cash when you arrive.
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-14 animate-pulse rounded-full bg-surface" />
            }
          >
            <SearchBar />
          </Suspense>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {listings.length === 0 && !error ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center text-muted">
          No listings match your filters yet. Try different dates or a broader
          search.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
