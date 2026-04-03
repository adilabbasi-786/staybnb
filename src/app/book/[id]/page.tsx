import { BookListingForm } from "@/components/BookListingForm";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function BookPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/book/${id}`);
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !listing) notFound();

  if (listing.host_id === user.id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted">You cannot book your own listing.</p>
        <a href={`/listings/${id}`} className="mt-4 inline-block text-accent">
          Back to listing
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">Confirm your trip</h1>
      <p className="mt-1 text-muted">{listing.title}</p>
      <BookListingForm listingId={listing.id} price={Number(listing.price)} />
    </div>
  );
}
