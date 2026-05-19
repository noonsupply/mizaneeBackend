import { z } from "zod";

import { SCENARIO_MODIFICATION_TYPES } from "../lib/enums";

export const scenarioSchema = z.object({
  label: z.string().max(200).optional(),
  modifications: z.array(
    z.object({
      membreId: z.string().min(1),
      type: z.enum(SCENARIO_MODIFICATION_TYPES),
      valeur: z.number().finite(),
      debut: z.coerce.date(),
      fin: z.coerce.date(),
    }),
  ),
});

export const saveSimulationSchema = z.object({
  label: z.string().trim().min(1).max(200),
  scenario: scenarioSchema,
});
