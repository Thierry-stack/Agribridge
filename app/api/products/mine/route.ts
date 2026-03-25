import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { getAuthUser } from "@/lib/auth";
import { escapeRegex } from "@/lib/string-utils";

/**
 * GET /api/products/mine
 * Lists products created by the logged-in farmer. Optional ?q= search on name, type, location.
 */
export async function GET(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.role !== "farmer") {
      return NextResponse.json(
        { error: "Only farmers can view their listings." },
        { status: 403 }
      );
    }

    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    const clauses: object[] = [{ farmer: session.userId }];
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      clauses.push({
        $or: [{ name: rx }, { productType: rx }, { location: rx }],
      });
    }
    const filter =
      clauses.length === 1 ? clauses[0] : { $and: clauses };

    await connectDB();
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load your products.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
