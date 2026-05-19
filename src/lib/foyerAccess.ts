import type { Request } from "express";
import mongoose from "mongoose";

import { AppError } from "../middleware/errorHandler";
import { Charge } from "../models/Charge";
import { Foyer } from "../models/Foyer";
import { Membre } from "../models/Membre";
import { Projet } from "../models/Projet";
import { Revenu } from "../models/Revenu";
import { Simulation } from "../models/Simulation";

export function requireFoyerId(req: Request): string {
  const fromUser = req.user?.foyerId ?? undefined;
  const foyerId = req.foyerId ?? fromUser ?? undefined;
  if (!foyerId) {
    throw new AppError(403, "Aucun foyer associé à ce compte", "NO_FOYER");
  }
  return foyerId;
}

export function foyerObjectId(req: Request): mongoose.Types.ObjectId {
  return parseObjectId(requireFoyerId(req), "foyerId");
}

export function paramId(value: string | string[] | undefined, label = "id"): string {
  if (typeof value === "string" && value.length > 0) return value;
  throw new AppError(400, `${label} requis`, "INVALID_ID");
}

export function parseObjectId(id: string, label = "id"): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, `${label} invalide`, "INVALID_ID");
  }
  return new mongoose.Types.ObjectId(id);
}

export async function assertMembreInFoyer(
  membreId: string,
  foyerId: string,
): Promise<{ _id: mongoose.Types.ObjectId; foyerId: mongoose.Types.ObjectId }> {
  const id = parseObjectId(membreId, "membreId");
  const membre = await Membre.findById(id).select("foyerId").lean();
  if (!membre || membre.foyerId.toString() !== foyerId) {
    throw new AppError(403, "Ce membre n'appartient pas à votre foyer", "FORBIDDEN");
  }
  return membre;
}

export async function assertRevenuInFoyer(revenuId: string, foyerId: string) {
  const id = parseObjectId(revenuId);
  const revenu = await Revenu.findById(id);
  if (!revenu) {
    throw new AppError(404, "Revenu introuvable", "NOT_FOUND");
  }
  if (revenu.foyerId.toString() !== foyerId) {
    throw new AppError(403, "Ce revenu n'appartient pas à votre foyer", "FORBIDDEN");
  }
  if (revenu.membreId != null) {
    const membre = await Membre.findById(revenu.membreId).select("foyerId").lean();
    if (!membre || membre.foyerId.toString() !== foyerId) {
      throw new AppError(403, "Ce revenu n'appartient pas à votre foyer", "FORBIDDEN");
    }
  }
  return revenu;
}

export async function assertChargeInFoyer(chargeId: string, foyerId: string) {
  const id = parseObjectId(chargeId);
  const charge = await Charge.findById(id);
  if (!charge || charge.foyerId.toString() !== foyerId) {
    throw new AppError(403, "Cette charge n'appartient pas à votre foyer", "FORBIDDEN");
  }
  return charge;
}

export async function assertProjetInFoyer(projetId: string, foyerId: string) {
  const id = parseObjectId(projetId);
  const projet = await Projet.findById(id);
  if (!projet || projet.foyerId.toString() !== foyerId) {
    throw new AppError(403, "Ce projet n'appartient pas à votre foyer", "FORBIDDEN");
  }
  return projet;
}

export async function getFoyerSoldeEpargneMontant(foyerId: string): Promise<number> {
  const foyer = await Foyer.findById(parseObjectId(foyerId, "foyerId")).select("soldeEpargne.montant").lean();
  return foyer?.soldeEpargne?.montant ?? 0;
}

export async function assertSimulationInFoyer(simulationId: string, foyerId: string) {
  const id = parseObjectId(simulationId);
  const simulation = await Simulation.findById(id);
  if (!simulation || simulation.foyerId.toString() !== foyerId) {
    throw new AppError(403, "Ce scénario n'appartient pas à votre foyer", "FORBIDDEN");
  }
  return simulation;
}
