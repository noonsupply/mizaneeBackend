import { z } from "zod";

import { CERTITUDE_TYPES, REVENU_TYPES } from "../lib/enums";

const montantParMoisSchema = z.record(
  z.string().regex(/^(0[1-9]|1[0-2])$/, "Clé mois invalide (01-12)"),
  z.number().finite().nonnegative(),
);

const revenuFields = {
  label: z.string().trim().min(1).max(200),
  montant: z.number().finite().nonnegative().optional(),
  montantMensuel: z.number().finite().nonnegative().optional(),
  type: z.enum(REVENU_TYPES),
  membreId: z.string().min(1).optional().nullable(),
  actif: z.boolean().optional(),
  montantParMois: montantParMoisSchema.optional(),
  verseLe: z.string().max(50).optional().nullable(),
  certitude: z.enum(CERTITUDE_TYPES).optional().nullable(),
};

export const createRevenuSchema = z
  .object({
    ...revenuFields,
    type: z.enum(REVENU_TYPES),
  })
  .refine((d) => d.montant !== undefined || d.montantMensuel !== undefined, {
    message: "montant ou montantMensuel requis",
  })
  .transform((d) => ({
    ...d,
    montant: d.montant ?? d.montantMensuel ?? 0,
  }));

export const updateRevenuSchema = z
  .object({
    label: revenuFields.label.optional(),
    montant: revenuFields.montant,
    montantMensuel: revenuFields.montantMensuel,
    type: revenuFields.type.optional(),
    membreId: revenuFields.membreId,
    actif: revenuFields.actif,
    montantParMois: revenuFields.montantParMois,
    verseLe: revenuFields.verseLe,
    certitude: revenuFields.certitude,
  })
  .transform((d) => {
    const { montantMensuel, ...rest } = d;
    return {
      ...rest,
      ...(montantMensuel !== undefined && { montant: montantMensuel }),
    };
  });
