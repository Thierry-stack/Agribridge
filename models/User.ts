import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Users: farmers and buyers share one collection.
 * - role: who can list products vs who can place purchase requests.
 * - passwordHash: store a hash (we will hash passwords in the auth API step).
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
    /** District, sector, or village — used for filters and bulk “nearby” grouping. */
    location: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

/** Reuse compiled model in dev to avoid “OverwriteModelError” on hot reload. */
export const User =
  (mongoose.models.User as mongoose.Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", userSchema);
