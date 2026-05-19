import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  /** Nom de la base si absent de l’URI (ex. URI sans segment /dbname) */
  MONGODB_DB_NAME: z.string().min(1).default("mizanee"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  /**
   * Une ou plusieurs origines autorisées (séparées par virgule).
   * Ex : "http://localhost:3000,https://mizanee.vercel.app"
   */
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  /** URL principale du front (alias prioritaire ; ajoutée à la liste). */
  CLIENT_URL: z.string().optional(),

  RESEND_API_KEY: z.string().default("re_placeholder"),
  RESEND_FROM_EMAIL: z.string().default("noreply@mizanee.app"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  return result.data;
}

export const env = parseEnv();

/** Liste normalisée des origines autorisées (sans trailing slash, sans doublon). */
export const allowedOrigins: string[] = Array.from(
  new Set(
    [env.CLIENT_URL, env.CORS_ORIGIN, "http://localhost:3000", "http://localhost:3001"]
      .filter((v): v is string => Boolean(v))
      .flatMap((v) => v.split(","))
      .map((v) => v.trim().replace(/\/$/, ""))
      .filter(Boolean),
  ),
);
