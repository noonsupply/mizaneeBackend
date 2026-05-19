import { Router } from "express";

import * as authController from "../controllers/auth.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/authenticate";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.get("/me", authenticate, asyncHandler(authController.me));
