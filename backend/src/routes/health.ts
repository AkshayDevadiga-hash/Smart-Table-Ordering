import { Router } from "express";
import * as healthController from "../controllers/healthController";

const router = Router();

router.get("/healthz", healthController.healthCheck);

export default router;
