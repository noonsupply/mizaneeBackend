/**
 * Calcule l'épargne mensuelle nécessaire pour atteindre `montant` d'ici `dateCible`.
 */
export function calculerEpargneMensuelle(
  montant: number,
  montantDeja: number,
  dateCible: Date,
  ref: Date = new Date(),
): number {
  const restant = Math.max(0, montant - montantDeja);
  if (restant <= 0) return 0;

  const cible = new Date(dateCible.getFullYear(), dateCible.getMonth(), 1);
  const maintenant = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const mois =
    (cible.getFullYear() - maintenant.getFullYear()) * 12 + (cible.getMonth() - maintenant.getMonth());
  if (mois <= 0) return Number.POSITIVE_INFINITY;
  return Math.ceil(restant / mois);
}

export function parseDateCible(input: string): Date {
  if (/^\d{4}-\d{2}$/.test(input)) {
    const [y, m] = input.split("-").map(Number);
    return new Date(y ?? 2026, (m ?? 1) - 1, 1);
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Date cible invalide");
  }
  return d;
}
