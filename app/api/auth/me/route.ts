import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/auth/me
 * Returns the current user if logged in (no password fields).
 */
export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectDB();
    const user = await User.findById(session.userId).lean();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        location: user.location,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
