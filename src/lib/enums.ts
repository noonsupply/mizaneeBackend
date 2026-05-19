export const REVENU_TYPES = ["SALAIRE", "LOCATIF", "FREELANCE", "AUTRE"] as const;
export type RevenuType = (typeof REVENU_TYPES)[number];

export const CHARGE_TYPES = ["COMMUNE", "PERSONNELLE"] as const;
export type ChargeType = (typeof CHARGE_TYPES)[number];

export const CHARGE_CATEGORIES = [
  "LOGEMENT",
  "ALIMENTATION",
  "TRANSPORT",
  "EDUCATION",
  "LOISIRS",
  "SANTE",
  "ABONNEMENTS",
  "AUTRE",
] as const;
export type ChargeCategorie = (typeof CHARGE_CATEGORIES)[number];

export const PROJET_STATUTS = ["EN_COURS", "ATTEINT", "REPORTE", "ABANDONNE"] as const;
export type ProjetStatut = (typeof PROJET_STATUTS)[number];

export const SCENARIO_MODIFICATION_TYPES = [
  "SALAIRE",
  "CHARGE_NOUVELLE",
  "CHARGE_SUPPRIMEE",
  "CONGE",
] as const;
export type ScenarioModificationType = (typeof SCENARIO_MODIFICATION_TYPES)[number];
