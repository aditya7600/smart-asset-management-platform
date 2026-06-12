import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import {
  createAssetSchema,
  updateAssetSchema,
  listAssetsQuerySchema,
} from "./asset.schema.js";
import {
  listAssets,
  getAsset,
  getAssetQr,
  lookupByQr,
  createAsset,
  updateAsset,
  deleteAsset,
} from "./asset.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listAssetsQuerySchema, "query"), asyncHandler(listAssets));
router.get("/lookup/:code", asyncHandler(lookupByQr));
router.get("/:id", asyncHandler(getAsset));
router.get("/:id/qr", asyncHandler(getAssetQr));

router.post("/", requireAdmin, validate(createAssetSchema), asyncHandler(createAsset));
router.put("/:id", requireAdmin, validate(updateAssetSchema), asyncHandler(updateAsset));
router.delete("/:id", requireAdmin, asyncHandler(deleteAsset));

export default router;
