import { Router } from "express";

import * as foyerController from "../controllers/foyer.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/authenticate";
import { requireFoyer } from "../middleware/requireFoyer";

export const foyerRouter = Router();

foyerRouter.use(authenticate, requireFoyer);

foyerRouter.get("/", asyncHandler(foyerController.getOne));
foyerRouter.patch("/", asyncHandler(foyerController.update));
foyerRouter.patch("/solde-epargne", asyncHandler(foyerController.updateSoldeEpargne));
