import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { allowedOrigins, env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

const app = express();

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const normalized = origin.replace(/\/$/, "");
    if (normalized.endsWith(".vercel.app")) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(normalized)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS bloqué pour : ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Mizanee API is running 🚀",
    version: "1.0.0",
    env: env.NODE_ENV,
  });
});

app.use("/api", apiRouter);

app.use(errorHandler);

export default app;
