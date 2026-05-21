import type { ChargeDocument } from "../models/Charge";
import { Charge } from "../models/Charge";
import { Membre } from "../models/Membre";
import { VirementInterne } from "../models/VirementInterne";
import { parseObjectId } from "./foyerAccess";

export type StatutVirement = "ok" | "dette" | "avance";

export function moisNumFromYm(mois: string): string {
  return mois.slice(5, 7);
}

export function montantChargePourMois(
  charge: Pick<ChargeDocument, "montantParMois" | "montantMensuelMoyen" | "actif">,
  mois: string,
): number {
  if (!charge.actif) return 0;
  const key = moisNumFromYm(mois);
  const grid =
    charge.montantParMois instanceof Map
      ? Object.fromEntries(charge.montantParMois.entries())
      : (charge.montantParMois as Record<string, number>);
  if (grid[key] != null) return grid[key]!;
  return charge.montantMensuelMoyen;
}

export async function totalChargesCommunesMois(foyerId: string, mois: string): Promise<number> {
  const charges = await Charge.find({
    foyerId: parseObjectId(foyerId),
    membreId: null,
    actif: true,
  });
  return Math.round(charges.reduce((s, c) => s + montantChargePourMois(c, mois), 0));
}

export function statutDepuisEcart(ecart: number, tolerance = 0): StatutVirement {
  if (ecart < -tolerance) return "dette";
  if (ecart > tolerance) return "avance";
  return "ok";
}

export async function soldesCumulesParMembre(foyerId: string) {
  const rows = await VirementInterne.aggregate<{ _id: string; soldeCumule: number }>([
    { $match: { foyerId: parseObjectId(foyerId) } },
    { $group: { _id: "$membreId", soldeCumule: { $sum: "$ecart" } } },
  ]);
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r._id.toString(), Math.round(r.soldeCumule));
  }
  return map;
}

export async function buildResumeCommun(foyerId: string, mois: string) {
  const foyerOid = parseObjectId(foyerId);
  const [membres, totalChargesCommunes, virementsMois, soldesMap] = await Promise.all([
    Membre.find({ foyerId: foyerOid, actif: true }).sort({ createdAt: 1 }),
    totalChargesCommunesMois(foyerId, mois),
    VirementInterne.find({ foyerId: foyerOid, mois }).populate("membreId", "prenom couleur"),
    soldesCumulesParMembre(foyerId),
  ]);

  const virementParMembre = new Map(
    virementsMois.map((v) => {
      const mid =
        v.membreId && typeof v.membreId === "object" && "_id" in v.membreId
          ? (v.membreId as { _id: { toString(): string } })._id.toString()
          : v.membreId.toString();
      return [mid, v] as const;
    }),
  );

  const membresResume = membres.map((m) => {
    const id = m._id.toString();
    const montantAttendu = Math.round((totalChargesCommunes * m.prorata) / 100);
    const virement = virementParMembre.get(id);
    const montantVire = virement?.montant ?? 0;
    const ecart = virement?.ecart ?? montantVire - montantAttendu;
    const soldeCumule = soldesMap.get(id) ?? 0;

    return {
      membreId: id,
      prenom: m.prenom,
      couleur: m.couleur,
      montantAttendu,
      montantVire,
      ecart,
      soldeCumule,
      statut: statutDepuisEcart(ecart),
    };
  });

  const totalVire = Math.round(membresResume.reduce((s, m) => s + m.montantVire, 0));
  const manque = Math.round(totalVire - totalChargesCommunes);

  return {
    mois,
    totalChargesCommunes,
    membres: membresResume,
    totalVire,
    manque,
  };
}
