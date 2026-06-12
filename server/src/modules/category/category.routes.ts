import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import {
  categorySchema,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listCategories));
router.post("/", requireAdmin, validate(categorySchema), asyncHandler(createCategory));
router.put("/:id", requireAdmin, validate(categorySchema), asyncHandler(updateCategory));
router.delete("/:id", requireAdmin, asyncHandler(deleteCategory));

export default router;
