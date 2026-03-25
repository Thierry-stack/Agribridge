/**
 * Market prices table — start empty; add rows via your admin or API later.
 */
export type MarketPriceRow = {
  product: string;
  unit: string;
  priceRwf: number;
  region: string;
  updated: string;
};

export const MOCK_MARKET_PRICES: MarketPriceRow[] = [];
