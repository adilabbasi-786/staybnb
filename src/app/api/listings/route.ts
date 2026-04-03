import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const location = searchParams.get("location")?.trim() ?? "";
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests");

  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  const search = (q || location).replace(/[%_,]/g, " ").trim();
  if (search) {
    const pat = `%${search}%`;
    query = query.or(
      `title.ilike.${pat},location.ilike.${pat},description.ilike.${pat}`,
    );
  }

  if (guests) {
    const n = Number.parseInt(guests, 10);
    if (!Number.isNaN(n) && n > 0) {
      query = query.gte("max_guests", n);
    }
  }

  const { data: listings, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  let result = (listings ?? []) as Listing[];

  if (checkIn && checkOut) {
    const { data: bookings, error: bErr } = await supabase
      .from("bookings")
      .select("listing_id, check_in, check_out, status")
      .in("status", ["pending", "confirmed"]);

    if (bErr) {
      return NextResponse.json(
        { error: bErr.message },
        { status: 500 },
      );
    }

    const { parseLocalDate, rangesOverlap } = await import(
      "@/lib/booking-validation"
    );
    const wantStart = parseLocalDate(checkIn);
    const wantEnd = parseLocalDate(checkOut);

    const busyByListing = new Map<string, { start: Date; end: Date }[]>();
    for (const b of bookings ?? []) {
      if (b.status === "cancelled") continue;
      const list = busyByListing.get(b.listing_id) ?? [];
      list.push({
        start: parseLocalDate(b.check_in),
        end: parseLocalDate(b.check_out),
      });
      busyByListing.set(b.listing_id, list);
    }

    result = result.filter((listing) => {
      const busy = busyByListing.get(listing.id) ?? [];
      return !busy.some((range) =>
        rangesOverlap(wantStart, wantEnd, range.start, range.end),
      );
    });
  }

  return NextResponse.json({ listings: result });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    price,
    location,
    images,
    max_guests,
  } = body as {
    title?: string;
    description?: string;
    price?: number;
    location?: string;
    images?: string[];
    max_guests?: number;
  };

  if (!title?.trim() || !location?.trim()) {
    return NextResponse.json(
      { error: "Title and location are required." },
      { status: 400 },
    );
  }

  const priceNum = Number(price);
  if (Number.isNaN(priceNum) || priceNum < 0) {
    return NextResponse.json(
      { error: "Valid price is required." },
      { status: 400 },
    );
  }

  const guestsNum = max_guests != null ? Number(max_guests) : 2;
  if (Number.isNaN(guestsNum) || guestsNum < 1) {
    return NextResponse.json(
      { error: "Max guests must be at least 1." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      title: title.trim(),
      description: (description ?? "").trim(),
      price: priceNum,
      location: location.trim(),
      host_id: user.id,
      images: Array.isArray(images) ? images : [],
      max_guests: guestsNum,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ listing: data });
}
