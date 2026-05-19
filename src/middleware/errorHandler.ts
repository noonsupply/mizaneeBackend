import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../config/env";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const message = first?.message ?? "Données invalides";
    res.status(400).json({
      success: false,
      message,
      errors: err.issues,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Erreur interne du serveur"
        : err instanceof Error
          ? err.message
          : "Erreur inconnue",
  });
}
