import type { ScenarioModificationType } from "./enums";

/** Moyenne mensuelle : somme des montants saisis / 12. */
export function calculerMoyenneMensuelle(montantParMois: Record<string, number>): number {
  const sum = Object.values(montantParMois).reduce(
    (acc, v) => acc + (Number.isFinite(v) ? v : 0),
    0,
  );
  return Math.round((sum / 12) * 100) / 100;
}

/** Mois calendaires entre deux dates (1er jour de chaque mois). */
export function moisRestantsVers(dateCible: Date, depuis: Date = new Date()): number {
  const d0 = new Date(depuis.getFullYear(), depuis.getMonth(), 1);
  const d1 = new Date(dateCible.getFullYear(), dateCible.getMonth(), 1);
  const m =
    (d1.getFullYear() - d0.getFullYear()) * 12 + (d1.getMonth() - d0.getMonth());
  return Math.max(0, m);
}

export function calculerEpargneMensuelle(montant: number, dateCible: Date, depuis = new Date()): number {
  const mois = moisRestantsVers(dateCible, depuis);
  if (mois <= 0) return montant > 0 ? montant : 0;
  return Math.ceil(montant / mois);
}

/**
 * Répartition prorata — uniquement les membres réels actifs (ids fournis).
 * Les revenus communs (membreId null) ne participent pas à ce calcul.
 */
export function calculerProrata(
  revenusParMembre: Record<string, number>,
  membreIdsActifs: string[],
): Record<string, number> {
  const filtered: Record<string, number> = {};
  for (const id of membreIdsActifs) {
    filtered[id] = revenusParMembre[id] ?? 0;
  }
  const total = Object.values(filtered).reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  for (const membreId of membreIdsActifs) {
    const rev = filtered[membreId] ?? 0;
    out[membreId] = total > 0 ? Math.round((rev / total) * 1000) / 10 : 0;
  }
  return out;
}

export interface ProjectionMois {
  mois: string;
  revenus: number;
  chargesCommunes: number;
  chargesPerso: Record<string, number>;
  epargne: number;
  soldeNet: number;
  soldeCumule: number;
}

export interface ScenarioModification {
  membreId: string;
  type: ScenarioModificationType;
  valeur: number;
  debut: Date;
  fin: Date;
}

export interface SimulationInput {
  modifications: ScenarioModification[];
}

export interface FoyerSnapshot {
  revenusParMembre: Record<string, number>;
  chargesCommunes: number;
  chargesPersoParMembre: Record<string, number>;
  epargneMensuelle: number;
  /** Solde réel du compte épargne (foyer.soldeEpargne.montant) */
  soldeEpargneMontant: number;
}

export interface ProjetPourCalculEpargne {
  label: string;
  montant: number;
  dateCible: Date;
  statut: string;
}

export interface PointSoldeEpargne {
  mois: string;
  solde: number;
  decaissement: number;
  projetsDecaisses: string[];
}

function premierJourMois(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function nbMoisCalendaires(debut: Date, fin: Date): number {
  return Math.max(
    0,
    (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth()),
  );
}

function moisCleDepuisDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function labelMoisCourt(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function estProjetEnCours(statut: string): boolean {
  return statut === "EN_COURS" || statut === "en_cours";
}

/**
 * Solde théorique attendu : progression linéaire des projets actifs depuis `dateDebut`.
 * À comparer avec `soldeEpargne.montant` (solde réel).
 */
export function calculerSoldeAttendu(
  projets: ProjetPourCalculEpargne[],
  dateDebut: Date,
  dateRef: Date = new Date(),
): number {
  const debut = premierJourMois(dateDebut);
  const ref = premierJourMois(dateRef);
  let sum = 0;

  for (const p of projets) {
    if (!estProjetEnCours(p.statut)) continue;
    const fin = premierJourMois(p.dateCible);
    const total = nbMoisCalendaires(debut, fin);
    if (total <= 0) continue;
    const elapsed = Math.min(nbMoisCalendaires(debut, ref), total);
    const ratio = Math.min(1, elapsed / total);
    sum += ratio * p.montant;
  }

  return Math.round(sum);
}

/**
 * Écart entre le solde réel (`soldeEpargne.montant`) et le solde attendu.
 */
export function calculerEcartEpargne(
  soldeReel: number,
  soldeAttendu: number,
): { ecart: number; statut: "avance" | "ok" | "retard" } {
  const ecart = Math.round(soldeReel - soldeAttendu);
  const tol = 25;
  if (ecart > tol) return { ecart, statut: "avance" };
  if (ecart < -tol) return { ecart, statut: "retard" };
  return { ecart, statut: "ok" };
}

/**
 * Projection du solde cumulé épargne : part de `soldeInitial` (= soldeEpargne.montant).
 */
export function projeterSolde(
  projets: ProjetPourCalculEpargne[],
  soldeInitial: number,
  epargneMensuelle: number,
  nbMois = 24,
  dateRef: Date = new Date(),
): PointSoldeEpargne[] {
  const actifs = projets.filter((p) => estProjetEnCours(p.statut));
  const points: PointSoldeEpargne[] = [];
  let cumul = soldeInitial;

  for (let i = 0; i < nbMois; i += 1) {
    const d = new Date(dateRef.getFullYear(), dateRef.getMonth() + i, 1);
    const cle = moisCleDepuisDate(d);
    let decaissement = 0;
    const projetsDecaisses: string[] = [];

    for (const p of actifs) {
      if (moisCleDepuisDate(premierJourMois(p.dateCible)) === cle) {
        decaissement += p.montant;
        projetsDecaisses.push(p.label);
      }
    }

    cumul += epargneMensuelle - decaissement;
    points.push({
      mois: labelMoisCourt(d),
      solde: Math.round(cumul),
      decaissement,
      projetsDecaisses,
    });
  }

  return points;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthInRange(date: Date, debut: Date, fin: Date): boolean {
  const t = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const d0 = new Date(debut.getFullYear(), debut.getMonth(), 1).getTime();
  const d1 = new Date(fin.getFullYear(), fin.getMonth(), 1).getTime();
  return t >= d0 && t <= d1;
}

function applyScenarioToSnapshot(
  base: FoyerSnapshot,
  modifications: ScenarioModification[],
  monthDate: Date,
): FoyerSnapshot {
  const snap: FoyerSnapshot = {
    revenusParMembre: { ...base.revenusParMembre },
    chargesCommunes: base.chargesCommunes,
    chargesPersoParMembre: { ...base.chargesPersoParMembre },
    epargneMensuelle: base.epargneMensuelle,
    soldeEpargneMontant: base.soldeEpargneMontant,
  };

  for (const mod of modifications) {
    if (!monthInRange(monthDate, mod.debut, mod.fin)) continue;
    switch (mod.type) {
      case "SALAIRE":
        snap.revenusParMembre[mod.membreId] =
          (snap.revenusParMembre[mod.membreId] ?? 0) + mod.valeur;
        break;
      case "CONGE":
        snap.revenusParMembre[mod.membreId] = mod.valeur;
        break;
      case "CHARGE_NOUVELLE":
        snap.chargesPersoParMembre[mod.membreId] =
          (snap.chargesPersoParMembre[mod.membreId] ?? 0) + mod.valeur;
        break;
      case "CHARGE_SUPPRIMEE":
        snap.chargesCommunes = Math.max(0, snap.chargesCommunes - mod.valeur);
        break;
      default:
        break;
    }
  }
  return snap;
}

/** Projection du solde net mensuel (simulations what-if). */
export function projeterSoldeNet(
  base: FoyerSnapshot,
  scenario: SimulationInput,
  mois = 12,
  dateRef = new Date(),
): ProjectionMois[] {
  const rows: ProjectionMois[] = [];
  let cumul = 0;

  for (let i = 0; i < mois; i += 1) {
    const d = new Date(dateRef.getFullYear(), dateRef.getMonth() + i, 1);
    const snap = applyScenarioToSnapshot(base, scenario.modifications, d);
    const revenus = Object.values(snap.revenusParMembre).reduce((a, b) => a + b, 0);
    const chargesPerso = Object.values(snap.chargesPersoParMembre).reduce((a, b) => a + b, 0);
    const chargesTotal = snap.chargesCommunes + chargesPerso;
    const soldeNet = Math.round(revenus - chargesTotal - snap.epargneMensuelle);
    cumul += soldeNet;

    rows.push({
      mois: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
      revenus: Math.round(revenus),
      chargesCommunes: Math.round(snap.chargesCommunes),
      chargesPerso: Object.fromEntries(
        Object.entries(snap.chargesPersoParMembre).map(([k, v]) => [k, Math.round(v)]),
      ),
      epargne: Math.round(snap.epargneMensuelle),
      soldeNet,
      soldeCumule: Math.round(cumul),
    });
  }

  return rows;
}
