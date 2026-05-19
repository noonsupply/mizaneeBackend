import type { NextFunction, Request, Response } from "express";

import { requireFoyerId } from "../lib/foyerAccess";
import { AppError } from "./errorHandler";

export function requireFoyer(req: Request, _res: Response, next: NextFunction): void {
  try {
    requireFoyerId(req);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireUserId(req: Request, _res: Response, next: NextFunction): void {
  if (!req.userId) {
    next(new AppError(401, "Authentification requise", "UNAUTHORIZED"));
    return;
  }
  next();
}
