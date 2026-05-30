import type { Request, Response } from "express";
import mongoose from "mongoose";

import { calculerEpargneMensuelle } from "../lib/calculs";
import { logGetAll } from "../lib/debugGetAll";
import {
  assertMembreInFoyer,
  assertProjetInFoyer,
  foyerObjectId,
  paramId,
  parseObjectId,
  requireFoyerId,
} from "../lib/foyerAccess";
import { sendSuccess } from "../lib/response";
import { AppError } from "../middleware/errorHandler";
import { Foyer } from "../models/Foyer";
import { Projet, toProjetPublic } from "../models/Projet";
import {
  createProjetSchema,
  reorderProjetsSchema,
  terminerProjetSchema,
  updateProjetSchema,
} from "../validations/projets";

async function resolveMembreIds(membreIds: string[] | undefined, foyerId: string) {
  if (!membreIds?.length) return [];
  const ids: mongoose.Types.ObjectId[] = [];
  for (const mid of membreIds) {
    await assertMembreInFoyer(mid, foyerId);
    ids.push(parseObjectId(mid));
  }
  return ids;
}

export async function getAll(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const projets = await Projet.find({ foyerId: foyerObjectId(req) })
    .populate("membres", "prenom couleur emoji")
    .sort({ priorite: 1, dateCible: 1, createdAt: 1 });
  logGetAll("projets", foyerId, projets.length);
  sendSuccess(res, { projets: projets.map((p) => toProjetPublic(p)) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const input = createProjetSchema.parse(req.body);
  const membreIds = await resolveMembreIds(input.membreIds, foyerId);

  const maxPriorite = await Projet.findOne({ foyerId }).sort({ priorite: -1 }).select("priorite");
  const epargneMensuelle = calculerEpargneMensuelle(input.montant, input.dateCible);

  const projet = await Projet.create({
    label: input.label,
    montant: input.montant,
    dateCible: input.dateCible,
    epargneMensuelle,
    priorite: input.priorite ?? (maxPriorite?.priorite ?? 0) + 1,
    statut: input.statut ?? "EN_COURS",
    couleur: input.couleur ?? "#378ADD",
    emoji: input.emoji ?? null,
    foyerId: foyerObjectId(req),
    membres: membreIds,
  });

  const populated = await Projet.findById(projet._id).populate("membres", "prenom");
  sendSuccess(res, { projet: toProjetPublic(populated!) }, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  const existing = await assertProjetInFoyer(id, foyerId);
  const input = updateProjetSchema.parse(req.body);
  const membreIds =
    input.membreIds !== undefined ? await resolveMembreIds(input.membreIds, foyerId) : undefined;

  const montant = input.montant ?? existing.montant;
  const dateCible = input.dateCible ?? existing.dateCible;
  const dateChanged =
    input.dateCible !== undefined || input.montant !== undefined;
  const epargneMensuelle = dateChanged
    ? calculerEpargneMensuelle(montant, dateCible)
    : existing.epargneMensuelle;

  const projet = await Projet.findByIdAndUpdate(
    id,
    {
      ...(input.label !== undefined && { label: input.label }),
      ...(input.montant !== undefined && { montant: input.montant }),
      ...(input.dateCible !== undefined && { dateCible: input.dateCible }),
      ...(dateChanged && { epargneMensuelle }),
      ...(input.priorite !== undefined && { priorite: input.priorite }),
      ...(input.statut !== undefined && { statut: input.statut }),
      ...(input.couleur !== undefined && { couleur: input.couleur }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
      ...(membreIds !== undefined && { membres: membreIds }),
    },
    { new: true },
  ).populate("membres", "prenom");

  if (!projet) {
    throw new AppError(404, "Projet introuvable", "NOT_FOUND");
  }

  sendSuccess(res, { projet: toProjetPublic(projet) });
}

export async function terminer(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  const existing = await assertProjetInFoyer(id, foyerId);
  const { dateDepense } = terminerProjetSchema.parse(req.body);
  const moisDepense = dateDepense ?? new Date().toISOString().slice(0, 7);

  const projet = await Projet.findByIdAndUpdate(
    id,
    { statut: "ATTEINT", dateDepense: moisDepense },
    { new: true },
  ).populate("membres", "prenom");

  if (!projet) {
    throw new AppError(404, "Projet introuvable", "NOT_FOUND");
  }

  const foyer = await Foyer.findById(foyerId);
  if (!foyer) {
    throw new AppError(404, "Foyer introuvable", "NOT_FOUND");
  }

  const ancienSolde = foyer.soldeEpargne?.montant ?? 0;
  const nouveauSolde = Math.max(0, ancienSolde - existing.montant);
  foyer.soldeEpargne = { montant: nouveauSolde, updatedAt: new Date() };
  await foyer.save();

  sendSuccess(res, { projet: toProjetPublic(projet), nouveauSoldeEpargne: nouveauSolde });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  await assertProjetInFoyer(id, foyerId);
  await Projet.findByIdAndDelete(id);
  sendSuccess(res, { deleted: true });
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const { items } = reorderProjetsSchema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of items) {
      await assertProjetInFoyer(item.id, foyerId);
      await Projet.updateOne({ _id: item.id }, { priorite: item.priorite }, { session });
    }
    await session.commitTransaction();

    const projets = await Projet.find({ foyerId })
      .populate("membres", "prenom")
      .sort({ priorite: 1 });
    sendSuccess(res, { projets: projets.map((p) => toProjetPublic(p)) });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    void session.endSession();
  }
}
