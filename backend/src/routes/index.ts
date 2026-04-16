import { Router } from "express";
import healthRouter from "./health";
import menuRouter from "./menu";
import tablesRouter from "./tables";
import ordersRouter from "./orders";
import kitchenRouter from "./kitchen";
import adminRouter from "./admin";
import authRouter from "./auth";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(menuRouter);
router.use(tablesRouter);
router.use(ordersRouter);
router.use(kitchenRouter);
router.use(adminRouter);

export default router;
