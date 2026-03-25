"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/client-api";

type Row = {
  product: string;
  unit: string;
  priceRwf: number;
  region: string;
  updated: string;
};

export default function PricesPage() {
  const [prices, setPrices] = useState<Row[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiJson<{ prices: Row[] }>("/api/market-prices");
        setPrices(data.prices);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, []);

  const q = searchQ.trim().toLowerCase();
  const filtered =
    q.length === 0
      ? prices
      : prices.filter(
          (p) =>
            p.product.toLowerCase().includes(q) ||
            p.region.toLowerCase().includes(q) ||
            p.unit.toLowerCase().includes(q)
        );

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-emerald-950">Market prices</h1>
      <p className="mt-1 text-stone-600">
        Reference prices you configure in the app. Add rows via the data source when
        you connect a live feed.
      </p>
      <div className="mt-4 max-w-md">
        <input
          type="search"
          placeholder="Search product, region, or unit"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white text-stone-900 shadow-sm">
        {/*
          Explicit text color: on OS dark mode, body uses a light foreground color.
          White card + inherited color = invisible text without selection.
        */}
        <table className="w-full text-left text-sm text-stone-900">
          <thead className="border-b border-stone-200 bg-stone-100 text-stone-950">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Unit</th>
              <th className="px-4 py-3 font-semibold">Price (RWF)</th>
              <th className="px-4 py-3 font-semibold">Region</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="bg-white text-stone-900">
            {filtered.length === 0 && !error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-stone-600"
                >
                  {prices.length === 0
                    ? "No price rows yet. Add data in your configuration when ready."
                    : "No rows match your search."}
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={`${p.product}-${p.region}`} className="border-b border-stone-100">
                <td className="px-4 py-3 text-stone-900">{p.product}</td>
                <td className="px-4 py-3 text-stone-900">{p.unit}</td>
                <td className="px-4 py-3 text-stone-900">{p.priceRwf.toLocaleString()}</td>
                <td className="px-4 py-3 text-stone-900">{p.region}</td>
                <td className="px-4 py-3 text-stone-600">{p.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
