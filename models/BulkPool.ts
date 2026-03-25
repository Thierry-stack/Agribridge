import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Farmers explicitly combine specific listings into one pooled quantity for
 * large buyers/suppliers. Status becomes `active` when every involved farmer
 * has approved.
 */
const entrySchema = new Schema(
  {
    farmer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bulkPoolSchema = new Schema(
  {
    /** Short label for buyers (e.g. "Tomatoes — Nyabihu / Muko / Gikombe"). */
    title: { type: String, trim: true, default: "" },
    productType: { type: String, required: true, lowercase: true, trim: true },
    locationKey: { type: String, required: true, index: true },
    unit: { type: String, required: true, trim: true },
    entries: { type: [entrySchema], required: true },
    totalQuantity: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** All farmers involved in this pool (for notifications and display). */
    farmerIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    /** Farmers who must still approve (excluding those already in approvedFarmerIds). */
    pendingFarmerIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    approvedFarmerIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["pending", "active", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

bulkPoolSchema.index({ productType: 1, locationKey: 1 });

export type BulkPoolDocument = InferSchemaType<typeof bulkPoolSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BulkPool =
  (mongoose.models.BulkPool as mongoose.Model<BulkPoolDocument>) ||
  mongoose.model<BulkPoolDocument>("BulkPool", bulkPoolSchema);
