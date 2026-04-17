import { Router } from "express";
import * as qrController from "../controllers/qrController";

const router: Router = Router();

router.get("/qr", qrController.qrPng);

export default router;
