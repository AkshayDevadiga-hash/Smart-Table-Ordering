import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

router.post("/auth/login", authController.login);
router.post("/auth/verify", authController.verify);

export default router;
