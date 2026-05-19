import type { Request, Response } from "express";

import { projeterSoldeNet } from "../lib/calculs";
import { buildFoyerSnapshot } from "../lib/foyerSnapshot";
import { logGetAll } from "../lib/debugGetAll";
import {
  assertSimulationInFoyer,
  foyerObjectId,
  paramId,
  parseObjectId,
  requireFoyerId,
} from "../lib/foyerAccess";
import { sendSuccess } from "../lib/response";
import { AppError } from "../middleware/errorHandler";
import { Simulation, toSimulationPublic } from "../models/Simulation";
import { saveSimulationSchema, scenarioSchema } from "../validations/simulations";

export async function run(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const scenario = scenarioSchema.parse(req.body);

  const snapshot = await buildFoyerSnapshot(foyerId);
  const projection = projeterSoldeNet(snapshot, scenario);

  sendSuccess(res, { projection, scenario });
}

export async function save(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  if (!req.userId) {
    throw new AppError(401, "Authentification requise", "UNAUTHORIZED");
  }

  const input = saveSimulationSchema.parse(req.body);

  const simulation = await Simulation.create({
    label: input.label,
    payload: input.scenario,
    foyerId: foyerObjectId(req),
    userId: parseObjectId(req.userId),
  });

  sendSuccess(res, { simulation: toSimulationPublic(simulation) }, 201);
}

export async function getAll(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const simulations = await Simulation.find({ foyerId: foyerObjectId(req) }).sort({ createdAt: -1 });
  logGetAll("simulations", foyerId, simulations.length);
  sendSuccess(res, { simulations: simulations.map(toSimulationPublic) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const foyerId = requireFoyerId(req);
  const id = paramId(req.params.id);
  await assertSimulationInFoyer(id, foyerId);
  await Simulation.findByIdAndDelete(id);
  sendSuccess(res, { deleted: true });
}
