import { Router } from "express";

import * as simulationsController from "../controllers/simulations.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/authenticate";
import { requireFoyer } from "../middleware/requireFoyer";

export const simulationsRouter = Router();

simulationsRouter.use(authenticate, requireFoyer);

simulationsRouter.post("/", asyncHandler(simulationsController.run));
simulationsRouter.post("/save", asyncHandler(simulationsController.save));
simulationsRouter.get("/", asyncHandler(simulationsController.getAll));
simulationsRouter.delete("/:id", asyncHandler(simulationsController.remove));
