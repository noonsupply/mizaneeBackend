import { Router } from "express";

import * as virementsController from "../controllers/virements.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/authenticate";
import { requireFoyer } from "../middleware/requireFoyer";

export const virementsRouter = Router();

virementsRouter.use(authenticate, requireFoyer);

virementsRouter.get("/", asyncHandler(virementsController.getAll));
virementsRouter.get("/soldes", asyncHandler(virementsController.getSoldesCumules));
virementsRouter.get("/resume-commun", asyncHandler(virementsController.getResumeCommun));
virementsRouter.post("/", asyncHandler(virementsController.create));
virementsRouter.patch("/:id", asyncHandler(virementsController.update));
virementsRouter.delete("/:id", asyncHandler(virementsController.remove));
