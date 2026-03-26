export type ParsedProductFields = {
  name: string;
  productType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
};

/** Validates product form fields for create/update. */
export function parseProductFields(input: {
  name: string;
  productType: string;
  quantity: unknown;
  unit: string;
  pricePerUnit: unknown;
  location: string;
}):
  | { ok: true; values: ParsedProductFields }
  | { ok: false; error: string } {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const productType =
    typeof input.productType === "string" ? input.productType.trim().toLowerCase() : "";
  const unit = typeof input.unit === "string" ? input.unit.trim() : "";
  const location = typeof input.location === "string" ? input.location.trim() : "";
  const quantity = Number(input.quantity);
  const pricePerUnit = Number(input.pricePerUnit);

  if (!name || !productType || !unit || !location) {
    return { ok: false, error: "name, productType, unit, and location are required." };
  }
  if (!Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, error: "quantity must be a non-negative number." };
  }
  if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
    return { ok: false, error: "pricePerUnit must be a non-negative number." };
  }

  return {
    ok: true,
    values: { name, productType, quantity, unit, pricePerUnit, location },
  };
}
