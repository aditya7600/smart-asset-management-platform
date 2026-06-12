import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  MaintenanceType,
  MaintenanceStatus,
  AssetStatus,
  AssetCondition,
} from "../../utils/constants.js";
import { recordAudit } from "../../services/audit.service.js";

export const createMaintenanceSchema = z.object({
  assetId: z.string().min(1),
  type: z.enum(Object.values(MaintenanceType) as [string, ...string[]]).default("MAINTENANCE"),
  description: z.string().min(3).max(1000),
  cost: z.coerce.number().min(0).optional(),
  // When reporting damage, optionally downgrade the asset condition.
  condition: z.enum(Object.values(AssetCondition) as [string, ...string[]]).optional(),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(Object.values(MaintenanceStatus) as [string, ...string[]]),
  cost: z.coerce.number().min(0).optional(),
  // Optionally restore asset condition/status when resolving.
  condition: z.enum(Object.values(AssetCondition) as [string, ...string[]]).optional(),
  restoreAsset: z.boolean().optional(),
});

// GET /api/maintenance — all records, optionally filtered by asset (admin).
export async function listMaintenance(req: Request, res: Response) {
  const assetId = typeof req.query.assetId === "string" ? req.query.assetId : undefined;
  const records = await prisma.maintenanceRecord.findMany({
    where: assetId ? { assetId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      asset: { select: { id: true, name: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });
  res.json({ records });
}

// POST /api/maintenance — log maintenance or a damage report against an asset.
export async function createMaintenance(req: Request, res: Response) {
  const data = req.body as z.infer<typeof createMaintenanceSchema>;
  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw ApiError.notFound("Asset not found");

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.maintenanceRecord.create({
      data: {
        assetId: data.assetId,
        type: data.type,
        description: data.description,
        cost: data.cost,
        reportedById: req.user!.id,
        status: MaintenanceStatus.OPEN,
      },
    });

    // Reflect the issue on the asset: optionally update condition, and put a
    // unit into MAINTENANCE so it is visibly flagged.
    await tx.asset.update({
      where: { id: data.assetId },
      data: {
        condition: data.condition ?? asset.condition,
        status:
          data.type === MaintenanceType.DAMAGE_REPORT || data.type === MaintenanceType.REPAIR
            ? AssetStatus.MAINTENANCE
            : asset.status,
      },
    });

    return created;
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "MAINTENANCE_LOGGED",
    entityType: "Asset",
    entityId: data.assetId,
    details: `${data.type}: ${data.description}`,
  });

  res.status(201).json({ record });
}

// PATCH /api/maintenance/:id — update a record's status (e.g. resolve it).
export async function updateMaintenance(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as z.infer<typeof updateMaintenanceSchema>;

  const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Maintenance record not found");

  const record = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRecord.update({
      where: { id },
      data: {
        status: data.status,
        cost: data.cost ?? existing.cost,
        resolvedAt: data.status === MaintenanceStatus.RESOLVED ? new Date() : null,
      },
    });

    // On resolution, optionally bring the asset back to service.
    if (data.status === MaintenanceStatus.RESOLVED && data.restoreAsset) {
      await tx.asset.update({
        where: { id: existing.assetId },
        data: {
          status: AssetStatus.AVAILABLE,
          condition: data.condition ?? AssetCondition.GOOD,
        },
      });
    } else if (data.condition) {
      await tx.asset.update({
        where: { id: existing.assetId },
        data: { condition: data.condition },
      });
    }

    return updated;
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "MAINTENANCE_UPDATED",
    entityType: "Asset",
    entityId: existing.assetId,
    details: `Status → ${data.status}`,
  });

  res.json({ record });
}
