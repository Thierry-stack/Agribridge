"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiJson } from "@/lib/client-api";
import { PasswordInput } from "@/components/PasswordInput";
import type { SessionUser } from "@/components/AppHeader";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer">("farmer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Farmers: full Rwanda admin hierarchy (avoids duplicate cell/village names). */
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");
  /** Buyers: simple area line (optional). */
  const [buyerArea, setBuyerArea] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload =
        role === "farmer"
          ? {
              email,
              password,
              name,
              role,
              district,
              sector,
              cell,
              village,
            }
          : {
              email,
              password,
              name,
              role,
              location: buyerArea,
            };
      const data = await apiJson<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
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
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-12">
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
        <label className="block" htmlFor="register-password">
          <span className="text-sm font-medium text-stone-700">Password</span>
          <PasswordInput
            id="register-password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="mt-1 block text-xs text-stone-500">
            At least 6 characters
          </span>
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

        {role === "farmer" ? (
          <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-sm font-medium text-emerald-900">
              Your location (required)
            </p>
            <p className="text-xs text-stone-600">
              We use district, sector, and cell together so names are not confused
              across Rwanda. Alerts go to farmers in the same <strong>cell</strong>.
            </p>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">
                District (Akarere)
              </span>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
                placeholder="e.g. Nyabihu"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">
                Sector (Umurenge)
              </span>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
                placeholder="e.g. Muko"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">
                Cell (Akagari)
              </span>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
                value={cell}
                onChange={(e) => setCell(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">
                Village (Umudugu)
              </span>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Area / notes (optional)
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
              placeholder="e.g. Kigali — where you usually buy"
              value={buyerArea}
              onChange={(e) => setBuyerArea(e.target.value)}
            />
          </label>
        )}

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
