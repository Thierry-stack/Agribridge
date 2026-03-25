/**
 * Populate MongoDB with demo farmers, a buyer, and sample listings.
 * Run: npm run seed
 * Safe to run twice — skips if demo data already exists.
 */

import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.local") });

const MARKER_EMAIL = "demo-farmer1@agribridge.demo";

async function main() {
  const mongoose = (await import("mongoose")).default;
  const { User } = await import("../models/User");
  const { Product } = await import("../models/Product");
  const { hashPassword } = await import("../lib/password");

  const uri = process.env.MONGODB_URI;
  if (!uri?.trim()) {
    console.error("Missing MONGODB_URI. Set it in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const existing = await User.findOne({ email: MARKER_EMAIL });
  if (existing) {
    console.log("Demo data already present (found demo farmer). Skipping seed.");
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashPassword("demo1234");

  const farmer1 = await User.create({
    email: MARKER_EMAIL,
    passwordHash,
    role: "farmer",
    name: "Demo Farmer — Marie",
    location: "Kigali",
  });

  const farmer2 = await User.create({
    email: "demo-farmer2@agribridge.demo",
    passwordHash,
    role: "farmer",
    name: "Demo Farmer — Jean",
    location: "Kigali",
  });

  const buyer = await User.create({
    email: "demo-buyer@agribridge.demo",
    passwordHash,
    role: "buyer",
    name: "Demo Buyer — Cooperative",
    location: "Kigali",
  });

  await Product.create([
    {
      farmer: farmer1._id,
      name: "Fresh tomatoes (vine)",
      productType: "tomatoes",
      quantity: 120,
      unit: "kg",
      pricePerUnit: 480,
      location: "Kigali — Gasabo",
    },
    {
      farmer: farmer2._id,
      name: "Tomatoes (grade A)",
      productType: "tomatoes",
      quantity: 200,
      unit: "kg",
      pricePerUnit: 450,
      location: "Kigali — Gasabo",
    },
    {
      farmer: farmer1._id,
      name: "Fresh milk",
      productType: "milk",
      quantity: 80,
      unit: "liter",
      pricePerUnit: 620,
      location: "Eastern Province — Nyagatare",
    },
  ]);

  console.log("Seed complete.");
  console.log("--- Demo logins (password for all: demo1234) ---");
  console.log("Farmers:", farmer1.email, "|", farmer2.email);
  console.log("Buyer:", buyer.email);
  console.log("---");
  console.log("Open /marketplace and /bulk to see grouped tomatoes in Kigali.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
