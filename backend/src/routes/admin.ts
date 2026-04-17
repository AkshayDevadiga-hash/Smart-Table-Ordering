import { Router } from "express";
import * as adminController from "../controllers/adminController";

const router: Router = Router();

router.get("/admin/stats", adminController.getStats);
router.get("/admin/reports", adminController.getReports);
router.get("/admin/recent-orders", adminController.getRecentOrders);

export default router;
