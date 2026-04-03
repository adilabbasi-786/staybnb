import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 },
    );
  }

  const { data: host } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", listing.host_id)
    .single();

  return NextResponse.json({ listing, host });
}
