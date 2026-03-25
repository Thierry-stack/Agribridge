import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { BulkPool } from "@/models/BulkPool";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { escapeRegex } from "@/lib/string-utils";
import { notifyBulkPoolInvites } from "@/lib/notify-bulk-pool-invite";

/**
 * GET /api/bulk-pools
 * Public: only **active** pools (all farmers approved) — for buyers & suppliers.
 * Query: ?q=&productType=&location=
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const productType = searchParams.get("productType")?.trim() ?? "";
    const location = searchParams.get("location")?.trim() ?? "";

    const clauses: object[] = [{ status: "active" }];
    if (productType) {
      clauses.push({
        productType: new RegExp(escapeRegex(productType), "i"),
      });
    }
    if (location) {
      clauses.push({
        locationKey: new RegExp(escapeRegex(location), "i"),
      });
    }
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      clauses.push({
        $or: [{ title: rx }, { productType: rx }, { locationKey: rx }],
      });
    }
    const filter =
      clauses.length === 1 ? clauses[0] : { $and: clauses };

    const pools = await BulkPool.find(filter)
      .populate("entries.farmer", "name district sector cell")
      .populate("entries.product", "name location pricePerUnit imageUrl")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ pools });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load bulk pools.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/bulk-pools
 * Farmer: propose combining listings (same product type, same cell, ≥2 farmers).
 * Other farmers must approve before the pool appears on the public Bulk page.
 */
export async function POST(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session || session.role !== "farmer") {
      return NextResponse.json({ error: "Only farmers can create bulk pools." }, { status: 403 });
    }

    const body = (await request.json()) as { productIds?: unknown };
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter((id): id is string => typeof id === "string")
      : [];

    if (productIds.length < 2) {
      return NextResponse.json(
        { error: "Select at least two product listings to combine." },
        { status: 400 }
      );
    }

    await connectDB();

    const products = await Product.find({
      _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .populate("farmer")
      .lean();

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products were not found." },
        { status: 400 }
      );
    }

    const productTypes = new Set(
      products.map((p) => String(p.productType).toLowerCase())
    );
    if (productTypes.size !== 1) {
      return NextResponse.json(
        { error: "All listings must be the same product type." },
        { status: 400 }
      );
    }

    const farmerDocs = await Promise.all(
      products.map((p) => {
        const fid = (p.farmer as { _id: mongoose.Types.ObjectId })._id;
        return User.findById(fid).lean();
      })
    );

    const keys = [
      ...new Set(farmerDocs.map((u) => u?.locationKey ?? "").filter(Boolean)),
    ];
    if (keys.length !== 1) {
      return NextResponse.json(
        {
          error:
            "Every farmer must be in the same cell (same district · sector · cell).",
        },
        { status: 400 }
      );
    }

    const uniqueFarmerIds = [
      ...new Set(
        products.map((p) => (p.farmer as { _id: mongoose.Types.ObjectId })._id.toString())
      ),
    ];
    if (uniqueFarmerIds.length < 2) {
      return NextResponse.json(
        {
          error:
            "A bulk pool needs at least two different farmers. Invite neighbours in your cell.",
        },
        { status: 400 }
      );
    }

    const creatorId = session.userId;
    const creatorOwns = products.some(
      (p) => (p.farmer as { _id: mongoose.Types.ObjectId })._id.toString() === creatorId
    );
    if (!creatorOwns) {
      return NextResponse.json(
        { error: "Include at least one listing from your own farm." },
        { status: 400 }
      );
    }

    const entries = products.map((p) => ({
      farmer: (p.farmer as { _id: mongoose.Types.ObjectId })._id,
      product: p._id,
      quantity: p.quantity,
    }));
    const totalQuantity = entries.reduce((s, e) => s + e.quantity, 0);
    const unit = String(products[0].unit);

    const farmerObjectIds = uniqueFarmerIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const creatorOid = new mongoose.Types.ObjectId(creatorId);
    const pendingFarmerIds = farmerObjectIds.filter(
      (id) => id.toString() !== creatorOid.toString()
    );
    const approvedFarmerIds = [creatorOid];

    const fu = farmerDocs[0];
    const title = `${products[0].productType} — ${fu?.district ?? ""} / ${fu?.sector ?? ""} / ${fu?.cell ?? ""}`;

    const pool = await BulkPool.create({
      title: title.trim(),
      productType: String(products[0].productType).toLowerCase(),
      locationKey: keys[0],
      unit,
      entries,
      totalQuantity,
      createdBy: creatorOid,
      farmerIds: farmerObjectIds,
      pendingFarmerIds,
      approvedFarmerIds,
      status: pendingFarmerIds.length === 0 ? "active" : "pending",
    });

    if (pendingFarmerIds.length > 0) {
      await notifyBulkPoolInvites(
        pool._id,
        pendingFarmerIds,
        pool.productType,
        totalQuantity,
        unit
      );
    }

    const populated = await BulkPool.findById(pool._id)
      .populate("entries.farmer", "name")
      .populate("entries.product", "name")
      .lean();

    return NextResponse.json({ pool: populated }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create bulk pool.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
