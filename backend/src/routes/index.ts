import { Router } from "express";
import healthRouter from "./health";
import qrRouter from "./qr";
import menuRouter from "./menu";
import tablesRouter from "./tables";
import ordersRouter from "./orders";
import kitchenRouter from "./kitchen";
import adminRouter from "./admin";
import authRouter from "./auth";
import reviewsRouter from "./reviews";

const router: Router = Router();

router.use(healthRouter);
router.use(qrRouter);
router.use(authRouter);
router.use(menuRouter);
router.use(tablesRouter);
router.use(ordersRouter);
router.use(kitchenRouter);
router.use(adminRouter);
router.use(reviewsRouter);

export default router;
