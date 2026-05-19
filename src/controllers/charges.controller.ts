import type { Request, Response } from "express";

import { logGetAll } from "../lib/debugGetAll";
import {
  assertChargeInFoyer,
  assertMembreInFoyer,
  foyerObjectId,
  paramId,
  parseObjectId,
  requireFoyerId,
} from "../lib/foyerAccess";
import { resolveChargeAmounts } from "../lib/chargeAmounts";
import { sendSuccess } from "../lib/response";
import { AppError } from "../middleware/errorHandler";
import { Charge, toChargePublic } from "../models/Charge";
import { createChargeSchema, updateChargeSchema } from "../validations/charges";

const MEMBRE_POPULATE = "prenom couleur emoji";

export async function getAll(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const all = await Charge.find({ foyerId: foyerObjectId(req) })
    .populate("membreId", MEMBRE_POPULATE)
    .sort({ createdAt: -1 });

  const communes = all.filter((c) => c.membreId == null);
  const personnelles = all.filter((c) => c.membreId != null);

  logGetAll("charges", foyerId, all.length);

  sendSuccess(res, {
    communes: communes.map((c) => toChargePublic(c)),
    personnelles: personnelles.map((c) => toChargePublic(c)),
    charges: all.map((c) => toChargePublic(c)),
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const input = createChargeSchema.parse(req.body);

  if (input.membreId) {
    await assertMembreInFoyer(input.membreId, foyerId);
  }

  const amounts = resolveChargeAmounts({
    montant: input.montant,
    montantParMois: input.montantParMois,
  });

  const estCommune = !input.membreId;
  const charge = await Charge.create({
    label: input.label,
    montant: amounts.montant,
    montantParMois: amounts.montantParMois,
    montantMensuelMoyen: amounts.montantMensuelMoyen,
    categorie: input.categorie,
    type: estCommune ? "COMMUNE" : "PERSONNELLE",
    membreId: input.membreId ? parseObjectId(input.membreId) : null,
    foyerId: foyerObjectId(req),
    actif: input.actif ?? true,
  });

  const populated = estCommune
    ? charge
    : await Charge.findById(charge._id).populate("membreId", MEMBRE_POPULATE);
  sendSuccess(res, { charge: toChargePublic(populated!) }, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  const existing = await assertChargeInFoyer(id, foyerId);
  const input = updateChargeSchema.parse(req.body);

  if (input.membreId) {
    await assertMembreInFoyer(input.membreId, foyerId);
  }

  const currentParMois =
    existing.montantParMois instanceof Map
      ? Object.fromEntries(existing.montantParMois.entries())
      : (existing.montantParMois as Record<string, number>);

  const amounts = resolveChargeAmounts({
    montant: input.montant ?? existing.montant,
    montantParMois: input.montantParMois ?? currentParMois,
  });

  const nextMembreId =
    input.membreId !== undefined
      ? input.membreId
        ? parseObjectId(input.membreId)
        : null
      : existing.membreId;
  const estCommune = nextMembreId == null;

  const charge = await Charge.findByIdAndUpdate(
    id,
    {
      ...(input.label !== undefined && { label: input.label }),
      montant: amounts.montant,
      montantParMois: amounts.montantParMois,
      montantMensuelMoyen: amounts.montantMensuelMoyen,
      ...(input.categorie !== undefined && { categorie: input.categorie }),
      type: estCommune ? "COMMUNE" : "PERSONNELLE",
      ...(input.membreId !== undefined && { membreId: nextMembreId }),
      ...(input.actif !== undefined && { actif: input.actif }),
    },
    { new: true },
  );

  if (!charge) {
    throw new AppError(404, "Charge introuvable", "NOT_FOUND");
  }

  const populated = estCommune
    ? charge
    : await Charge.findById(charge._id).populate("membreId", MEMBRE_POPULATE);

  sendSuccess(res, { charge: toChargePublic(populated!) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  await assertChargeInFoyer(id, foyerId);
  await Charge.findByIdAndDelete(id);
  sendSuccess(res, { deleted: true });
}
