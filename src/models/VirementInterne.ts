import mongoose, { type Document, Schema } from "mongoose";

export interface IVirementInterne {
  foyerId: mongoose.Types.ObjectId;
  membreId: mongoose.Types.ObjectId;
  montant: number;
  montantAttendu: number;
  ecart: number;
  mois: string;
  note?: string | null;
}

export interface VirementInterneDocument extends IVirementInterne, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const virementInterneSchema = new Schema<VirementInterneDocument>(
  {
    foyerId: { type: Schema.Types.ObjectId, ref: "Foyer", required: true, index: true },
    membreId: { type: Schema.Types.ObjectId, ref: "Membre", required: true, index: true },
    montant: { type: Number, required: true, min: 0 },
    montantAttendu: { type: Number, required: true, min: 0 },
    ecart: { type: Number, default: 0 },
    mois: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

virementInterneSchema.pre("save", function () {
  this.ecart = this.montant - this.montantAttendu;
});

virementInterneSchema.index({ foyerId: 1, membreId: 1, mois: 1 }, { unique: true });

export const VirementInterne =
  mongoose.models.VirementInterne ??
  mongoose.model<VirementInterneDocument>("VirementInterne", virementInterneSchema);

export function toVirementPublic(
  doc: VirementInterneDocument & {
    membreId?: { _id?: mongoose.Types.ObjectId; prenom?: string; couleur?: string } | mongoose.Types.ObjectId;
  },
) {
  const membre =
    doc.membreId && typeof doc.membreId === "object" && "prenom" in doc.membreId
      ? {
          id: doc.membreId._id?.toString() ?? "",
          prenom: doc.membreId.prenom ?? "",
          couleur: doc.membreId.couleur ?? "#378ADD",
        }
      : undefined;

  return {
    id: doc._id.toString(),
    foyerId: doc.foyerId.toString(),
    membreId:
      typeof doc.membreId === "object" && "_id" in (doc.membreId as object)
        ? (doc.membreId as { _id: mongoose.Types.ObjectId })._id.toString()
        : (doc.membreId as mongoose.Types.ObjectId).toString(),
    montant: doc.montant,
    montantAttendu: doc.montantAttendu,
    ecart: doc.ecart,
    mois: doc.mois,
    note: doc.note ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    ...(membre ? { membre } : {}),
  };
}
