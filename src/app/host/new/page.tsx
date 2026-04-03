import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HostListingForm } from "@/components/HostListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/host/new");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "host") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Switch to host mode</h1>
        <p className="mt-2 text-muted">
          To publish a listing, set your account to Host on the dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">Create a listing</h1>
      <p className="mt-1 text-muted">
        Add photos, set your nightly rate, and tell guests what makes your
        place special.
      </p>
      <HostListingForm />
    </div>
  );
}
