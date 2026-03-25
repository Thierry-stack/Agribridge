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
    pricePerUnit: number;
    unit: string;
    imageUrl?: string;
  } | null;
};

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<{ orders: OrderRow[] }>("/api/orders/mine");
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
        if (data.user.role !== "buyer") {
          router.replace("/dashboard/farmer");
          return;
        }
        setUser(data.user);
        await load();
      } catch {
        router.replace("/login");
      }
    })();
  }, [router, load]);

  if (user === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-stone-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-emerald-950">Buyer dashboard</h1>
      <p className="text-stone-600">
        Your purchase requests.{" "}
        <Link href="/marketplace" className="font-medium text-emerald-700">
          Browse marketplace
        </Link>
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {orders.length === 0 && !error && (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
            No requests yet. Find products on the marketplace.
          </li>
        )}
        {orders.map((o) => (
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
                Status: <span className="font-medium">{o.status}</span>
                {o.product && (
                  <>
                    {" "}
                    · {o.product.location} · {o.product.pricePerUnit} RWF /{" "}
                    {o.product.unit}
                  </>
                )}
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
