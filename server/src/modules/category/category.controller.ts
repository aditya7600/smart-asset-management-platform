import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { recordAudit } from "../../services/audit.service.js";

export const categorySchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional(),
});

export async function listCategories(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { assets: true } } },
  });
  res.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      assetCount: c._count.assets,
    })),
  });
}

export async function createCategory(req: Request, res: Response) {
  const { name, description } = req.body as z.infer<typeof categorySchema>;
  const category = await prisma.category.create({ data: { name, description } });
  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "CATEGORY_CREATED",
    entityType: "Category",
    entityId: category.id,
    details: `Category created: ${name}`,
  });
  res.status(201).json({ category });
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description } = req.body as z.infer<typeof categorySchema>;
  const category = await prisma.category.update({
    where: { id },
    data: { name, description },
  });
  res.json({ category });
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  const assetCount = await prisma.asset.count({ where: { categoryId: id } });
  if (assetCount > 0) {
    throw ApiError.conflict(
      `Cannot delete a category that still has ${assetCount} asset(s). Reassign or remove them first.`
    );
  }
  await prisma.category.delete({ where: { id } });
  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "CATEGORY_DELETED",
    entityType: "Category",
    entityId: id,
  });
  res.json({ success: true });
}
