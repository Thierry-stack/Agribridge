import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { BulkPool } from "@/models/BulkPool";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/bulk-pools/pending
 * Farmer: bulk pools waiting for your approval.
 */
export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session || session.role !== "farmer") {
      return NextResponse.json({ error: "Farmers only." }, { status: 403 });
    }

    await connectDB();
    const pools = await BulkPool.find({
      status: "pending",
      pendingFarmerIds: new mongoose.Types.ObjectId(session.userId),
    })
      .populate("entries.farmer", "name")
      .populate("entries.product", "name location quantity")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ pools });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
