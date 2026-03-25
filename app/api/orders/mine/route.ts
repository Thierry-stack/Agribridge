import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/orders/mine
 * Lists purchase requests the logged-in buyer has made.
 */
export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.role !== "buyer") {
      return NextResponse.json(
        { error: "Only buyers can view their purchase requests." },
        { status: 403 }
      );
    }

    await connectDB();
    const orders = await Order.find({ buyer: session.userId })
      .populate("product")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load orders.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
