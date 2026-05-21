import type { Request, Response } from "express";
import mongoose from "mongoose";

import { logGetAll } from "../lib/debugGetAll";
import {
  assertMembreInFoyer,
  assertRevenuInFoyer,
  foyerObjectId,
  paramId,
  parseObjectId,
  requireFoyerId,
} from "../lib/foyerAccess";
import { recalculateProrataForFoyer } from "../lib/prorata";
import { resolveRevenuMontant } from "../lib/revenuAmounts";
import { sendSuccess } from "../lib/response";
import { AppError } from "../middleware/errorHandler";
import { Membre } from "../models/Membre";
import { Revenu, toRevenuPublic } from "../models/Revenu";
import { createRevenuSchema, updateRevenuSchema } from "../validations/revenus";

const MEMBRE_POPULATE = "prenom couleur emoji";

async function findRevenusForFoyer(foyerOid: mongoose.Types.ObjectId) {
  const membreIds = await Membre.find({ foyerId: foyerOid }).distinct("_id");
  return Revenu.find({
    $or: [{ foyerId: foyerOid }, { membreId: { $in: membreIds }, foyerId: { $exists: false } }],
  })
    .populate("membreId", MEMBRE_POPULATE)
    .sort({ createdAt: -1 });
}

export async function getAll(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const foyerOid = foyerObjectId(req);
  const all = await findRevenusForFoyer(foyerOid);

  const communes = all.filter((r) => r.membreId == null);
  const personnelles = all.filter((r) => r.membreId != null);

  logGetAll("revenus", foyerId, all.length);

  sendSuccess(res, {
    communes: communes.map((r) => toRevenuPublic(r)),
    personnelles: personnelles.map((r) => toRevenuPublic(r)),
    revenus: all.map((r) => toRevenuPublic(r)),
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const input = createRevenuSchema.parse(req.body);
  const estCommune = !input.membreId;

  if (input.membreId) {
    await assertMembreInFoyer(input.membreId, foyerId);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [revenu] = await Revenu.create(
      [
        {
          label: input.label,
          montant: input.montant,
          type: input.type,
          membreId: input.membreId ? parseObjectId(input.membreId) : null,
          foyerId: foyerObjectId(req),
          actif: input.actif ?? true,
          montantParMois: input.montantParMois ?? {},
          verseLe: input.verseLe ?? null,
          certitude: input.certitude ?? null,
        },
      ],
      { session },
    );

    if (!estCommune) {
      await recalculateProrataForFoyer(foyerId, session);
    }

    await session.commitTransaction();

    const populated = estCommune
      ? revenu!
      : await Revenu.findById(revenu!._id).populate("membreId", MEMBRE_POPULATE);
    sendSuccess(res, { revenu: toRevenuPublic(populated!) }, 201);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    void session.endSession();
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  const existing = await assertRevenuInFoyer(id, foyerId);
  const input = updateRevenuSchema.parse(req.body);

  if (input.membreId) {
    await assertMembreInFoyer(input.membreId, foyerId);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const nextMembreId =
      input.membreId !== undefined
        ? input.membreId
          ? parseObjectId(input.membreId)
          : null
        : existing.membreId;

    const montant =
      input.montant !== undefined
        ? resolveRevenuMontant({ montant: input.montant, montantParMois: input.montantParMois })
        : input.montantParMois !== undefined
          ? resolveRevenuMontant({
              montant: existing.montant,
              montantParMois: input.montantParMois,
            })
          : undefined;

    const revenu = await Revenu.findByIdAndUpdate(
      id,
      {
        ...(input.label !== undefined && { label: input.label }),
        ...(montant !== undefined && { montant }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.membreId !== undefined && { membreId: nextMembreId }),
        ...(input.actif !== undefined && { actif: input.actif }),
        ...(input.montantParMois !== undefined && { montantParMois: input.montantParMois }),
        ...(input.verseLe !== undefined && { verseLe: input.verseLe }),
        ...(input.certitude !== undefined && { certitude: input.certitude }),
        foyerId: foyerObjectId(req),
      },
      { new: true, session },
    );

    if (!revenu) {
      throw new AppError(404, "Revenu introuvable", "NOT_FOUND");
    }

    const affectsProrata =
      revenu.membreId != null &&
      (montant !== undefined ||
        input.actif !== undefined ||
        input.membreId !== undefined ||
        input.montantParMois !== undefined);
    if (affectsProrata) {
      await recalculateProrataForFoyer(foyerId, session);
    }

    await session.commitTransaction();

    const populated =
      revenu.membreId == null
        ? revenu
        : await Revenu.findById(revenu._id).populate("membreId", MEMBRE_POPULATE);
    sendSuccess(res, { revenu: toRevenuPublic(populated!) });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    void session.endSession();
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  const existing = await assertRevenuInFoyer(id, foyerId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Revenu.findByIdAndDelete(id, { session });
    if (existing.membreId != null) {
      await recalculateProrataForFoyer(foyerId, session);
    }
    await session.commitTransaction();
    sendSuccess(res, { deleted: true });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    void session.endSession();
  }
}
