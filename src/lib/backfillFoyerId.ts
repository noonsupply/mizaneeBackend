import mongoose from "mongoose";

import { Charge } from "../models/Charge";
import { Membre } from "../models/Membre";
import { Revenu } from "../models/Revenu";

/**
 * Renseigne `foyerId` sur les revenus/charges créés avant l’ajout du champ obligatoire.
 * Les revenus personnels héritent du foyer de leur membre.
 */
export async function backfillFoyerIdOnLegacyDocuments(): Promise<void> {
  const membres = await Membre.find({}).select("_id foyerId").lean();
  const foyerByMembre = new Map<string, mongoose.Types.ObjectId>();
  for (const m of membres) {
    foyerByMembre.set(m._id.toString(), m.foyerId);
  }

  const revenusSansFoyer = await Revenu.find({
    $or: [{ foyerId: { $exists: false } }, { foyerId: null }],
  }).select("_id membreId foyerId");

  let revenusUpdated = 0;
  for (const r of revenusSansFoyer) {
    if (!r.membreId) continue;
    const foyerId = foyerByMembre.get(r.membreId.toString());
    if (!foyerId) continue;
    const res = await Revenu.updateOne(
      { _id: r._id, $or: [{ foyerId: { $exists: false } }, { foyerId: null }] },
      { $set: { foyerId } },
    );
    revenusUpdated += res.modifiedCount;
  }

  const chargesSansFoyer = await Charge.find({
    $or: [{ foyerId: { $exists: false } }, { foyerId: null }],
  }).select("_id membreId");

  let chargesUpdated = 0;
  for (const c of chargesSansFoyer) {
    if (!c.membreId) continue;
    const foyerId = foyerByMembre.get(c.membreId.toString());
    if (!foyerId) continue;
    await Charge.updateOne({ _id: c._id }, { $set: { foyerId } });
    chargesUpdated += 1;
  }

  if (revenusUpdated > 0 || chargesUpdated > 0) {
    console.log(
      `Migration foyerId : ${revenusUpdated} revenu(s), ${chargesUpdated} charge(s) mis à jour`,
    );
  }
}
