import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Purchase request from a buyer (transaction simulation).
 * MVP: one product per request; status tracks the simple workflow.
 */
const orderSchema = new Schema(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantityRequested: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "completed"],
      default: "pending",
    },
    buyerMessage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1 });
orderSchema.index({ product: 1 });

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order =
  (mongoose.models.Order as mongoose.Model<OrderDocument>) ||
  mongoose.model<OrderDocument>("Order", orderSchema);
