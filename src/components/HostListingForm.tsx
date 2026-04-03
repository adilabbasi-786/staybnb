"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HostListingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [maxGuests, setMaxGuests] = useState("4");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }
      urls.push(data.url);
    }
    return urls;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const images = files.length ? await uploadImages() : [];
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          price: Number(price),
          max_guests: Number(maxGuests),
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create listing.");
        return;
      }
      router.push(`/listings/${data.listing.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <label className="block text-sm font-medium">
        Title
        <input
          required
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cozy loft near downtown"
        />
      </label>
      <label className="block text-sm font-medium">
        Description
        <textarea
          required
          rows={5}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Location
        <input
          required
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, region"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Price per night (USD)
          <input
            required
            type="number"
            min={0}
            step="0.01"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Max guests
          <input
            required
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium">Photos</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="mt-2 w-full text-sm"
          onChange={(e) =>
            setFiles(e.target.files ? Array.from(e.target.files) : [])
          }
        />
        <p className="mt-1 text-xs text-muted">
          JPEG, PNG, WebP, or GIF. Up to 5MB each. Stored in Supabase Storage.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Publishing…" : "Publish listing"}
      </button>
    </form>
  );
}
