import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";
import { createAuthToken, withAuthCookie } from "@/lib/auth";

/**
 * POST /api/auth/register
 * Body: { email, password, name, role: "farmer" | "buyer", location? }
 * Creates a user, hashes the password, sets an HTTP-only session cookie.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = body.role === "farmer" || body.role === "buyer" ? body.role : null;
    const location =
      typeof body.location === "string" ? body.location.trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json(
        { error: 'Role must be "farmer" or "buyer".' },
        { status: 400 }
      );
    }

    await connectDB();
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email,
      passwordHash,
      name,
      role,
      location,
    });

    const token = await createAuthToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        location: user.location,
      },
    });
    return withAuthCookie(res, token);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
