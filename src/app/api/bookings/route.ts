import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rangesOverlap,
  parseLocalDate,
  validateBookingDates,
} from "@/lib/booking-validation";

const PAYMENT_NOTE =
  "Payment will be collected in cash upon arrival. No online payment is required.";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      listing:listings (*)
    `,
    )
    .eq("user_id", user.id)
    .order("check_in", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: bookings ?? [] });
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
  const { listing_id, check_in, check_out } = body as {
    listing_id?: string;
    check_in?: string;
    check_out?: string;
  };

  if (!listing_id || !check_in || !check_out) {
    return NextResponse.json(
      { error: "listing_id, check_in, and check_out are required." },
      { status: 400 },
    );
  }

  const dateCheck = validateBookingDates(check_in, check_out);
  if (!dateCheck.ok) {
    return NextResponse.json({ error: dateCheck.error }, { status: 400 });
  }

  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, host_id")
    .eq("id", listing_id)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 },
    );
  }

  if (listing.host_id === user.id) {
    return NextResponse.json(
      { error: "You cannot book your own listing." },
      { status: 400 },
    );
  }

  const { data: existing, error: exErr } = await supabase
    .from("bookings")
    .select("check_in, check_out, status")
    .eq("listing_id", listing_id)
    .in("status", ["pending", "confirmed"]);

  if (exErr) {
    return NextResponse.json({ error: exErr.message }, { status: 500 });
  }

  const newStart = parseLocalDate(check_in);
  const newEnd = parseLocalDate(check_out);

  for (const b of existing ?? []) {
    if (b.status === "cancelled") continue;
    const bStart = parseLocalDate(b.check_in);
    const bEnd = parseLocalDate(b.check_out);
    if (rangesOverlap(newStart, newEnd, bStart, bEnd)) {
      return NextResponse.json(
        {
          error:
            "Those dates overlap with an existing booking. Please choose different dates.",
        },
        { status: 409 },
      );
    }
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      listing_id,
      user_id: user.id,
      check_in,
      check_out,
      status: "confirmed",
      payment_note: PAYMENT_NOTE,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ booking });
}
