import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  return clearAuthCookie(res);
}
