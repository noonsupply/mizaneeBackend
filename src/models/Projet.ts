import mongoose, { type Document, Schema } from "mongoose";

import { PROJET_STATUTS, type ProjetStatut } from "../lib/enums";

export interface IProjet {
  label: string;
  montant: number;
  dateCible: Date;
  epargneMensuelle: number;
  priorite: number;
  statut: ProjetStatut;
  couleur: string;
  emoji?: string | null;
  foyerId: mongoose.Types.ObjectId;
  membres: mongoose.Types.ObjectId[];
}

export interface ProjetDocument extends IProjet, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projetSchema = new Schema<ProjetDocument>(
  {
    label: { type: String, required: true, trim: true },
    montant: { type: Number, required: true, min: 0 },
    dateCible: { type: Date, required: true },
    epargneMensuelle: { type: Number, required: true, min: 0 },
    priorite: { type: Number, default: 1 },
    statut: { type: String, enum: PROJET_STATUTS, default: "EN_COURS" },
    couleur: { type: String, default: "#378ADD" },
    emoji: { type: String, default: null },
    foyerId: { type: Schema.Types.ObjectId, ref: "Foyer", required: true, index: true },
    membres: [{ type: Schema.Types.ObjectId, ref: "Membre" }],
  },
  { timestamps: true },
);

export const Projet =
  mongoose.models.Projet ?? mongoose.model<ProjetDocument>("Projet", projetSchema);

export function toProjetPublic(
  doc: ProjetDocument & {
    membres?: Array<{ _id: mongoose.Types.ObjectId; prenom: string } | mongoose.Types.ObjectId>;
  },
) {
  const membres =
    doc.membres?.map((m) =>
      typeof m === "object" && "prenom" in m
        ? { id: m._id.toString(), prenom: m.prenom }
        : { id: (m as mongoose.Types.ObjectId).toString(), prenom: "" },
    ) ?? [];

  return {
    id: doc._id.toString(),
    label: doc.label,
    montant: doc.montant,
    dateCible: doc.dateCible.toISOString(),
    epargneMensuelle: doc.epargneMensuelle,
    priorite: doc.priorite,
    statut: doc.statut,
    couleur: doc.couleur,
    emoji: doc.emoji ?? null,
    foyerId: doc.foyerId.toString(),
    createdAt: doc.createdAt.toISOString(),
    membres,
  };
}
