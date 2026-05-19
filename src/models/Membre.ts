import mongoose, { type Document, Schema } from "mongoose";

export interface IMembre {
  prenom: string;
  couleur: string;
  emoji?: string | null;
  actif: boolean;
  prorata: number;
  foyerId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
}

export interface MembreDocument extends IMembre, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const membreSchema = new Schema<MembreDocument>(
  {
    prenom: { type: String, required: true, trim: true },
    couleur: { type: String, default: "#378ADD" },
    emoji: { type: String, default: null },
    actif: { type: Boolean, default: true },
    prorata: { type: Number, default: 0 },
    foyerId: { type: Schema.Types.ObjectId, ref: "Foyer", required: true, index: true },
    /** Lié au compte User uniquement pour le membre « propriétaire » ; omis pour les autres. */
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Un seul membre par compte User ; plusieurs membres sans userId (foyer multi-personnes).
membreSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $exists: true, $type: "objectId" } },
  },
);

export const Membre =
  mongoose.models.Membre ?? mongoose.model<MembreDocument>("Membre", membreSchema);

/** Corrige l’index legacy `userId_1` (unique non sparse) et les docs avec userId: null. */
export async function syncMembreIndexes(): Promise<void> {
  const collection = Membre.collection;
  const indexes = await collection.indexes();
  const legacy = indexes.find((idx) => idx.name === "userId_1");
  if (legacy && !legacy.partialFilterExpression) {
    await collection.dropIndex("userId_1");
  }
  await Membre.updateMany({ userId: null }, { $unset: { userId: "" } });
  await Membre.syncIndexes();
}

export function toMembrePublic(doc: MembreDocument) {
  return {
    id: doc._id.toString(),
    prenom: doc.prenom,
    couleur: doc.couleur,
    emoji: doc.emoji ?? null,
    actif: doc.actif,
    prorata: doc.prorata,
    foyerId: doc.foyerId.toString(),
    userId: doc.userId?.toString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}
