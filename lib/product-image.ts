import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Server-only: save uploads. Import from API routes only — not from client components. */

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const extMap: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Saves an uploaded image under public/uploads/products and returns a public URL path.
 * Used only from the products API route (Node runtime).
 */
export async function saveProductImage(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Empty image file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 2MB or smaller.");
  }
  const type = file.type;
  if (!ALLOWED.has(type)) {
    throw new Error("Use JPG, PNG, WebP, or GIF.");
  }
  const ext = extMap[type] ?? ".jpg";
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/products/${filename}`;
}
