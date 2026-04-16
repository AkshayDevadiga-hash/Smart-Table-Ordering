import { Router } from "express";
import * as orderController from "../controllers/orderController";

const router = Router();

router.get("/orders/current", orderController.getCurrentOrder);
router.get("/orders", orderController.listOrders);
router.post("/orders", orderController.createOrder);
router.get("/orders/:orderId/bill", orderController.getBill);
router.get("/orders/:orderId", orderController.getOrder);
router.patch("/orders/:orderId/payment", orderController.updatePaymentStatus);
router.patch("/orders/:orderId", orderController.updateOrderStatus);

export default router;
