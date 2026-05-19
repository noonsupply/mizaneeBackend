import { Router } from "express";

import * as chargesController from "../controllers/charges.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/authenticate";
import { requireFoyer } from "../middleware/requireFoyer";

export const chargesRouter = Router();

chargesRouter.use(authenticate, requireFoyer);

chargesRouter.get("/", asyncHandler(chargesController.getAll));
chargesRouter.post("/", asyncHandler(chargesController.create));
chargesRouter.patch("/:id", asyncHandler(chargesController.update));
chargesRouter.delete("/:id", asyncHandler(chargesController.remove));
