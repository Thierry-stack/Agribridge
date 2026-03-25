import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/orders/incoming
 * Farmers: lists purchase requests for products they listed.
 */
export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.role !== "farmer") {
      return NextResponse.json(
        { error: "Only farmers can view incoming purchase requests." },
        { status: 403 }
      );
    }

    await connectDB();
    const productIds = await Product.find({ farmer: session.userId }).distinct("_id");
    const orders = await Order.find({ product: { $in: productIds } })
      .populate("product")
      .populate("buyer", "name email location")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load incoming orders.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
