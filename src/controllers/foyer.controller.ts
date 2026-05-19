import type { Request, Response } from "express";

import { foyerObjectId, requireFoyerId } from "../lib/foyerAccess";
import { sendSuccess } from "../lib/response";
import { AppError } from "../middleware/errorHandler";
import { Foyer, toFoyerPublic } from "../models/Foyer";
import { patchFoyerSchema, patchSoldeEpargneSchema } from "../validations/foyer";

export async function getOne(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const foyer = await Foyer.findById(foyerId);
  if (!foyer) {
    throw new AppError(404, "Foyer introuvable", "NOT_FOUND");
  }
  sendSuccess(res, { foyer: toFoyerPublic(foyer) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const input = patchFoyerSchema.parse(req.body);

  const foyer = await Foyer.findByIdAndUpdate(
    foyerObjectId(req),
    {
      ...(input.nom !== undefined && { nom: input.nom }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
    },
    { new: true },
  );

  if (!foyer) {
    throw new AppError(404, "Foyer introuvable", "NOT_FOUND");
  }

  sendSuccess(res, { foyer: toFoyerPublic(foyer) });
}

export async function updateSoldeEpargne(req: Request, res: Response): Promise<void> {
  const input = patchSoldeEpargneSchema.parse(req.body);

  const foyer = await Foyer.findByIdAndUpdate(
    foyerObjectId(req),
    {
      soldeEpargne: {
        montant: input.montant,
        updatedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!foyer) {
    throw new AppError(404, "Foyer introuvable", "NOT_FOUND");
  }

  sendSuccess(res, { foyer: toFoyerPublic(foyer) });
}
