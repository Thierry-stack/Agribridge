import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { getAuthUser } from "@/lib/auth";

/**
 * POST /api/orders
 * Buyer submits a purchase request (simulated transaction).
 * Body: { productId, quantityRequested, buyerMessage? }
 */
export async function POST(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.role !== "buyer") {
      return NextResponse.json(
        { error: "Only buyers can place purchase requests." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";
    const quantityRequested = Number(body.quantityRequested);
    const buyerMessage =
      typeof body.buyerMessage === "string" ? body.buyerMessage.trim() : "";

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return NextResponse.json({ error: "Valid productId is required." }, { status: 400 });
    }
    if (!Number.isFinite(quantityRequested) || quantityRequested <= 0) {
      return NextResponse.json(
        { error: "quantityRequested must be a positive number." },
        { status: 400 }
      );
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const order = await Order.create({
      buyer: session.userId,
      product: productId,
      quantityRequested,
      buyerMessage,
      status: "pending",
    });

    const populated = await Order.findById(order._id)
      .populate("product")
      .populate("buyer", "name email")
      .lean();

    return NextResponse.json({ order: populated }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
