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

export default function FarmerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [productType, setProductType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    try {
      const data = await apiJson<{ products: ProductRow[] }>("/api/products/mine");
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
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
        setUser(data.user);
        await loadProducts();
      } catch {
        router.replace("/login");
      }
    })();
  }, [router, loadProducts]);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add product");
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
              JPG, PNG, WebP, or GIF — max 2MB. If you skip this, a default image is
              shown.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
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
    </div>
  );
}
