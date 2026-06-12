import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import {
  createBookingSchema,
  reviewSchema,
  listBookingsQuerySchema,
} from "./booking.schema.js";
import {
  createBooking,
  listBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  issueBooking,
  returnBooking,
  cancelBooking,
} from "./booking.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listBookingsQuerySchema, "query"), asyncHandler(listBookings));
router.post("/", validate(createBookingSchema), asyncHandler(createBooking));
router.get("/:id", asyncHandler(getBooking));

// Approval workflow (admin only).
router.patch("/:id/approve", requireAdmin, validate(reviewSchema), asyncHandler(approveBooking));
router.patch("/:id/reject", requireAdmin, validate(reviewSchema), asyncHandler(rejectBooking));
router.patch("/:id/issue", requireAdmin, asyncHandler(issueBooking));
router.patch("/:id/return", requireAdmin, asyncHandler(returnBooking));

// A user can cancel their own request.
router.patch("/:id/cancel", asyncHandler(cancelBooking));

export default router;
