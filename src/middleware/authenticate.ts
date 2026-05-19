import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../lib/jwt";
import { AppError } from "./errorHandler";
import { Membre } from "../models/Membre";
import { User, toUserPublic } from "../models/User";

async function resolveFoyerIdForUser(
  userId: string,
  jwtFoyerId?: string | null,
): Promise<string | undefined> {
  const user = await User.findById(userId).select("foyerId membreId").lean();
  if (!user) return undefined;

  if (user.foyerId) {
    return user.foyerId.toString();
  }

  if (user.membreId) {
    const membre = await Membre.findById(user.membreId).select("foyerId").lean();
    if (membre?.foyerId) {
      await User.updateOne({ _id: userId }, { foyerId: membre.foyerId });
      return membre.foyerId.toString();
    }
  }

  const membreByUser = await Membre.findOne({ userId }).select("foyerId").lean();
  if (membreByUser?.foyerId) {
    await User.updateOne(
      { _id: userId },
      { foyerId: membreByUser.foyerId, membreId: membreByUser._id },
    );
    return membreByUser.foyerId.toString();
  }

  return jwtFoyerId ?? undefined;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Authentification requise", "UNAUTHORIZED"));
    return;
  }

  const token = header.slice(7).trim();
  if (!token) {
    next(new AppError(401, "Token manquant", "UNAUTHORIZED"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const foyerId = await resolveFoyerIdForUser(payload.sub, payload.foyerId);

    const userDoc = await User.findById(payload.sub).select("-passwordHash");
    if (!userDoc) {
      next(new AppError(401, "Utilisateur introuvable", "UNAUTHORIZED"));
      return;
    }

    const user = toUserPublic(userDoc);
    if (foyerId) {
      user.foyerId = foyerId;
    }

    req.user = user;
    req.userId = user.id;
    req.foyerId = foyerId;

    next();
  } catch {
    next(new AppError(401, "Session invalide ou expirée", "UNAUTHORIZED"));
  }
}
