import { z } from "zod";

import { REVENU_TYPES } from "../lib/enums";

export const createRevenuSchema = z.object({
  label: z.string().trim().min(1).max(200),
  montant: z.number().finite().nonnegative(),
  type: z.enum(REVENU_TYPES),
  /** null ou absent = revenu commun du foyer (pas de membre « Commun » en base) */
  membreId: z.string().min(1).optional().nullable(),
  actif: z.boolean().optional(),
});

export const updateRevenuSchema = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  montant: z.number().finite().nonnegative().optional(),
  type: z.enum(REVENU_TYPES).optional(),
  membreId: z.string().min(1).optional().nullable(),
  actif: z.boolean().optional(),
});
