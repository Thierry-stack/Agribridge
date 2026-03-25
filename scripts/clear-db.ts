/**
 * Deletes all documents in Agribridge collections. Run once to remove demo/seed data:
 *   npm run clear-db
 *
 * Requires MONGODB_URI in .env.local
 */

import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const mongoose = (await import("mongoose")).default;
  const uri = process.env.MONGODB_URI;
  if (!uri?.trim()) {
    console.error("Missing MONGODB_URI. Set it in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected.");

  const { User } = await import("../models/User");
  const { Product } = await import("../models/Product");
  const { Order } = await import("../models/Order");
  const { Notification } = await import("../models/Notification");
  const { BulkPool } = await import("../models/BulkPool");
  const { AggregatedProduct } = await import("../models/AggregatedProduct");

  const results = await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Notification.deleteMany({}),
    BulkPool.deleteMany({}),
    AggregatedProduct.deleteMany({}),
  ]);

  const labels = ["users", "products", "orders", "notifications", "bulkPools", "aggregations"];
  results.forEach((r, i) => {
    console.log(`${labels[i]}: deleted ${r.deletedCount}`);
  });

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
