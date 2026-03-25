"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { apiJson } from "@/lib/client-api";
import type { SessionUser } from "@/components/AppHeader";

type FarmerRef = { _id: string; name: string; location?: string; email?: string };

type ProductRow = {
  _id: string;
  name: string;
  productType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  imageUrl?: string;
  farmer: FarmerRef | null;
};

export default function MarketplacePage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [productType, setProductType] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [requestFor, setRequestFor] = useState<ProductRow | null>(null);
  const [qty, setQty] = useState("10");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (productType.trim()) params.set("productType", productType.trim());
      if (location.trim()) params.set("location", location.trim());
      if (searchQ.trim()) params.set("q", searchQ.trim());
      const q = params.toString();
      const data = await apiJson<{ products: ProductRow[] }>(
        `/api/products${q ? `?${q}` : ""}`
      );
      setProducts(data.products);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [productType, location, searchQ]);

  /** Load all products once; use Apply to filter. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ products: ProductRow[] }>("/api/products");
        if (!cancelled) {
          setProducts(data.products);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ user: SessionUser | null }>("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitRequest() {
    if (!requestFor || !user || user.role !== "buyer") return;
    setSubmitting(true);
    setError(null);
    try {
      await apiJson("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: requestFor._id,
          quantityRequested: Number(qty),
          buyerMessage: message,
        }),
      });
      setRequestFor(null);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-emerald-950">Marketplace</h1>
      <p className="mt-1 text-stone-600">
        Browse listings from farmers. Buyers can send a purchase request.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-stone-200 bg-white p-4 text-stone-900 shadow-sm">
        <input
          type="search"
          placeholder="Search name, type, or location"
          className="min-w-[200px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
        <input
          placeholder="Filter by product type (e.g. tomato)"
          className="min-w-[200px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
        />
        <input
          placeholder="Filter by location"
          className="min-w-[200px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white hover:bg-emerald-700"
        >
          Apply
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {products.length === 0 && !error && (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
            No listings yet.{" "}
            <Link href="/dashboard/farmer" className="font-medium text-emerald-700">
              Farmers can add products here
            </Link>
            .
          </li>
        )}
        {products.map((p) => (
          <li
            key={p._id}
            className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 gap-3 sm:items-center">
              <ProductImage src={p.imageUrl} alt={p.name} size={96} />
              <div className="min-w-0">
                <p className="font-semibold text-emerald-950">{p.name}</p>
                <p className="text-sm text-stone-600">
                  {p.quantity} {p.unit} · {p.pricePerUnit} RWF / {p.unit} ·{" "}
                  {p.location}
                </p>
                <p className="text-xs text-stone-500">
                  Farmer: {p.farmer?.name ?? "—"} · Type: {p.productType}
                </p>
              </div>
            </div>
            {user?.role === "buyer" ? (
              <button
                type="button"
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-amber-300"
                onClick={() => setRequestFor(p)}
              >
                Request to buy
              </button>
            ) : user === undefined ? null : user?.role === "farmer" ? (
              <span className="text-sm text-stone-500">Buyer view only</span>
            ) : (
              <Link href="/login" className="text-sm font-medium text-emerald-700">
                Log in as buyer to request
              </Link>
            )}
          </li>
        ))}
      </ul>

      {requestFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-stone-900 shadow-xl">
            <h2 className="text-lg font-semibold">Purchase request</h2>
            <div className="mt-3 flex items-center gap-3">
              <ProductImage src={requestFor.imageUrl} alt={requestFor.name} size={72} />
              <p className="text-sm text-stone-600">{requestFor.name}</p>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-medium">Quantity</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-medium">Message (optional)</span>
              <textarea
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg bg-stone-200 px-4 py-2"
                onClick={() => setRequestFor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-60"
                onClick={() => void submitRequest()}
              >
                {submitting ? "Sending…" : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
