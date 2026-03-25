import { NextResponse } from "next/server";
import type { PipelineStage } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { escapeRegex } from "@/lib/string-utils";

/**
 * GET /api/aggregations
 * Groups listings by product type + location (case-insensitive) and sums quantity
 * so buyers can see “bulk” availability across nearby farmers.
 *
 * Optional query: ?productType=tomato&location=kigali (substring-style regex filters)
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get("productType")?.trim() ?? "";
    const location = searchParams.get("location")?.trim() ?? "";

    const match: Record<string, unknown> = {};
    if (productType) {
      match.productType = new RegExp(escapeRegex(productType), "i");
    }
    if (location) {
      match.location = new RegExp(escapeRegex(location), "i");
    }

    const pipeline: PipelineStage[] = [
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      {
        $group: {
          _id: {
            productType: { $toLower: "$productType" },
            locationKey: { $toLower: "$location" },
          },
          totalQuantity: { $sum: "$quantity" },
          farmerIds: { $addToSet: "$farmer" },
          displayName: { $first: "$name" },
          unit: { $first: "$unit" },
          locationDisplay: { $first: "$location" },
          sampleImageUrl: { $first: "$imageUrl" },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ];

    const groups = await Product.aggregate(pipeline);

    return NextResponse.json({
      groups: groups.map((g) => ({
        productType: g._id.productType,
        locationKey: g._id.locationKey,
        location: g.locationDisplay,
        displayName: g.displayName,
        totalQuantity: g.totalQuantity,
        unit: g.unit,
        farmerCount: g.farmerIds.length,
        farmerIds: g.farmerIds.map((id: unknown) => String(id)),
        imageUrl: g.sampleImageUrl || "",
      })),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to compute aggregations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
