"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { apiForm, apiJson } from "@/lib/client-api";
import type { SessionUser } from "@/components/AppHeader";

type ProductRow = {
  _id: string;
  name: string;
  productType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  imageUrl?: string;
};

type PoolProductRow = ProductRow & {
  farmer: { _id: string; name: string };
};

type PendingPool = {
  _id: string;
  title: string;
  productType: string;
  totalQuantity: number;
  unit: string;
  entries: Array<{
    quantity: number;
    farmer: { name?: string } | null;
    product: { name?: string; location?: string; quantity?: number } | null;
  }>;
  createdBy?: { name?: string } | null;
};

export default function FarmerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [listSearchQ, setListSearchQ] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [productType, setProductType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [poolProducts, setPoolProducts] = useState<PoolProductRow[]>([]);
  const [bulkPoolProductType, setBulkPoolProductType] = useState("");
  const [bulkPoolQ, setBulkPoolQ] = useState("");
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<string>>(new Set());
  const [poolListLoading, setPoolListLoading] = useState(false);
  const [poolListError, setPoolListError] = useState<string | null>(null);
  const [poolSubmitting, setPoolSubmitting] = useState(false);

  const [pendingPools, setPendingPools] = useState<PendingPool[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (listSearchQ.trim()) params.set("q", listSearchQ.trim());
      const qs = params.toString();
      const data = await apiJson<{ products: ProductRow[] }>(
        `/api/products/mine${qs ? `?${qs}` : ""}`
      );
      setProducts(data.products);
      setListingsError(null);
    } catch (e) {
      setListingsError(e instanceof Error ? e.message : "Failed to load listings");
    }
  }, [listSearchQ]);

  const loadPendingPools = useCallback(async () => {
    setPendingLoading(true);
    try {
      const data = await apiJson<{ pools: PendingPool[] }>("/api/bulk-pools/pending");
      setPendingPools(data.pools);
    } catch {
      setPendingPools([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const loadPoolPickList = useCallback(async () => {
    setPoolListLoading(true);
    setPoolListError(null);
    try {
      const params = new URLSearchParams();
      if (bulkPoolProductType.trim()) {
        params.set("productType", bulkPoolProductType.trim());
      }
      if (bulkPoolQ.trim()) params.set("q", bulkPoolQ.trim());
      const qs = params.toString();
      const data = await apiJson<{ products: PoolProductRow[] }>(
        `/api/products/for-bulk-pool${qs ? `?${qs}` : ""}`
      );
      setPoolProducts(data.products);
    } catch (e) {
      setPoolProducts([]);
      setPoolListError(
        e instanceof Error ? e.message : "Could not load listings for your cell."
      );
    } finally {
      setPoolListLoading(false);
    }
  }, [bulkPoolProductType, bulkPoolQ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiJson<{ user: SessionUser | null }>("/api/auth/me");
        if (!data.user) {
          router.replace("/login");
          return;
        }
        if (data.user.role !== "farmer") {
          router.replace("/dashboard/buyer");
          return;
        }
        if (cancelled) return;
        setUser(data.user);

        try {
          const mine = await apiJson<{ products: ProductRow[] }>("/api/products/mine");
          if (!cancelled) setProducts(mine.products);
        } catch {
          if (!cancelled) setProducts([]);
        }

        try {
          const pend = await apiJson<{ pools: PendingPool[] }>("/api/bulk-pools/pending");
          if (!cancelled) setPendingPools(pend.pools);
        } catch {
          if (!cancelled) setPendingPools([]);
        }

        setPoolListLoading(true);
        setPoolListError(null);
        try {
          const poolData = await apiJson<{ products: PoolProductRow[] }>(
            "/api/products/for-bulk-pool"
          );
          if (!cancelled) setPoolProducts(poolData.products);
        } catch (e) {
          if (!cancelled) {
            setPoolProducts([]);
            setPoolListError(
              e instanceof Error ? e.message : "Could not load listings for your cell."
            );
          }
        } finally {
          if (!cancelled) setPoolListLoading(false);
        }
      } catch {
        router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function togglePoolProduct(id: string) {
    setSelectedPoolIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitBulkPool() {
    const productIds = [...selectedPoolIds];
    setBulkActionError(null);
    setPoolSubmitting(true);
    try {
      await apiJson("/api/bulk-pools", {
        method: "POST",
        body: JSON.stringify({ productIds }),
      });
      setSelectedPoolIds(new Set());
      await loadPendingPools();
      await loadPoolPickList();
    } catch (e) {
      setBulkActionError(
        e instanceof Error ? e.message : "Could not create bulk pool"
      );
    } finally {
      setPoolSubmitting(false);
    }
  }

  async function approvePool(id: string) {
    setBulkActionError(null);
    try {
      await apiJson(`/api/bulk-pools/${id}/approve`, { method: "POST" });
      await loadPendingPools();
      await loadPoolPickList();
    } catch (e) {
      setBulkActionError(e instanceof Error ? e.message : "Could not approve");
    }
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("productType", productType);
      fd.append("quantity", String(Number(quantity)));
      fd.append("unit", unit);
      fd.append("pricePerUnit", String(Number(pricePerUnit)));
      fd.append("location", location);
      if (imageFile) {
        fd.append("image", imageFile);
      }
      await apiForm("/api/products", fd);
      setName("");
      setProductType("");
      setQuantity("");
      setPricePerUnit("");
      setLocation("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadProducts();
      await loadPoolPickList();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add product");
    } finally {
      setLoading(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-stone-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-emerald-950">Farmer dashboard</h1>
      <p className="text-stone-600">Welcome, {user?.name}. Add listings and track them.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={addProduct}
          className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 text-stone-900 shadow-sm"
        >
          <h2 className="font-semibold text-emerald-900">Add product</h2>
          <input
            required
            placeholder="Product name (e.g. Fresh tomatoes)"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            placeholder="Product type for search (e.g. tomatoes)"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              required
              type="number"
              min={0}
              placeholder="Quantity"
              className="w-1/2 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <input
              required
              placeholder="Unit (kg, L, bunch)"
              className="w-1/2 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <input
            required
            type="number"
            min={0}
            placeholder="Price per unit (RWF)"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
          />
          <input
            required
            placeholder="Location (pickup / area)"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div>
            <span className="text-sm font-medium text-stone-700">Photo (optional)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="mt-1 block w-full text-sm text-stone-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-900 hover:file:bg-emerald-200"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-stone-500">
              JPG, PNG, WebP, or GIF — max 2MB.
            </p>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-800 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Saving…" : "Publish listing"}
          </button>
        </form>

        <div>
          <h2 className="font-semibold text-emerald-900">Your listings</h2>
          {listingsError && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {listingsError}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="search"
              placeholder="Search your listings"
              className="min-w-[160px] flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500"
              value={listSearchQ}
              onChange={(e) => setListSearchQ(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="rounded-md bg-stone-200 px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-300"
            >
              Search
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {products.length === 0 && (
              <li className="text-sm text-stone-500">No products yet.</li>
            )}
            {products.map((p) => (
              <li
                key={p._id}
                className="flex gap-3 rounded-lg border border-stone-200 bg-white p-3 text-sm shadow-sm"
              >
                <ProductImage src={p.imageUrl} alt={p.name} size={72} />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-stone-900">{p.name}</span> —{" "}
                  {p.quantity} {p.unit} @ {p.pricePerUnit} RWF / {p.unit} ·{" "}
                  {p.location}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/marketplace" className="text-emerald-700 hover:underline">
              View public marketplace
            </Link>
            {" · "}
            <Link href="/dashboard/farmer/orders" className="text-emerald-700 hover:underline">
              Incoming buyer requests
            </Link>
          </p>
        </div>
      </div>

      <section className="mt-12 space-y-6 rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-900">Bulk sales — combine with neighbours</h2>
        <p className="text-sm text-stone-600">
          Select at least two listings from at least two farmers in your cell (same
          district · sector · cell). Other farmers must approve before the pool is
          visible to buyers on Bulk sales.
        </p>

        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search listings in your cell"
            className="min-w-[180px] flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
            value={bulkPoolQ}
            onChange={(e) => setBulkPoolQ(e.target.value)}
          />
          <input
            placeholder="Filter by product type"
            className="min-w-[140px] rounded-md border border-stone-300 px-3 py-2 text-sm"
            value={bulkPoolProductType}
            onChange={(e) => setBulkPoolProductType(e.target.value)}
          />
          <button
            type="button"
            disabled={poolListLoading}
            onClick={() => void loadPoolPickList()}
            className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {poolListLoading ? "Loading…" : "Load listings"}
          </button>
        </div>
        {poolListError && (
          <p className="text-sm text-amber-800" role="alert">
            {poolListError}
          </p>
        )}

        <ul className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-stone-200 p-2">
          {poolProducts.length === 0 && !poolListLoading && !poolListError && (
            <li className="p-4 text-center text-sm text-stone-500">
              No listings in your cell yet, or none match the filters.
            </li>
          )}
          {poolProducts.map((p) => (
            <li
              key={p._id}
              className="flex items-start gap-3 rounded-md border border-transparent p-2 hover:border-stone-200"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={selectedPoolIds.has(p._id)}
                onChange={() => togglePoolProduct(p._id)}
              />
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{p.name}</span> — {p.quantity}{" "}
                {p.unit} · {p.farmer.name}
                <span className="text-stone-500"> · {p.location}</span>
              </div>
            </li>
          ))}
        </ul>

        {bulkActionError && (
          <p className="text-sm text-red-600" role="alert">
            {bulkActionError}
          </p>
        )}
        <button
          type="button"
          disabled={poolSubmitting || selectedPoolIds.size < 2}
          onClick={() => void submitBulkPool()}
          className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {poolSubmitting ? "Submitting…" : "Propose bulk pool"}
        </button>
      </section>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-900">Bulk pools waiting for your approval</h2>
        {pendingLoading ? (
          <p className="mt-2 text-sm text-stone-500">Loading…</p>
        ) : pendingPools.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">None pending.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {pendingPools.map((pool) => (
              <li key={pool._id} className="rounded-lg border border-stone-200 p-4">
                <p className="font-medium">{pool.title}</p>
                <p className="text-sm text-stone-600">
                  {pool.totalQuantity} {pool.unit} · proposed by{" "}
                  {pool.createdBy?.name ?? "—"}
                </p>
                <ul className="mt-2 list-inside list-disc text-sm text-stone-700">
                  {pool.entries.map((e, i) => (
                    <li key={i}>
                      {e.product?.name} — {e.quantity} {pool.unit}
                      {e.farmer?.name ? ` (${e.farmer.name})` : ""}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => void approvePool(pool._id)}
                  className="mt-3 rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-emerald-950 hover:bg-amber-300"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
