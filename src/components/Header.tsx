"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export function Header() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setProfile(null);
        return;
      }
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (!cancelled) setProfile(json.profile ?? null);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-lg font-semibold tracking-tight text-accent"
        >
          <span aria-hidden>⌂</span>
          Staybnb
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          <Link
            href="/"
            className="rounded-full px-3 py-2 text-foreground hover:bg-surface"
          >
            Explore
          </Link>
          {profile && (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-2 text-foreground hover:bg-surface"
              >
                Dashboard
              </Link>
              {profile.role === "host" && (
                <Link
                  href="/host/new"
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
                >
                  Host a home
                </Link>
              )}
            </>
          )}
          {profile === undefined ? (
            <span className="h-9 w-16 animate-pulse rounded-full bg-surface" />
          ) : profile ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-3 py-2 text-muted hover:bg-surface"
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-foreground hover:bg-surface"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-border px-4 py-2 font-medium hover:bg-surface"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
