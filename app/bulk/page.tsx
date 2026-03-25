"use client";

import { useCallback, useEffect, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { apiJson } from "@/lib/client-api";

type FarmerRef = { name?: string; district?: string; sector?: string; cell?: string };
type ProductRef = {
  name?: string;
  location?: string;
  pricePerUnit?: number;
  imageUrl?: string;
};

type BulkPoolRow = {
  _id: string;
  title: string;
  productType: string;
  totalQuantity: number;
  unit: string;
  locationKey: string;
  entries: Array<{
    quantity: number;
    farmer: FarmerRef | null;
    product: ProductRef | null;
  }>;
};

export default function BulkPage() {
  const [pools, setPools] = useState<BulkPoolRow[]>([]);
  const [productType, setProductType] = useState("");
  const [location, setLocation] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (productType.trim()) params.set("productType", productType.trim());
      if (location.trim()) params.set("location", location.trim());
      if (searchQ.trim()) params.set("q", searchQ.trim());
      const qs = params.toString();
      const data = await apiJson<{ pools: BulkPoolRow[] }>(
        `/api/bulk-pools${qs ? `?${qs}` : ""}`
      );
      setPools(data.pools);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [productType, location, searchQ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ pools: BulkPoolRow[] }>("/api/bulk-pools");
        if (!cancelled) {
          setPools(data.pools);
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

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-emerald-950">Bulk sales</h1>
      <p className="mt-1 text-stone-600">
        Pooled supply where farmers in the same cell agreed to combine specific
        listings so buyers and large suppliers can source one big lot.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-stone-200 bg-white p-4 text-stone-900 shadow-sm">
        <input
          type="search"
          placeholder="Search title, product type, or area key"
          className="min-w-[200px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
        <input
          placeholder="Filter product type"
          className="min-w-[160px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
        />
        <input
          placeholder="Filter location (cell key)"
          className="min-w-[160px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
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
        {pools.length === 0 && !error && (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
            No active bulk pools yet. Farmers in the same cell can propose a
            combined lot from the farmer dashboard; everyone involved must
            approve before it appears here.
          </li>
        )}
        {pools.map((pool) => (
          <li
            key={pool._id}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <ProductImage
                src={pool.entries[0]?.product?.imageUrl}
                alt={pool.title}
                size={80}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-950">{pool.title}</p>
                <p className="text-sm text-stone-600">
                  {pool.totalQuantity} {pool.unit} total · {pool.entries.length}{" "}
                  listing(s) · area: {pool.locationKey}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-stone-700">
                  {pool.entries.map((e, i) => (
                    <li key={i}>
                      {e.product?.name ?? "Product"} — {e.quantity}{" "}
                      {pool.unit}
                      {e.farmer?.name ? ` · ${e.farmer.name}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
