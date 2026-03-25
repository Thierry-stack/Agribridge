import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/products/mine
 * Lists products created by the logged-in farmer.
 */
export async function GET() {
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

    await connectDB();
    const products = await Product.find({ farmer: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load your products.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
