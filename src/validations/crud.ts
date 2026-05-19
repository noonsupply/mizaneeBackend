import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const createMembreSchema = z.object({
  prenom: z.string().min(1).max(100),
  couleur: hexColor.optional(),
  emoji: z.string().max(20).optional().nullable(),
  prorata: z.number().min(0).max(100).optional(),
});

export const patchMembreSchema = createMembreSchema.partial().extend({
  actif: z.boolean().optional(),
});

export const createRevenuSchema = z.object({
  label: z.string().min(1).max(200),
  montant: z.number().finite().nonnegative(),
  type: z.string().min(1),
  membreId: z.string().min(1).optional().nullable(),
  actif: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const patchRevenuSchema = createRevenuSchema.partial();

export const createChargeSchema = z.object({
  label: z.string().min(1).max(200),
  montant: z.number().finite().nonnegative(),
  categorie: z.string().min(1),
  type: z.enum(["COMMUNE", "PERSONNELLE"]).optional(),
  membreId: z.string().min(1).optional().nullable(),
  actif: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const patchChargeSchema = createChargeSchema.partial();

export const createProjetSchema = z.object({
  label: z.string().min(1).max(200),
  montant: z.number().finite().positive(),
  dateCible: z.string().min(1),
  montantDeja: z.number().finite().nonnegative().optional(),
  priorite: z.number().int().positive().optional(),
  statut: z.string().optional(),
  couleur: hexColor.optional(),
  emoji: z.string().max(20).optional().nullable(),
});

export const patchProjetSchema = createProjetSchema.partial();

export const reorderProjetsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
