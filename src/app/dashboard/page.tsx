import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-muted">
        Hello{profile?.name ? `, ${profile.name}` : ""}. Manage trips and
        listings here.
      </p>
      <DashboardClient initialRole={profile?.role ?? "guest"} />
    </div>
  );
}
