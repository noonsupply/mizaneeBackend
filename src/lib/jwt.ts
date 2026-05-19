import jwt from "jsonwebtoken";

import { env } from "../config/env";

export interface JwtPayload {
  sub: string;
  foyerId?: string | null;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !decoded || typeof decoded !== "object" || !("sub" in decoded)) {
    throw new Error("Invalid token payload");
  }
  const sub = decoded.sub;
  if (typeof sub !== "string") {
    throw new Error("Invalid token subject");
  }
  const foyerId =
    "foyerId" in decoded && (decoded.foyerId === null || typeof decoded.foyerId === "string")
      ? decoded.foyerId
      : undefined;
  return { sub, foyerId };
}
