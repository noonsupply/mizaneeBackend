import type { UserPublic } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      foyerId?: string;
      user?: UserPublic;
    }
  }
}

export {};
