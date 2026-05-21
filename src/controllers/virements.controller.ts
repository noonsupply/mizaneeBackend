import type { Request, Response } from "express";

import {
  assertMembreInFoyer,
  foyerObjectId,
  paramId,
  parseObjectId,
  requireFoyerId,
} from "../lib/foyerAccess";
import { sendSuccess } from "../lib/response";
import { buildResumeCommun, soldesCumulesParMembre } from "../lib/virementsCommun";
import { AppError } from "../middleware/errorHandler";
import { Membre } from "../models/Membre";
import { VirementInterne, toVirementPublic } from "../models/VirementInterne";
import {
  createVirementSchema,
  moisQuerySchema,
  updateVirementSchema,
} from "../validations/virement.validation";

const MEMBRE_POPULATE = "prenom couleur emoji";

function moisCourant(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getAll(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const query = moisQuerySchema.parse({ mois: req.query.mois as string | undefined });
  const mois = query.mois ?? moisCourant();

  console.log("[virements.getAll]", { foyerId, mois });

  const [virements, soldesMap] = await Promise.all([
    VirementInterne.find({ foyerId: foyerObjectId(req), mois }).populate("membreId", MEMBRE_POPULATE),
    soldesCumulesParMembre(foyerId),
  ]);

  const soldesParMembre = Object.fromEntries(soldesMap);

  sendSuccess(res, {
    mois,
    virements: virements.map((v) => toVirementPublic(v)),
    soldesParMembre,
  });
}

export async function getSoldesCumules(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);

  console.log("[virements.getSoldesCumules]", { foyerId });

  const [membres, allVirements, soldesMap] = await Promise.all([
    Membre.find({ foyerId: foyerObjectId(req), actif: true }).sort({ createdAt: 1 }),
    VirementInterne.find({ foyerId: foyerObjectId(req) }).sort({ mois: 1 }),
    soldesCumulesParMembre(foyerId),
  ]);

  const historiqueByMembre = new Map<
    string,
    Array<{ mois: string; montant: number; montantAttendu: number; ecart: number }>
  >();

  for (const v of allVirements) {
    const mid = v.membreId.toString();
    const list = historiqueByMembre.get(mid) ?? [];
    list.push({
      mois: v.mois,
      montant: v.montant,
      montantAttendu: v.montantAttendu,
      ecart: v.ecart,
    });
    historiqueByMembre.set(mid, list);
  }

  const soldes = membres.map((m) => {
    const id = m._id.toString();
    return {
      membreId: id,
      prenom: m.prenom,
      couleur: m.couleur,
      soldeCumule: soldesMap.get(id) ?? 0,
      historique: historiqueByMembre.get(id) ?? [],
    };
  });

  sendSuccess(res, { soldes });
}

export async function getResumeCommun(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const query = moisQuerySchema.parse({ mois: req.query.mois as string | undefined });
  const mois = query.mois ?? moisCourant();

  console.log("[virements.getResumeCommun]", { foyerId, mois });

  const data = await buildResumeCommun(foyerId, mois);
  sendSuccess(res, data);
}

export async function create(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const input = createVirementSchema.parse(req.body);
  await assertMembreInFoyer(input.membreId, foyerId);

  console.log("[virements.create]", { foyerId, ...input });

  const ecart = input.montant - input.montantAttendu;

  const doc = await VirementInterne.findOneAndUpdate(
    {
      foyerId: foyerObjectId(req),
      membreId: parseObjectId(input.membreId),
      mois: input.mois,
    },
    {
      $set: {
        montant: input.montant,
        montantAttendu: input.montantAttendu,
        ecart,
        note: input.note ?? null,
      },
      $setOnInsert: {
        foyerId: foyerObjectId(req),
        membreId: parseObjectId(input.membreId),
        mois: input.mois,
      },
    },
    { upsert: true, new: true, runValidators: true },
  ).populate("membreId", MEMBRE_POPULATE);

  sendSuccess(res, { virement: toVirementPublic(doc!) }, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  const input = updateVirementSchema.parse(req.body);

  console.log("[virements.update]", { foyerId, id, input });

  const existing = await VirementInterne.findOne({
    _id: parseObjectId(id),
    foyerId: foyerObjectId(req),
  });

  if (!existing) {
    throw new AppError(404, "Virement introuvable", "NOT_FOUND");
  }

  if (input.montant !== undefined) existing.montant = input.montant;
  if (input.montantAttendu !== undefined) existing.montantAttendu = input.montantAttendu;
  if (input.note !== undefined) existing.note = input.note ?? null;
  await existing.save();

  const populated = await VirementInterne.findById(existing._id).populate("membreId", MEMBRE_POPULATE);
  sendSuccess(res, { virement: toVirementPublic(populated!) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);

  console.log("[virements.remove]", { foyerId, id });

  const deleted = await VirementInterne.findOneAndDelete({
    _id: parseObjectId(id),
    foyerId: foyerObjectId(req),
  });

  if (!deleted) {
    throw new AppError(404, "Virement introuvable", "NOT_FOUND");
  }

  sendSuccess(res, { deleted: true });
}
