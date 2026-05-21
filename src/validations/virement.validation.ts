import { z } from "zod";

const moisSchema = z.string().regex(/^\d{4}-\d{2}$/, "Format mois invalide (YYYY-MM)");

export const createVirementSchema = z.object({
  membreId: z.string().min(1),
  montant: z.number().finite().min(0),
  montantAttendu: z.number().finite().min(0),
  mois: moisSchema,
  note: z.string().max(500).optional(),
});

export const updateVirementSchema = z.object({
  montant: z.number().finite().min(0).optional(),
  montantAttendu: z.number().finite().min(0).optional(),
  note: z.string().max(500).optional().nullable(),
});

export const moisQuerySchema = z.object({
  mois: moisSchema.optional(),
});
