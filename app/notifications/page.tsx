"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/client-api";
import type { SessionUser } from "@/components/AppHeader";

type Row = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [items, setItems] = useState<Row[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<{
        notifications: Row[];
        unreadCount: number;
      }>("/api/notifications");
      setItems(data.notifications);
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
        setUser(data.user);
        await load();
      } catch {
        router.replace("/login");
      }
    })();
  }, [router, load]);

  async function markRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not update");
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  const q = searchQ.trim().toLowerCase();
  const filtered =
    q.length === 0
      ? items
      : items.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q) ||
            n.type.toLowerCase().includes(q)
        );

  if (user === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-stone-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p>
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← Home
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold text-emerald-950">Notifications</h1>
      <p className="mt-1 text-stone-600">
        Alerts when other farmers are in the same cell (district · sector · cell)
        so you can coordinate and sell together.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 max-w-md">
        <input
          type="search"
          placeholder="Search notifications"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      <ul className="mt-6 space-y-3">
        {filtered.length === 0 && !error && items.length > 0 && (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
            No notifications match your search.
          </li>
        )}
        {items.length === 0 && !error && (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-600">
            No notifications yet. When another farmer registers in your cell, you
            will see a message here.
          </li>
        )}
        {filtered.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border p-4 shadow-sm ${
              n.read
                ? "border-stone-200 bg-white"
                : "border-emerald-300 bg-emerald-50/80"
            }`}
          >
            <p className="font-semibold text-emerald-950">{n.title}</p>
            <p className="mt-1 text-sm text-stone-700">{n.body}</p>
            <p className="mt-2 text-xs text-stone-500">
              {new Date(n.createdAt).toLocaleString()}
            </p>
            {!n.read && (
              <button
                type="button"
                className="mt-3 text-sm font-medium text-emerald-800 hover:underline"
                onClick={() => void markRead(n.id)}
              >
                Mark as read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
