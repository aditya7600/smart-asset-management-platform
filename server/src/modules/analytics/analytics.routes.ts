import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import {
  overview,
  mostUsed,
  categoryDistribution,
  utilization,
  bookingsTrend,
} from "./analytics.controller.js";

const router = Router();

// Analytics are admin-facing operational insights.
router.use(authenticate, requireAdmin);

router.get("/overview", asyncHandler(overview));
router.get("/most-used", asyncHandler(mostUsed));
router.get("/category-distribution", asyncHandler(categoryDistribution));
router.get("/utilization", asyncHandler(utilization));
router.get("/bookings-trend", asyncHandler(bookingsTrend));

export default router;
