import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A product listing created by a farmer.
 * - productType: used for browse/filter (e.g. "tomatoes", "milk").
 * - pricePerUnit + unit: e.g. 500 RWF per kg.
 */
const productSchema = new Schema(
  {
    farmer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    productType: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    /** Where the produce is / can be collected — filter + bulk “nearby” logic. */
    location: {
      type: String,
      required: true,
      trim: true,
    },
    /** Public URL path e.g. /uploads/products/.... Empty = use default placeholder in UI. */
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ productType: 1, location: 1 });
productSchema.index({ farmer: 1 });

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product =
  (mongoose.models.Product as mongoose.Model<ProductDocument>) ||
  mongoose.model<ProductDocument>("Product", productSchema);
