import { calculerMoyenneMensuelle } from "./calculs";

export function resolveRevenuMontant(input: {
  montant?: number;
  montantParMois?: Record<string, number>;
}): number {
  if (input.montant !== undefined) return input.montant;
  if (input.montantParMois && Object.keys(input.montantParMois).length > 0) {
    return calculerMoyenneMensuelle(input.montantParMois);
  }
  return 0;
}
