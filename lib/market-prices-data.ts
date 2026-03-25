/**
 * Sample “market prices” for Rwanda — static MVP data (replace with a real feed later).
 * Prices are illustrative only (RWF per common unit).
 */
export type MarketPriceRow = {
  product: string;
  unit: string;
  priceRwf: number;
  region: string;
  updated: string;
};

export const MOCK_MARKET_PRICES: MarketPriceRow[] = [
  {
    product: "Tomatoes",
    unit: "kg",
    priceRwf: 450,
    region: "Kigali",
    updated: "2025-03-01",
  },
  {
    product: "Irish potatoes",
    unit: "kg",
    priceRwf: 380,
    region: "Southern Province",
    updated: "2025-03-01",
  },
  {
    product: "Fresh milk",
    unit: "liter",
    priceRwf: 600,
    region: "Eastern Province",
    updated: "2025-03-01",
  },
  {
    product: "Maize",
    unit: "kg",
    priceRwf: 520,
    region: "Western Province",
    updated: "2025-03-01",
  },
  {
    product: "Bananas (matoke)",
    unit: "bunch",
    priceRwf: 1500,
    region: "Northern Province",
    updated: "2025-03-01",
  },
];
