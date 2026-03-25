"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiJson } from "@/lib/client-api";
import type { SessionUser } from "@/components/AppHeader";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer">("farmer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiJson<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name, role, location }),
      });
      router.push(
        data.user.role === "farmer" ? "/dashboard/farmer" : "/dashboard/buyer"
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="text-2xl font-bold text-emerald-950">Create account</h1>
      <p className="mt-1 text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-700">
          Log in
        </Link>
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-sm"
      >
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Full name</span>
          <input
            type="text"
            required
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="text-xs text-stone-500">At least 6 characters</span>
        </label>
        <fieldset>
          <legend className="text-sm font-medium text-stone-700">I am a</legend>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-stone-900">
              <input
                type="radio"
                name="role"
                checked={role === "farmer"}
                onChange={() => setRole("farmer")}
                className="accent-emerald-800"
              />
              Farmer
            </label>
            <label className="flex items-center gap-2 text-stone-900">
              <input
                type="radio"
                name="role"
                checked={role === "buyer"}
                onChange={() => setRole("buyer")}
                className="accent-emerald-800"
              />
              Buyer
            </label>
          </div>
        </fieldset>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Location (district / area)
          </span>
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
            placeholder="e.g. Kigali, Gasabo"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
          className="w-full rounded-lg bg-emerald-800 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
