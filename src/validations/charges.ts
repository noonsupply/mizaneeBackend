import { z } from "zod";

import { CHARGE_CATEGORIES, CHARGE_TYPES } from "../lib/enums";

const montantParMoisSchema = z.record(
  z.string().regex(/^(0[1-9]|1[0-2])$/, "Clé mois invalide (01-12)"),
  z.number().finite().nonnegative(),
);

export const createChargeSchema = z
  .object({
    label: z.string().trim().min(1).max(200),
    montant: z.number().finite().nonnegative().optional(),
    montantParMois: montantParMoisSchema.optional(),
    categorie: z.enum(CHARGE_CATEGORIES),
    type: z.enum(CHARGE_TYPES).optional(),
    membreId: z.string().min(1).optional().nullable(),
    actif: z.boolean().optional(),
  })
  .refine((d) => d.montant !== undefined || (d.montantParMois && Object.keys(d.montantParMois).length > 0), {
    message: "montant ou montantParMois requis",
  });

export const updateChargeSchema = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  montant: z.number().finite().nonnegative().optional(),
  montantParMois: montantParMoisSchema.optional(),
  categorie: z.enum(CHARGE_CATEGORIES).optional(),
  type: z.enum(CHARGE_TYPES).optional(),
  membreId: z.string().min(1).optional().nullable(),
  actif: z.boolean().optional(),
});
