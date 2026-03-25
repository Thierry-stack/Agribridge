import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Optional cache for “bulk” view: same product type + same general area.
 * You can fill/update this from an API job or compute on the fly — storing here
 * avoids recomputing heavy aggregations on every page load later.
 *
 * groupKey should be stable, e.g. "tomatoes|kigali" (normalized strings).
 */
const aggregatedProductSchema = new Schema(
  {
    groupKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    /** Farmers who contributed listings in this group (for display). */
    farmerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export type AggregatedProductDocument = InferSchemaType<
  typeof aggregatedProductSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const AggregatedProduct =
  (mongoose.models.AggregatedProduct as mongoose.Model<AggregatedProductDocument>) ||
  mongoose.model<AggregatedProductDocument>(
    "AggregatedProduct",
    aggregatedProductSchema
  );
