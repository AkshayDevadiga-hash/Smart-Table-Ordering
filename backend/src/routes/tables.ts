import { Router } from "express";
import * as tableController from "../controllers/tableController";

const router: Router = Router();

router.get("/tables", tableController.getTables);
router.post("/tables", tableController.createTable);
router.get("/tables/:tableId", tableController.getTable);

export default router;
