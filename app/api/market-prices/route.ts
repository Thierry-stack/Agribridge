import { NextResponse } from "next/server";
import { MOCK_MARKET_PRICES } from "@/lib/market-prices-data";

/**
 * GET /api/market-prices
 * Returns static sample prices (MVP). Swap this for a live feed later.
 */
export async function GET() {
  return NextResponse.json({ prices: MOCK_MARKET_PRICES });
}
