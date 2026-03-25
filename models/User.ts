import mongoose, { Schema, type InferSchemaType } from "mongoose";
import {
  computeLocationKey,
  formatFullLocation,
} from "@/lib/location-key";

/**
 * Users: farmers and buyers share one collection.
 * Farmers register with full admin hierarchy so we can match at **cell** level
 * (district + sector + cell) without ambiguous names.
 */
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["farmer", "buyer"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    /** Akarere — required for farmers at signup. */
    district: { type: String, trim: true, default: "" },
    /** Umurenge — required for farmers at signup. */
    sector: { type: String, trim: true, default: "" },
    /** Akagari — required for farmers; used with district+sector for matching. */
    cell: { type: String, trim: true, default: "" },
    /** Umudugu — stored for display / future finer matching. */
    village: { type: String, trim: true, default: "" },
    /**
     * Normalized key: district|sector|cell — farmers in the same cell share this.
     * Indexed for “nearby farmer” queries.
     */
    locationKey: { type: String, trim: true, default: "", index: true },
    /** Legacy single-line summary; auto-filled for farmers from hierarchy. */
    location: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function () {
  if (this.role === "farmer" && this.district && this.sector && this.cell) {
    this.locationKey = computeLocationKey(
      this.district,
      this.sector,
      this.cell
    );
    this.location = formatFullLocation({
      district: this.district,
      sector: this.sector,
      cell: this.cell,
      village: this.village || "",
    });
  } else if (this.role !== "farmer") {
    this.locationKey = "";
  }
});

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

/** Reuse compiled model in dev to avoid “OverwriteModelError” on hot reload. */
export const User =
  (mongoose.models.User as mongoose.Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", userSchema);
