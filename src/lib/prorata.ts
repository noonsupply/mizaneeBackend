import type { ClientSession } from "mongoose";

import { calculerProrata } from "./calculs";
import { Membre } from "../models/Membre";
import { Revenu } from "../models/Revenu";

export async function recalculateProrataForFoyer(
  foyerId: string,
  session?: ClientSession,
): Promise<void> {
  const membres = await Membre.find({ foyerId, actif: true }).session(session ?? null);
  if (membres.length === 0) return;

  const membreIds = membres.map((m) => m._id);
  const revenus = await Revenu.find({
    foyerId,
    membreId: { $in: membreIds },
    actif: true,
  }).session(session ?? null);

  const revenusParMembre: Record<string, number> = {};
  for (const m of membres) {
    revenusParMembre[m._id.toString()] = 0;
  }
  for (const r of revenus) {
    if (r.membreId == null) continue;
    const id = r.membreId.toString();
    revenusParMembre[id] = (revenusParMembre[id] ?? 0) + r.montant;
  }

  const membreIdsActifs = membres.map((m) => m._id.toString());
  const proratas = calculerProrata(revenusParMembre, membreIdsActifs);
  await Promise.all(
    membres.map((m) =>
      Membre.updateOne({ _id: m._id }, { prorata: proratas[m._id.toString()] ?? 0 }).session(
        session ?? null,
      ),
    ),
  );
}
