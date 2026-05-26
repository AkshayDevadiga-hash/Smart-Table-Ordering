import { Router } from "express";
import * as waiterRequestController from "../controllers/waiterRequestController";

const router = Router();

router.post("/waiter-requests", waiterRequestController.createWaiterRequest);
router.get("/waiter-requests", waiterRequestController.listWaiterRequests);
router.patch("/waiter-requests/:id", waiterRequestController.updateWaiterRequest);
router.post("/waiter-requests/:id/confirm-cash", waiterRequestController.confirmCashPayment);

export default router;
