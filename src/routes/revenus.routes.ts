import { Router } from "express";

import * as revenusController from "../controllers/revenus.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/authenticate";
import { requireFoyer } from "../middleware/requireFoyer";

export const revenusRouter = Router();

revenusRouter.use(authenticate, requireFoyer);

revenusRouter.get("/", asyncHandler(revenusController.getAll));
revenusRouter.post("/", asyncHandler(revenusController.create));
revenusRouter.patch("/:id", asyncHandler(revenusController.update));
revenusRouter.delete("/:id", asyncHandler(revenusController.remove));
