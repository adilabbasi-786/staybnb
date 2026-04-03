"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-10 max-w-md space-y-4 rounded-2xl border border-border p-8 shadow-sm"
    >
      <h1 className="text-2xl font-semibold">Log in</h1>
      <label className="block text-sm font-medium">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Continue"}
      </button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-accent">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-10 max-w-md h-64 animate-pulse rounded-2xl bg-surface" />}>
      <LoginForm />
    </Suspense>
  );
}
