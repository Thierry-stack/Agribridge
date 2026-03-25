import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";

/** GET /api/notifications/count — lightweight badge for the header. */
export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ unreadCount: 0 });
    }
    await connectDB();
    const unreadCount = await Notification.countDocuments({
      recipient: session.userId,
      read: false,
    });
    return NextResponse.json({ unreadCount });
  } catch {
    return NextResponse.json({ unreadCount: 0 });
  }
}
