import { Router } from "express";

import { authRouter } from "./auth.routes";
import { chargesRouter } from "./charges.routes";
import { foyerRouter } from "./foyer.routes";
import { membresRouter } from "./membres.routes";
import { projetsRouter } from "./projets.routes";
import { revenusRouter } from "./revenus.routes";
import { simulationsRouter } from "./simulations.routes";
import { virementsRouter } from "./virements.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", service: "mizanee-api" } });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/foyer", foyerRouter);
apiRouter.use("/membres", membresRouter);
apiRouter.use("/revenus", revenusRouter);
apiRouter.use("/charges", chargesRouter);
apiRouter.use("/projets", projetsRouter);
apiRouter.use("/simulations", simulationsRouter);
apiRouter.use("/virements", virementsRouter);
