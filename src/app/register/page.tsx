"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guest" | "host">("guest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          role,
        },
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo(
      "Check your email to confirm your account, then log in. If email confirmation is disabled in Supabase, you can log in now.",
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-10 max-w-md space-y-4 rounded-2xl border border-border p-8 shadow-sm"
    >
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <label className="block text-sm font-medium">
        Full name
        <input
          type="text"
          required
          autoComplete="name"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
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
          minLength={6}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">I want to</legend>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              checked={role === "guest"}
              onChange={() => setRole("guest")}
            />
            Book stays
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              checked={role === "host"}
              onChange={() => setRole("host")}
            />
            Host a place
          </label>
        </div>
      </fieldset>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {info && (
        <p className="text-sm text-green-800" role="status">
          {info}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent">
          Log in
        </Link>
      </p>
    </form>
  );
}
