import type { Request, Response } from "express";
import mongoose from "mongoose";

import { signAccessToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { sendSuccess } from "../lib/response";
import { AppError } from "../middleware/errorHandler";
import { Foyer } from "../models/Foyer";
import { Membre } from "../models/Membre";
import { User, toUserPublic } from "../models/User";
import { loginSchema, registerSchema } from "../validations/auth";

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: input.email }).select("_id").lean();
  if (existing) {
    throw new AppError(409, "Un compte existe déjà avec cet e-mail", "EMAIL_EXISTS");
  }

  const foyerNom = input.foyerNom?.trim() || `Foyer de ${input.name ?? input.email.split("@")[0]}`;
  const prenom = input.name?.trim() || input.email.split("@")[0] || "Utilisateur";
  const passwordHash = await hashPassword(input.password);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [foyer] = await Foyer.create([{ nom: foyerNom, emoji: "🏠" }], { session });
    const [user] = await User.create(
      [
        {
          email: input.email,
          name: input.name ?? prenom,
          passwordHash,
          foyerId: foyer!._id,
        },
      ],
      { session },
    );

    const [membre] = await Membre.create(
      [
        {
          prenom,
          couleur: "#378ADD",
          foyerId: foyer!._id,
          userId: user!._id,
          prorata: 100,
        },
      ],
      { session },
    );

    await User.updateOne({ _id: user!._id }, { membreId: membre!._id }, { session });

    await session.commitTransaction();

    const token = signAccessToken({
      sub: user!._id.toString(),
      foyerId: foyer!._id.toString(),
    });

    sendSuccess(
      res,
      {
        token,
        user: toUserPublic({ ...user!.toObject(), membreId: membre!._id, foyerId: foyer!._id }),
      },
      201,
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    void session.endSession();
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);

  const user = await User.findOne({ email: input.email }).select("+passwordHash membreId foyerId");
  if (!user?.passwordHash) {
    throw new AppError(401, "E-mail ou mot de passe incorrect", "INVALID_CREDENTIALS");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "E-mail ou mot de passe incorrect", "INVALID_CREDENTIALS");
  }

  const token = signAccessToken({
    sub: user._id.toString(),
    foyerId: user.foyerId?.toString() ?? null,
  });

  sendSuccess(res, {
    token,
    user: toUserPublic(user),
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (req.user) {
    let membreId = req.user.membreId;
    if (!membreId && req.userId) {
      const membre = await Membre.findOne({ userId: req.userId }).select("_id").lean();
      membreId = membre?._id.toString() ?? null;
    }
    sendSuccess(res, {
      user: req.user,
      foyerId: req.foyerId ?? req.user.foyerId,
      membreId,
    });
    return;
  }

  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) {
    throw new AppError(401, "Utilisateur introuvable", "UNAUTHORIZED");
  }

  let membreId = user.membreId?.toString() ?? null;
  if (!membreId) {
    const membre = await Membre.findOne({ userId: user._id }).select("_id").lean();
    membreId = membre?._id.toString() ?? null;
  }

  const publicUser = toUserPublic(user);
  if (req.foyerId) {
    publicUser.foyerId = req.foyerId;
  }

  sendSuccess(res, {
    user: publicUser,
    foyerId: req.foyerId ?? publicUser.foyerId,
    membreId,
  });
}
