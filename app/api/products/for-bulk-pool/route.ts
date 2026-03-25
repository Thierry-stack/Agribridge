import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { escapeRegex } from "@/lib/string-utils";

/**
 * GET /api/products/for-bulk-pool
 * Farmer only: listings in the same cell (same locationKey) as you, so you can
 * propose a combined bulk pool with neighbours.
 *
 * Query: ?productType=tomato&q= (optional filters; q matches name, type, location)
 */
export async function GET(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session || session.role !== "farmer") {
      return NextResponse.json({ error: "Farmers only." }, { status: 403 });
    }

    await connectDB();
    const me = await User.findById(session.userId).lean();
    if (!me?.locationKey) {
      return NextResponse.json(
        { error: "Complete your district / sector / cell / village on your profile." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productType = searchParams.get("productType")?.trim().toLowerCase() ?? "";
    const q = searchParams.get("q")?.trim() ?? "";

    const farmerIds = await User.find({
      role: "farmer",
      locationKey: me.locationKey,
    }).distinct("_id");

    const clauses: object[] = [{ farmer: { $in: farmerIds } }];
    if (productType) {
      clauses.push({
        productType: new RegExp(escapeRegex(productType), "i"),
      });
    }
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      clauses.push({
        $or: [{ name: rx }, { productType: rx }, { location: rx }],
      });
    }
    const filter =
      clauses.length === 1 ? clauses[0] : { $and: clauses };

    const products = await Product.find(filter)
      .populate("farmer", "name district sector cell village")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
