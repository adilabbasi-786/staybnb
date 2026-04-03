import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: myListings } = await supabase
    .from("listings")
    .select("id")
    .eq("host_id", user.id);

  const ids = (myListings ?? []).map((l) => l.id);
  if (ids.length === 0) {
    return NextResponse.json({ bookings: [] });
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*, listing:listings (*)")
    .in("listing_id", ids)
    .order("check_in", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const guestIds = [
    ...new Set((bookings ?? []).map((b) => b.user_id)),
  ];

  let guests: Record<string, { id: string; name: string; email: string }> = {};
  if (guestIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", guestIds);
    guests = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p]),
    );
  }

  const enriched = (bookings ?? []).map((b) => ({
    ...b,
    guest: guests[b.user_id] ?? null,
  }));

  return NextResponse.json({ bookings: enriched });
}
