import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { getAuthUser } from "@/lib/auth";
import { escapeRegex } from "@/lib/string-utils";
import { saveProductImage } from "@/lib/product-image";

/**
 * GET /api/products
 * Public marketplace list. Optional query: ?productType=tomato&location=kigali
 *
 * POST /api/products — farmer only.
 * - JSON body: { name, productType, quantity, unit, pricePerUnit, location }
 * - multipart/form-data: same fields + optional file field "image" (JPG/PNG/WebP/GIF, max 2MB)
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get("productType")?.trim() ?? "";
    const location = searchParams.get("location")?.trim() ?? "";

    const filter: Record<string, unknown> = {};
    if (productType) {
      filter.productType = new RegExp(escapeRegex(productType), "i");
    }
    if (location) {
      filter.location = new RegExp(escapeRegex(location), "i");
    }

    const products = await Product.find(filter)
      .populate("farmer", "name location email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load products.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type ParsedProductFields = {
  name: string;
  productType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
};

function parseFields(input: {
  name: string;
  productType: string;
  quantity: unknown;
  unit: string;
  pricePerUnit: unknown;
  location: string;
}): { ok: true; values: ParsedProductFields } | { ok: false; error: string } {
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

export async function POST(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.role !== "farmer") {
      return NextResponse.json(
        { error: "Only farmers can create product listings." },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let imageUrl = "";

    let name: string;
    let productType: string;
    let quantity: number;
    let unit: string;
    let pricePerUnit: number;
    let location: string;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = String(form.get("name") ?? "").trim();
      productType = String(form.get("productType") ?? "").trim().toLowerCase();
      unit = String(form.get("unit") ?? "").trim();
      location = String(form.get("location") ?? "").trim();
      quantity = Number(form.get("quantity"));
      pricePerUnit = Number(form.get("pricePerUnit"));

      const file = form.get("image");
      if (file instanceof File && file.size > 0) {
        try {
          imageUrl = await saveProductImage(file);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Invalid image.";
          return NextResponse.json({ error: msg }, { status: 400 });
        }
      }
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      name = typeof body.name === "string" ? body.name.trim() : "";
      productType =
        typeof body.productType === "string" ? body.productType.trim().toLowerCase() : "";
      unit = typeof body.unit === "string" ? body.unit.trim() : "";
      location = typeof body.location === "string" ? body.location.trim() : "";
      quantity = Number(body.quantity);
      pricePerUnit = Number(body.pricePerUnit);
    }

    const parsed = parseFields({
      name,
      productType,
      quantity,
      unit,
      pricePerUnit,
      location,
    });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const {
      name: n,
      productType: pt,
      quantity: q,
      unit: u,
      pricePerUnit: p,
      location: loc,
    } = parsed.values;

    await connectDB();
    const product = await Product.create({
      farmer: session.userId,
      name: n,
      productType: pt,
      quantity: q,
      unit: u,
      pricePerUnit: p,
      location: loc,
      imageUrl: imageUrl || "",
    });

    const populated = await Product.findById(product._id)
      .populate("farmer", "name location email")
      .lean();

    return NextResponse.json({ product: populated }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
