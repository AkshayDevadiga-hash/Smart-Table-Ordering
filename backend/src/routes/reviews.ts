import { Router } from "express";
import * as reviewController from "../controllers/reviewController";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

router.post("/reviews", reviewController.createReview);
router.get("/reviews", requireAuth("admin"), reviewController.listReviews);

export default router;
