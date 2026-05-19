import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail invalide").transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  email: z.string().email("E-mail invalide").transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Au moins 8 caractères")
    .max(128, "Mot de passe trop long"),
  name: z.string().trim().min(1).max(100).optional(),
  foyerNom: z.string().trim().min(1).max(200).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
