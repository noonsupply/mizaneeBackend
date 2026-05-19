import mongoose, { type Document, Schema } from "mongoose";

export interface ISoldeEpargne {
  montant: number;
  updatedAt: Date | null;
}

export interface IFoyer {
  nom: string;
  emoji?: string | null;
  soldeEpargne: ISoldeEpargne;
}

export interface FoyerDocument extends IFoyer, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const soldeEpargneSchema = new Schema<ISoldeEpargne>(
  {
    montant: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date, default: null },
  },
  { _id: false },
);

const foyerSchema = new Schema<FoyerDocument>(
  {
    nom: { type: String, required: true, trim: true },
    emoji: { type: String, default: null },
    soldeEpargne: { type: soldeEpargneSchema, default: () => ({ montant: 0, updatedAt: null }) },
  },
  { timestamps: true },
);

export const Foyer = mongoose.models.Foyer ?? mongoose.model<FoyerDocument>("Foyer", foyerSchema);

export function toFoyerPublic(doc: FoyerDocument) {
  return {
    id: doc._id.toString(),
    nom: doc.nom,
    emoji: doc.emoji ?? null,
    soldeEpargne: {
      montant: doc.soldeEpargne?.montant ?? 0,
      updatedAt: doc.soldeEpargne?.updatedAt?.toISOString() ?? null,
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
