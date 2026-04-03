import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/types/database";

type Props = { listing: Listing };

export function ListingCard({ listing }: Props) {
  const img =
    listing.images?.[0] ??
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-background transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-105"
          unoptimized={img.includes("unsplash.com")}
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-1 font-medium text-foreground">
            {listing.title}
          </h2>
          <span className="shrink-0 text-sm font-semibold">
            ${Number(listing.price).toFixed(0)}
            <span className="font-normal text-muted"> / night</span>
          </span>
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted">
          {listing.location}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
          {listing.description}
        </p>
        <p className="mt-2 text-xs text-muted">
          Up to {listing.max_guests} guests
        </p>
      </div>
    </Link>
  );
}
