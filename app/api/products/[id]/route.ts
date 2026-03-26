import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { BulkPool } from "@/models/BulkPool";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { getAuthUser } from "@/lib/auth";
import { parseProductFields } from "@/lib/product-fields";
import { saveProductImage } from "@/lib/product-image";

/**
 * PATCH /api/products/[id] — farmer only; updates own listing.
 * multipart/form-data or JSON; optional new image replaces previous.
 *
 * DELETE /api/products/[id] — farmer only; blocked if orders or bulk pools reference it.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.role !== "farmer") {
      return NextResponse.json(
        { error: "Only farmers can edit listings." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
    }

    await connectDB();
    const existing = await Product.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    if (String(existing.farmer) !== session.userId) {
      return NextResponse.json(
        { error: "You can only edit your own listings." },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let newImageUrl: string | null = null;

    let name: string;
    let productType: string;
    let quantity: number;
    let unit: string;
    let pricePerUnit: number;
    let location: string;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = String(form.get("name") ?? "").trim();
      productType = String(form.get("productType") ?? "").trim().toLowerCase();
      unit = String(form.get("unit") ?? "").trim();
      location = String(form.get("location") ?? "").trim();
      quantity = Number(form.get("quantity"));
      pricePerUnit = Number(form.get("pricePerUnit"));

      const file = form.get("image");
      if (file instanceof File && file.size > 0) {
        try {
          newImageUrl = await saveProductImage(file);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Invalid image.";
          return NextResponse.json({ error: msg }, { status: 400 });
        }
      }
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      name = typeof body.name === "string" ? body.name.trim() : "";
      productType =
        typeof body.productType === "string" ? body.productType.trim().toLowerCase() : "";
      unit = typeof body.unit === "string" ? body.unit.trim() : "";
      location = typeof body.location === "string" ? body.location.trim() : "";
      quantity = Number(body.quantity);
      pricePerUnit = Number(body.pricePerUnit);
    }

    const parsed = parseProductFields({
      name,
      productType,
      quantity,
      unit,
      pricePerUnit,
      location,
    });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const {
      name: n,
      productType: pt,
      quantity: q,
      unit: u,
      pricePerUnit: p,
      location: loc,
    } = parsed.values;

    existing.name = n;
    existing.productType = pt;
    existing.quantity = q;
    existing.unit = u;
    existing.pricePerUnit = p;
    existing.location = loc;
    if (newImageUrl) {
      existing.imageUrl = newImageUrl;
    }
    await existing.save();

    const populated = await Product.findById(existing._id)
      .populate("farmer", "name location email")
      .lean();

    return NextResponse.json({ product: populated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.role !== "farmer") {
      return NextResponse.json(
        { error: "Only farmers can delete listings." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    if (String(product.farmer) !== session.userId) {
      return NextResponse.json(
        { error: "You can only delete your own listings." },
        { status: 403 }
      );
    }

    const oid = new mongoose.Types.ObjectId(id);
    const orderCount = await Order.countDocuments({ product: oid });
    if (orderCount > 0) {
      return NextResponse.json(
        {
          error:
            "This listing has buyer requests. You cannot delete it while orders still reference it.",
        },
        { status: 400 }
      );
    }

    const inBulkPool = await BulkPool.countDocuments({
      "entries.product": oid,
    });
    if (inBulkPool > 0) {
      return NextResponse.json(
        {
          error:
            "This listing is part of a bulk pool. It must be removed from that pool before you can delete it.",
        },
        { status: 400 }
      );
    }

    await Product.deleteOne({ _id: oid });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
