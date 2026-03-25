"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { apiJson } from "@/lib/client-api";
import type { SessionUser } from "@/components/AppHeader";

type OrderRow = {
  _id: string;
  quantityRequested: number;
  status: string;
  buyerMessage?: string;
  product: {
    _id: string;
    name: string;
    location: string;
    imageUrl?: string;
  } | null;
  buyer: { name?: string; email?: string } | null;
};

export default function FarmerIncomingOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<{ orders: OrderRow[] }>("/api/orders/incoming");
      setOrders(data.orders);
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
        await load();
      } catch {
        router.replace("/login");
      }
    })();
  }, [router, load]);

  const q = searchQ.trim().toLowerCase();
  const filteredOrders =
    q.length === 0
      ? orders
      : orders.filter((o) => {
          const name = o.product?.name?.toLowerCase() ?? "";
          const buyer =
            (o.buyer?.name ?? o.buyer?.email ?? "").toLowerCase();
          const st = o.status.toLowerCase();
          const msg = (o.buyerMessage ?? "").toLowerCase();
          return (
            name.includes(q) || buyer.includes(q) || st.includes(q) || msg.includes(q)
          );
        });

  if (user === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-stone-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <p>
        <Link href="/dashboard/farmer" className="text-sm text-emerald-700 hover:underline">
          ← Back to listings
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold text-emerald-950">
        Incoming purchase requests
      </h1>
      <p className="text-stone-600">Buyers who requested your listed products.</p>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 max-w-md">
        <input
          type="search"
          placeholder="Search by product, buyer, status…"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      <ul className="mt-6 space-y-3">
        {filteredOrders.length === 0 && !error && orders.length > 0 && (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
            No requests match your search.
          </li>
        )}
        {filteredOrders.length === 0 && !error && orders.length === 0 && (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
            No incoming requests yet.
          </li>
        )}
        {filteredOrders.map((o) => (
          <li
            key={o._id}
            className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <ProductImage
              src={o.product?.imageUrl}
              alt={o.product?.name ?? "Product"}
              size={72}
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-emerald-950">
                {o.product?.name ?? "Product"} · qty {o.quantityRequested}
              </p>
              <p className="text-sm text-stone-600">
                From: {o.buyer?.name ?? o.buyer?.email ?? "Buyer"} · Status:{" "}
                <span className="font-medium">{o.status}</span>
              </p>
              {o.buyerMessage ? (
                <p className="mt-1 text-sm text-stone-500">“{o.buyerMessage}”</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
