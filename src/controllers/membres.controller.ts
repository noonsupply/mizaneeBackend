import type { Request, Response } from "express";
import mongoose from "mongoose";

import { logGetAll } from "../lib/debugGetAll";
import { assertMembreInFoyer, foyerObjectId, paramId, parseObjectId, requireFoyerId } from "../lib/foyerAccess";
import { recalculateProrataForFoyer } from "../lib/prorata";
import { sendSuccess } from "../lib/response";
import { AppError } from "../middleware/errorHandler";
import { Charge } from "../models/Charge";
import { Membre, toMembrePublic } from "../models/Membre";
import { Projet } from "../models/Projet";
import { Revenu } from "../models/Revenu";
import { User } from "../models/User";
import {
  createMembreSchema,
  hardDeleteMembreSchema,
  updateMembreSchema,
} from "../validations/membres";

export async function getAll(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const membres = await Membre.find({ foyerId: foyerObjectId(req) })
    .populate("userId", "name email image")
    .sort({ createdAt: 1 });
  logGetAll("membres", foyerId, membres.length);
  sendSuccess(res, { membres: membres.map(toMembrePublic) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const input = createMembreSchema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [membre] = await Membre.create(
      [
        {
          foyerId: parseObjectId(foyerId),
          prenom: input.prenom,
          couleur: input.couleur ?? "#378ADD",
          emoji: input.emoji ?? null,
          prorata: input.prorata ?? 0,
        },
      ],
      { session },
    );

    if (input.prorata === undefined) {
      await recalculateProrataForFoyer(foyerId, session);
    }

    await session.commitTransaction();
    const fresh = await Membre.findById(membre!._id);
    sendSuccess(res, { membre: toMembrePublic(fresh!) }, 201);
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
  await assertMembreInFoyer(id, foyerId);
  const input = updateMembreSchema.parse(req.body);

  const membre = await Membre.findByIdAndUpdate(
    id,
    {
      ...(input.prenom !== undefined && { prenom: input.prenom }),
      ...(input.couleur !== undefined && { couleur: input.couleur }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
      ...(input.prorata !== undefined && { prorata: input.prorata }),
      ...(input.actif !== undefined && { actif: input.actif }),
    },
    { new: true },
  );

  if (!membre) {
    throw new AppError(404, "Membre introuvable", "NOT_FOUND");
  }

  sendSuccess(res, { membre: toMembrePublic(membre) });
}

export async function softDelete(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  await assertMembreInFoyer(id, foyerId);

  const membre = await Membre.findByIdAndUpdate(id, { actif: false }, { new: true });
  if (!membre) {
    throw new AppError(404, "Membre introuvable", "NOT_FOUND");
  }

  await recalculateProrataForFoyer(foyerId);
  sendSuccess(res, { membre: toMembrePublic(membre) });
}

export async function hardDelete(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  hardDeleteMembreSchema.parse(req.body);
  await assertMembreInFoyer(id, foyerId);

  const membreOid = parseObjectId(id);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Revenu.deleteMany({ membreId: membreOid }, { session });
    await Charge.deleteMany({ membreId: membreOid }, { session });
    await Projet.updateMany(
      { foyerId: parseObjectId(foyerId), membres: membreOid },
      { $pull: { membres: membreOid } },
      { session },
    );
    await User.updateMany({ membreId: membreOid }, { $set: { membreId: null } }, { session });
    await Membre.findByIdAndDelete(id, { session });
    await recalculateProrataForFoyer(foyerId, session);
    await session.commitTransaction();
    sendSuccess(res, { deleted: true });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    void session.endSession();
  }
}
