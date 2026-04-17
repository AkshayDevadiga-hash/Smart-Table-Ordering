import { Router } from "express";
import * as kitchenController from "../controllers/kitchenController";

const router: Router = Router();

router.get("/kitchen/active-orders", kitchenController.getActiveOrders);

export default router;
