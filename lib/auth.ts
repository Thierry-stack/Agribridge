import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";

/** Cookie name for the signed session token (HTTP-only, not readable from browser JS). */
export const AUTH_COOKIE = "agribridge_token";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    throw new Error(
      "Missing JWT_SECRET. Add it to .env.local (see .env.example)."
    );
  }
  return new TextEncoder().encode(secret);
}

export type AuthPayload = {
  userId: string;
  email: string;
  role: "farmer" | "buyer";
};

/** Create a JWT for the user and return the string (you will put it in a cookie). */
export async function createAuthToken(user: AuthPayload): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

/** Read the current user from the request cookie, or null if logged out / invalid. */
export async function getAuthUser(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = payload.sub;
    const email = payload.email;
    const role = payload.role;

    if (
      typeof sub !== "string" ||
      typeof email !== "string" ||
      (role !== "farmer" && role !== "buyer")
    ) {
      return null;
    }

    return { userId: sub, email, role };
  } catch {
    return null;
  }
}

/** Attach HTTP-only cookie with the JWT on a JSON response. */
export function withAuthCookie(
  res: NextResponse,
  token: string
): NextResponse {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

/** Clear the auth cookie (logout). */
export function clearAuthCookie(res: NextResponse): NextResponse {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
