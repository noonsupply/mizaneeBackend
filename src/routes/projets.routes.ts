import { Router } from "express";

import * as projetsController from "../controllers/projets.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/authenticate";
import { requireFoyer } from "../middleware/requireFoyer";

export const projetsRouter = Router();

projetsRouter.use(authenticate, requireFoyer);

projetsRouter.get("/", asyncHandler(projetsController.getAll));
projetsRouter.post("/", asyncHandler(projetsController.create));
projetsRouter.patch("/reorder", asyncHandler(projetsController.reorder));
projetsRouter.patch("/:id", asyncHandler(projetsController.update));
projetsRouter.delete("/:id", asyncHandler(projetsController.remove));
