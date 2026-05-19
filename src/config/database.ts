import mongoose from "mongoose";

import { env } from "./env";
import { backfillFoyerIdOnLegacyDocuments } from "../lib/backfillFoyerId";
import { syncMembreIndexes } from "../models/Membre";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log(`MongoDB connecté — base: ${mongoose.connection.db?.databaseName ?? env.MONGODB_DB_NAME}`);
  await syncMembreIndexes();
  await backfillFoyerIdOnLegacyDocuments();
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
