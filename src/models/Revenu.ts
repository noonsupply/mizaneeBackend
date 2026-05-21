import mongoose, { type Document, Schema } from "mongoose";

import { CERTITUDE_TYPES, REVENU_TYPES, type CertitudeType, type RevenuType } from "../lib/enums";

export interface IRevenu {
  label: string;
  montant: number;
  type: RevenuType;
  actif: boolean;
  montantParMois: Record<string, number>;
  verseLe?: string | null;
  certitude?: CertitudeType | null;
  membreId?: mongoose.Types.ObjectId | null;
  foyerId: mongoose.Types.ObjectId;
}

export interface RevenuDocument extends IRevenu, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  estCommune: boolean;
}

const revenuSchema = new Schema<RevenuDocument>(
  {
    label: { type: String, required: true, trim: true },
    montant: { type: Number, required: true, min: 0 },
    type: { type: String, enum: REVENU_TYPES, required: true },
    actif: { type: Boolean, default: true },
    montantParMois: { type: Map, of: Number, default: {} },
    verseLe: { type: String, default: null },
    certitude: { type: String, enum: CERTITUDE_TYPES, default: null },
    membreId: { type: Schema.Types.ObjectId, ref: "Membre", default: null },
    foyerId: { type: Schema.Types.ObjectId, ref: "Foyer", required: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

revenuSchema.virtual("estCommune").get(function (this: RevenuDocument) {
  return this.membreId == null;
});

export const Revenu =
  mongoose.models.Revenu ?? mongoose.model<RevenuDocument>("Revenu", revenuSchema);

function mapToRecord(montantParMois: Map<string, number> | Record<string, number>): Record<string, number> {
  if (montantParMois instanceof Map) {
    return Object.fromEntries(montantParMois.entries());
  }
  return montantParMois;
}

export function toRevenuPublic(
  doc: RevenuDocument & {
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
    montantMensuel: doc.montant,
    type: doc.type,
    actif: doc.actif,
    montantParMois: mapToRecord(doc.montantParMois),
    verseLe: doc.verseLe ?? null,
    certitude: doc.certitude ?? null,
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
