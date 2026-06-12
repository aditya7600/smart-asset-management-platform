import { z } from "zod";
import { AssetStatus, AssetCondition } from "../../utils/constants.js";

const statusEnum = z.enum(
  Object.values(AssetStatus) as [string, ...string[]]
);
const conditionEnum = z.enum(
  Object.values(AssetCondition) as [string, ...string[]]
);

export const createAssetSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  categoryId: z.string().min(1, "Category is required"),
  totalQuantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  status: statusEnum.optional(),
  condition: conditionEnum.optional(),
  location: z.string().max(120).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateAssetSchema = createAssetSchema.partial();

export const listAssetsQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: statusEnum.optional(),
  availableOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  sort: z.enum(["name", "newest", "available"]).default("name"),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
