import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { BulkPool } from "@/models/BulkPool";
import { Notification } from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";

/**
 * POST /api/bulk-pools/[id]/approve
 * Farmer approves their part in a pending bulk pool. When everyone has approved,
 * status becomes `active` and the pool appears for buyers/suppliers on /bulk.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session || session.role !== "farmer") {
      return NextResponse.json({ error: "Farmers only." }, { status: 403 });
    }

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    await connectDB();
    const pool = await BulkPool.findById(id);
    if (!pool) {
      return NextResponse.json({ error: "Pool not found." }, { status: 404 });
    }

    if (pool.status !== "pending") {
      return NextResponse.json(
        { error: "This pool is not waiting for approvals." },
        { status: 400 }
      );
    }

    const uid = session.userId;
    const pending = pool.pendingFarmerIds.map((x) => x.toString());
    if (!pending.includes(uid)) {
      return NextResponse.json(
        { error: "You are not waiting to approve this pool." },
        { status: 400 }
      );
    }

    pool.pendingFarmerIds = pool.pendingFarmerIds.filter(
      (x) => x.toString() !== uid
    ) as mongoose.Types.ObjectId[];
    pool.approvedFarmerIds.push(new mongoose.Types.ObjectId(uid));

    if (pool.pendingFarmerIds.length === 0) {
      pool.status = "active";
      for (const fid of pool.farmerIds) {
        await Notification.create({
          recipient: fid,
          type: "bulk_pool_active",
          title: "Bulk pool is live",
          body: `The combined ${pool.productType} pool (${pool.totalQuantity} ${pool.unit}) is now visible to buyers and suppliers on Bulk sales.`,
        });
      }
    }

    await pool.save();

    const populated = await BulkPool.findById(pool._id)
      .populate("entries.farmer", "name")
      .populate("entries.product", "name")
      .lean();

    return NextResponse.json({ pool: populated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to approve.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
