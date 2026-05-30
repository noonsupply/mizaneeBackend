import { z } from "zod";

import { PROJET_STATUTS } from "../lib/enums";

export const createProjetSchema = z.object({
  label: z.string().trim().min(1).max(200),
  montant: z.number().finite().positive(),
  dateCible: z.coerce.date(),
  priorite: z.number().int().min(1).optional(),
  statut: z.enum(PROJET_STATUTS).optional(),
  couleur: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  emoji: z.string().max(20).optional().nullable(),
  membreIds: z.array(z.string().min(1)).optional(),
});

export const updateProjetSchema = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  montant: z.number().finite().positive().optional(),
  dateCible: z.coerce.date().optional(),
  priorite: z.number().int().min(1).optional(),
  statut: z.enum(PROJET_STATUTS).optional(),
  couleur: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  emoji: z.string().max(20).optional().nullable(),
  membreIds: z.array(z.string().min(1)).optional(),
});

export const terminerProjetSchema = z.object({
  dateDepense: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format attendu YYYY-MM")
    .optional(),
});

export const reorderProjetsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        priorite: z.number().int().min(1),
      }),
    )
    .min(1),
});
