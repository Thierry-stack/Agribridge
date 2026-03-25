import { NextResponse } from "next/server";
import { MOCK_MARKET_PRICES } from "@/lib/market-prices-data";

/**
 * GET /api/market-prices
 * Returns configured reference rows from `lib/market-prices-data.ts` (empty by default).
 */
export async function GET() {
  return NextResponse.json({ prices: MOCK_MARKET_PRICES });
}
