"use client";

import { useCallback, useEffect, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { apiJson } from "@/lib/client-api";

type Group = {
  productType: string;
  location: string;
  displayName: string;
  totalQuantity: number;
  unit: string;
  farmerCount: number;
  imageUrl?: string;
};

export default function BulkPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [productType, setProductType] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadAggregations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (productType.trim()) params.set("productType", productType.trim());
      if (location.trim()) params.set("location", location.trim());
      const q = params.toString();
      const data = await apiJson<{ groups: Group[] }>(
        `/api/aggregations${q ? `?${q}` : ""}`
      );
      setGroups(data.groups);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [productType, location]);

  /** First paint: load all groups (no filters). Filters apply when you click Apply. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ groups: Group[] }>("/api/aggregations");
        if (!cancelled) setGroups(data.groups);
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
      <h1 className="text-2xl font-bold text-emerald-950">Bulk by area</h1>
      <p className="mt-1 text-stone-600">
        Combined quantity for the same product type and location (case-insensitive
        grouping).
      </p>

      <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-stone-200 bg-white p-4 text-stone-900 shadow-sm">
        <input
          placeholder="Filter product type"
          className="min-w-[180px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
        />
        <input
          placeholder="Filter location"
          className="min-w-[180px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void loadAggregations()}
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

      <ul className="mt-6 space-y-2">
        {groups.length === 0 && !error && (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
            No aggregated data yet — add overlapping listings as farmers.
          </li>
        )}
        {groups.map((g) => (
          <li
            key={`${g.productType}-${g.location}`}
            className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <ProductImage src={g.imageUrl} alt={g.displayName} size={80} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-emerald-950">{g.displayName}</p>
              <p className="text-sm text-stone-600">
                {g.location} · {g.totalQuantity} {g.unit} total · {g.farmerCount}{" "}
                farmer(s)
              </p>
              <p className="text-xs text-stone-500">Type key: {g.productType}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
