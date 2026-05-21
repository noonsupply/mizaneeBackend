import mongoose, { type Document, Schema } from "mongoose";

import { CHARGE_CATEGORIES, CHARGE_TYPES, type ChargeCategorie, type ChargeType } from "../lib/enums";

export interface ICharge {
  label: string;
  montant: number;
  montantParMois: Record<string, number>;
  montantMensuelMoyen: number;
  categorie: ChargeCategorie;
  type: ChargeType;
  actif: boolean;
  provisionner: boolean;
  toleranceDepassement: number;
  preleve: boolean;
  membreId?: mongoose.Types.ObjectId | null;
  foyerId: mongoose.Types.ObjectId;
}

export interface ChargeDocument extends ICharge, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  estCommune: boolean;
}

const chargeSchema = new Schema<ChargeDocument>(
  {
    label: { type: String, required: true, trim: true },
    montant: { type: Number, required: true, min: 0 },
    montantParMois: { type: Map, of: Number, default: {} },
    montantMensuelMoyen: { type: Number, required: true, min: 0 },
    categorie: { type: String, enum: CHARGE_CATEGORIES, required: true },
    type: { type: String, enum: CHARGE_TYPES, default: "COMMUNE" },
    actif: { type: Boolean, default: true },
    provisionner: { type: Boolean, default: false },
    toleranceDepassement: { type: Number, default: 0, min: 0 },
    preleve: { type: Boolean, default: false },
    membreId: { type: Schema.Types.ObjectId, ref: "Membre", default: null },
    foyerId: { type: Schema.Types.ObjectId, ref: "Foyer", required: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

chargeSchema.virtual("estCommune").get(function (this: ChargeDocument) {
  return this.membreId == null;
});

export const Charge =
  mongoose.models.Charge ?? mongoose.model<ChargeDocument>("Charge", chargeSchema);

function mapToRecord(montantParMois: Map<string, number> | Record<string, number>): Record<string, number> {
  if (montantParMois instanceof Map) {
    return Object.fromEntries(montantParMois.entries());
  }
  return montantParMois;
}

export function toChargePublic(
  doc: ChargeDocument & {
    membreId?: { _id?: mongoose.Types.ObjectId; prenom?: string } | mongoose.Types.ObjectId | null;
  },
) {
  const estCommune = doc.membreId == null;
  const membre =
    !estCommune && doc.membreId && typeof doc.membreId === "object" && "prenom" in doc.membreId
      ? {
          id: doc.membreId._id?.toString() ?? "",
          prenom: doc.membreId.prenom ?? "",
        }
      : null;

  return {
    id: doc._id.toString(),
    label: doc.label,
    montant: doc.montant,
    montantParMois: mapToRecord(doc.montantParMois),
    montantMensuelMoyen: doc.montantMensuelMoyen,
    categorie: doc.categorie,
    type: estCommune ? "COMMUNE" : "PERSONNELLE",
    actif: doc.actif,
    provisionner: doc.provisionner,
    toleranceDepassement: doc.toleranceDepassement,
    preleve: doc.preleve,
    estCommune,
    membreId:
      !estCommune && doc.membreId && typeof doc.membreId === "object" && "_id" in doc.membreId
        ? doc.membreId._id!.toString()
        : !estCommune && doc.membreId
          ? (doc.membreId as mongoose.Types.ObjectId).toString()
          : null,
    foyerId: doc.foyerId.toString(),
    createdAt: doc.createdAt.toISOString(),
    membre,
  };
}
