import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !listing) notFound();

  const { data: host } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", listing.host_id)
    .single();

  const images =
    listing.images?.length > 0
      ? listing.images
      : [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
        ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2 sm:gap-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[360px]">
          <Image
            src={images[0]}
            alt=""
            fill
            className="object-cover"
            priority
            unoptimized={images[0].includes("unsplash.com")}
          />
        </div>
        {images.slice(1, 5).map((src: string, i: number) => (
          <div
            key={src + i}
            className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl sm:block sm:aspect-auto sm:min-h-0"
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              unoptimized={src.includes("unsplash.com")}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-semibold">{listing.title}</h1>
          <p className="mt-2 text-muted">{listing.location}</p>
          <p className="mt-6 whitespace-pre-wrap text-foreground/90">
            {listing.description}
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-surface/60 p-6">
            <h2 className="font-semibold">Hosted by</h2>
            <p className="mt-1 text-sm text-muted">
              {host?.name || "Host"} · {host?.email}
            </p>
            <p className="mt-4 text-sm text-muted">
              This home welcomes up to {listing.max_guests} guests.
            </p>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">
              ${Number(listing.price).toFixed(0)}
            </span>
            <span className="text-muted">/ night</span>
          </div>
          <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-foreground/90">
            Pay in cash when you arrive — no card required to book.
          </p>
          <Link
            href={`/book/${listing.id}`}
            className="mt-6 block w-full rounded-xl bg-accent py-3 text-center font-semibold text-white hover:bg-accent-hover"
          >
            Reserve
          </Link>
        </aside>
      </div>
    </div>
  );
}
