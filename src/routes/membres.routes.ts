import { Router } from "express";

import * as membresController from "../controllers/membres.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/authenticate";
import { requireFoyer } from "../middleware/requireFoyer";

export const membresRouter = Router();

membresRouter.use(authenticate, requireFoyer);

membresRouter.get("/", asyncHandler(membresController.getAll));
membresRouter.post("/", asyncHandler(membresController.create));
membresRouter.patch("/:id", asyncHandler(membresController.update));
membresRouter.delete("/:id", asyncHandler(membresController.softDelete));
membresRouter.delete("/:id/permanent", asyncHandler(membresController.hardDelete));
