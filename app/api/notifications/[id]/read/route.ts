import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";

/**
 * PATCH /api/notifications/[id]/read
 * Marks one notification as read for the current user.
 */
export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    await connectDB();
    const result = await Notification.updateOne(
      { _id: id, recipient: session.userId },
      { $set: { read: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
