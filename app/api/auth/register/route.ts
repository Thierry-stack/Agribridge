import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";
import { createAuthToken, withAuthCookie } from "@/lib/auth";
import { notifyNearbyFarmersOnRegister } from "@/lib/notify-nearby-farmers";

/**
 * POST /api/auth/register
 * Farmers must send district, sector, cell, village (Rwanda admin hierarchy).
 * Buyers may omit or partially fill location fields.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = body.role === "farmer" || body.role === "buyer" ? body.role : null;
    const district = typeof body.district === "string" ? body.district.trim() : "";
    const sector = typeof body.sector === "string" ? body.sector.trim() : "";
    const cell = typeof body.cell === "string" ? body.cell.trim() : "";
    const village = typeof body.village === "string" ? body.village.trim() : "";
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

    if (role === "farmer") {
      if (!district || !sector || !cell || !village) {
        return NextResponse.json(
          {
            error:
              "Farmers must provide district (Akarere), sector (Umurenge), cell (Akagari), and village (Umudugu).",
          },
          { status: 400 }
        );
      }
    }

    await connectDB();
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email,
      passwordHash,
      name,
      role,
      district: role === "farmer" ? district : district || "",
      sector: role === "farmer" ? sector : sector || "",
      cell: role === "farmer" ? cell : cell || "",
      village: role === "farmer" ? village : village || "",
      location: role === "buyer" ? location : "",
    });

    if (role === "farmer") {
      await notifyNearbyFarmersOnRegister(user._id);
    }

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
        district: user.district,
        sector: user.sector,
        cell: user.cell,
        village: user.village,
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
