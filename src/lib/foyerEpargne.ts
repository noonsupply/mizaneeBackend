import {
  calculerEcartEpargne,
  calculerSoldeAttendu,
  type ProjetPourCalculEpargne,
  projeterSolde,
} from "./calculs";
import { getFoyerSoldeEpargneMontant } from "./foyerAccess";
import { Projet, type ProjetDocument } from "../models/Projet";

export function mapProjetPourCalcul(
  p: Pick<ProjetDocument, "label" | "montant" | "dateCible" | "statut">,
): ProjetPourCalculEpargne {
  return {
    label: p.label,
    montant: p.montant,
    dateCible: p.dateCible,
    statut: p.statut,
  };
}

export async function chargerProjetsPourCalcul(foyerId: string): Promise<ProjetPourCalculEpargne[]> {
  const projets = await Projet.find({ foyerId }).select("label montant dateCible statut").lean();
  return projets.map((p) =>
    mapProjetPourCalcul({
      label: p.label,
      montant: p.montant,
      dateCible: p.dateCible,
      statut: p.statut,
    }),
  );
}

export async function calculerIndicateursEpargne(
  foyerId: string,
  dateDebutEpargne: Date,
  dateRef = new Date(),
) {
  const [soldeReel, projets] = await Promise.all([
    getFoyerSoldeEpargneMontant(foyerId),
    chargerProjetsPourCalcul(foyerId),
  ]);

  const epargneMensuelle = (
    await Projet.find({ foyerId, statut: "EN_COURS" }).select("epargneMensuelle").lean()
  ).reduce((s, p) => s + p.epargneMensuelle, 0);

  const soldeAttendu = calculerSoldeAttendu(projets, dateDebutEpargne, dateRef);
  const ecart = calculerEcartEpargne(soldeReel, soldeAttendu);
  const projection = projeterSolde(projets, soldeReel, epargneMensuelle, 24, dateRef);

  return {
    soldeReel,
    soldeAttendu,
    epargneMensuelle,
    ...ecart,
    projection,
  };
}
