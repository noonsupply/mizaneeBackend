import { z } from "zod";

export const patchFoyerSchema = z.object({
  nom: z.string().trim().min(1).max(200).optional(),
  emoji: z.string().max(20).nullable().optional(),
});

export const patchSoldeEpargneSchema = z.object({
  montant: z.coerce.number().min(0, "Le montant doit être positif ou nul"),
});
