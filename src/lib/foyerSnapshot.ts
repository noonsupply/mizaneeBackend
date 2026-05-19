import type { FoyerSnapshot } from "./calculs";
import { getFoyerSoldeEpargneMontant } from "./foyerAccess";
import { Charge } from "../models/Charge";
import { Membre } from "../models/Membre";
import { Projet } from "../models/Projet";
import { Revenu } from "../models/Revenu";

export async function buildFoyerSnapshot(foyerId: string): Promise<FoyerSnapshot> {
  const soldeEpargneMontant = await getFoyerSoldeEpargneMontant(foyerId);
  const membres = await Membre.find({ foyerId, actif: true }).select("_id");
  const membreIds = membres.map((m) => m._id);

  const revenus = await Revenu.find({
    foyerId,
    actif: true,
    membreId: { $in: membreIds },
  });
  const revenusParMembre: Record<string, number> = {};
  for (const m of membres) {
    revenusParMembre[m._id.toString()] = 0;
  }
  for (const r of revenus) {
    if (r.membreId == null) continue;
    const id = r.membreId.toString();
    revenusParMembre[id] = (revenusParMembre[id] ?? 0) + r.montant;
  }

  const charges = await Charge.find({ foyerId, actif: true });
  let chargesCommunes = 0;
  const chargesPersoParMembre: Record<string, number> = {};
  for (const c of charges) {
    const amount = c.montantMensuelMoyen;
    if (c.membreId == null) {
      chargesCommunes += amount;
    } else {
      const mid = c.membreId.toString();
      chargesPersoParMembre[mid] = (chargesPersoParMembre[mid] ?? 0) + amount;
    }
  }

  const projets = await Projet.find({ foyerId, statut: "EN_COURS" });
  const epargneMensuelle = projets.reduce((s, p) => s + p.epargneMensuelle, 0);

  return {
    revenusParMembre,
    chargesCommunes,
    chargesPersoParMembre,
    epargneMensuelle,
    soldeEpargneMontant,
  };
}
