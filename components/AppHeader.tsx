"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/client-api";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "farmer" | "buyer";
  location: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
};

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [unread, setUnread] = useState(0);

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
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ unreadCount: number }>(
          "/api/notifications/count"
        );
        if (!cancelled) setUnread(data.unreadCount);
      } catch {
        if (!cancelled) setUnread(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-emerald-900/15 bg-emerald-950 text-emerald-50">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Agribridge
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link className="opacity-90 hover:opacity-100" href="/marketplace">
            Marketplace
          </Link>
          <Link className="opacity-90 hover:opacity-100" href="/bulk">
            Bulk sales
          </Link>
          <Link className="opacity-90 hover:opacity-100" href="/prices">
            Prices
          </Link>
          {user === undefined ? (
            <span className="text-emerald-300/80">…</span>
          ) : user ? (
            <>
              <Link
                href="/notifications"
                className="relative opacity-90 hover:opacity-100"
              >
                Alerts
                {unread > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-emerald-950">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              {user.role === "farmer" ? (
                <Link
                  className="rounded-md bg-emerald-700/80 px-2 py-1 font-medium hover:bg-emerald-600"
                  href="/dashboard/farmer"
                >
                  My listings
                </Link>
              ) : (
                <Link
                  className="rounded-md bg-emerald-700/80 px-2 py-1 font-medium hover:bg-emerald-600"
                  href="/dashboard/buyer"
                >
                  My requests
                </Link>
              )}
              <span className="hidden text-emerald-200/90 sm:inline">
                {user.name}
              </span>
              <button
                type="button"
                className="rounded-md border border-emerald-400/40 px-2 py-1 hover:bg-emerald-900/50"
                onClick={() => void logout()}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-amber-400 px-3 py-1.5 font-medium text-emerald-950 hover:bg-amber-300"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
