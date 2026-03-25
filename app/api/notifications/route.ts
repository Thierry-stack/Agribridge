import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/notifications
 * Lists notifications for the logged-in user (newest first).
 */
export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    await connectDB();
    const [items, unreadCount] = await Promise.all([
      Notification.find({ recipient: session.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Notification.countDocuments({
        recipient: session.userId,
        read: false,
      }),
    ]);

    return NextResponse.json({
      notifications: items.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load notifications.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
