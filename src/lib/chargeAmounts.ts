import { calculerMoyenneMensuelle } from "./calculs";

export function resolveChargeAmounts(input: {
  montant?: number;
  montantParMois?: Record<string, number>;
}): { montant: number; montantParMois: Record<string, number>; montantMensuelMoyen: number } {
  const montantParMois = input.montantParMois ?? {};
  const hasGrid = Object.keys(montantParMois).length > 0;
  const montantMensuelMoyen = hasGrid
    ? calculerMoyenneMensuelle(montantParMois)
    : (input.montant ?? 0);

  return {
    montant: input.montant ?? montantMensuelMoyen,
    montantParMois,
    montantMensuelMoyen,
  };
}
