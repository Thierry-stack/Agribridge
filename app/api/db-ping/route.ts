import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

/**
 * GET /api/db-ping
 * Quick check that MONGODB_URI works and MongoDB accepts the connection.
 * Visit http://localhost:3000/api/db-ping after starting MongoDB and setting .env.local
 */
export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      ok: true,
      message: "Connected to MongoDB",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
