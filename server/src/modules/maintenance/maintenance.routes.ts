import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  listMaintenance,
  createMaintenance,
  updateMaintenance,
} from "./maintenance.controller.js";

const router = Router();

router.use(authenticate);

// Any authenticated user can report damage; admins manage the records.
router.get("/", requireAdmin, asyncHandler(listMaintenance));
router.post("/", validate(createMaintenanceSchema), asyncHandler(createMaintenance));
router.patch("/:id", requireAdmin, validate(updateMaintenanceSchema), asyncHandler(updateMaintenance));

export default router;
