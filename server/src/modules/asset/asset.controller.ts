import type { Request, Response } from "express";
import QRCode from "qrcode";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { AssetStatus } from "../../utils/constants.js";
import { recordAudit } from "../../services/audit.service.js";
import type {
  CreateAssetInput,
  UpdateAssetInput,
  ListAssetsQuery,
} from "./asset.schema.js";

// GET /api/assets — searchable, filterable, paginated catalog.
export async function listAssets(req: Request, res: Response) {
  const q = req.query as unknown as ListAssetsQuery;

  const where: Record<string, unknown> = {};
  if (q.search) {
    where.OR = [
      { name: { contains: q.search } },
      { description: { contains: q.search } },
      { location: { contains: q.search } },
    ];
  }
  if (q.categoryId) where.categoryId = q.categoryId;
  if (q.status) where.status = q.status;
  if (q.availableOnly) where.availableQuantity = { gt: 0 };

  const orderBy =
    q.sort === "newest"
      ? { createdAt: "desc" as const }
      : q.sort === "available"
        ? { availableQuantity: "desc" as const }
        : { name: "asc" as const };

  const [total, assets] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: { category: { select: { id: true, name: true } } },
    }),
  ]);

  res.json({
    assets,
    pagination: {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    },
  });
}

// GET /api/assets/:id — full detail including recent bookings and maintenance.
export async function getAsset(req: Request, res: Response) {
  const asset = await prisma.asset.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      maintenance: { orderBy: { createdAt: "desc" }, take: 10 },
      bookings: {
        where: { status: { in: ["APPROVED", "ISSUED", "OVERDUE"] } },
        orderBy: { startDate: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!asset) throw ApiError.notFound("Asset not found");
  res.json({ asset });
}

// GET /api/assets/:id/qr — returns a QR code (PNG data URL) encoding the asset.
export async function getAssetQr(req: Request, res: Response) {
  const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
  if (!asset) throw ApiError.notFound("Asset not found");

  const payload = JSON.stringify({
    type: "assetflow-asset",
    id: asset.id,
    code: asset.qrCode,
    name: asset.name,
  });
  const dataUrl = await QRCode.toDataURL(payload, { width: 320, margin: 2 });
  res.json({ qr: dataUrl, code: asset.qrCode, assetId: asset.id });
}

// GET /api/assets/lookup/:code — resolve a scanned QR code back to an asset.
export async function lookupByQr(req: Request, res: Response) {
  const asset = await prisma.asset.findUnique({
    where: { qrCode: req.params.code },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!asset) throw ApiError.notFound("No asset matches this code");
  res.json({ asset });
}

export async function createAsset(req: Request, res: Response) {
  const data = req.body as CreateAssetInput;

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw ApiError.badRequest("Selected category does not exist");

  const asset = await prisma.asset.create({
    data: {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      totalQuantity: data.totalQuantity,
      availableQuantity: data.totalQuantity,
      status: data.status ?? AssetStatus.AVAILABLE,
      condition: data.condition,
      location: data.location,
      imageUrl: data.imageUrl || null,
    },
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "ASSET_CREATED",
    entityType: "Asset",
    entityId: asset.id,
    details: `Asset created: ${asset.name} (qty ${asset.totalQuantity})`,
  });

  res.status(201).json({ asset });
}

export async function updateAsset(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as UpdateAssetInput;

  const current = await prisma.asset.findUnique({ where: { id } });
  if (!current) throw ApiError.notFound("Asset not found");

  // Reserved = quantity currently committed to bookings.
  const reserved = current.totalQuantity - current.availableQuantity;

  let nextAvailable = current.availableQuantity;
  if (data.totalQuantity !== undefined) {
    if (data.totalQuantity < reserved) {
      throw ApiError.badRequest(
        `Total quantity cannot be below ${reserved} — that many units are currently reserved or issued.`
      );
    }
    // Keep "available" consistent: available = newTotal - reserved.
    nextAvailable = data.totalQuantity - reserved;
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      totalQuantity: data.totalQuantity,
      availableQuantity: nextAvailable,
      status: data.status,
      condition: data.condition,
      location: data.location,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
    },
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "ASSET_UPDATED",
    entityType: "Asset",
    entityId: asset.id,
    details: `Asset updated: ${asset.name}`,
  });

  res.json({ asset });
}

export async function deleteAsset(req: Request, res: Response) {
  const { id } = req.params;
  const activeBookings = await prisma.booking.count({
    where: { assetId: id, status: { in: ["APPROVED", "ISSUED", "OVERDUE", "PENDING"] } },
  });
  if (activeBookings > 0) {
    throw ApiError.conflict(
      "Cannot delete an asset with pending or active bookings. Resolve them first."
    );
  }
  // Remove dependent history then the asset (SQLite has no cascade by default here).
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { assetId: id } }),
    prisma.maintenanceRecord.deleteMany({ where: { assetId: id } }),
    prisma.asset.delete({ where: { id } }),
  ]);

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "ASSET_DELETED",
    entityType: "Asset",
    entityId: id,
  });

  res.json({ success: true });
}
