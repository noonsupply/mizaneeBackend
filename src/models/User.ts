import mongoose, { type Document, Schema } from "mongoose";

export interface IUser {
  email: string;
  name?: string | null;
  passwordHash: string;
  image?: string | null;
  foyerId?: mongoose.Types.ObjectId | null;
  membreId?: mongoose.Types.ObjectId | null;
}

export interface UserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, trim: true, default: null },
    passwordHash: { type: String, required: true, select: false },
    image: { type: String, default: null },
    foyerId: { type: Schema.Types.ObjectId, ref: "Foyer", default: null },
    membreId: { type: Schema.Types.ObjectId, ref: "Membre", default: null },
  },
  { timestamps: true },
);

export const User = mongoose.models.User ?? mongoose.model<UserDocument>("User", userSchema);

export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  foyerId: string | null;
  membreId: string | null;
}

export function toUserPublic(
  doc: Pick<UserDocument, "_id" | "email" | "name" | "image" | "foyerId" | "membreId">,
): UserPublic {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name ?? null,
    image: doc.image ?? null,
    foyerId: doc.foyerId?.toString() ?? null,
    membreId: doc.membreId?.toString() ?? null,
  };
}
