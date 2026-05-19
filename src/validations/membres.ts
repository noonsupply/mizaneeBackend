import { z } from "zod";

export const createMembreSchema = z.object({
  prenom: z.string().trim().min(1).max(100),
  couleur: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  emoji: z.string().max(20).optional().nullable(),
  prorata: z.number().min(0).max(100).optional(),
});

export const updateMembreSchema = z.object({
  prenom: z.string().trim().min(1).max(100).optional(),
  couleur: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  emoji: z.string().max(20).optional().nullable(),
  prorata: z.number().min(0).max(100).optional(),
  actif: z.boolean().optional(),
});

export const hardDeleteMembreSchema = z.object({
  confirm: z.literal(true, { message: "Confirmation requise (confirm: true)" }),
});
