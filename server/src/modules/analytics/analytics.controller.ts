import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { BookingStatus } from "../../utils/constants.js";
import { markOverdueBookings } from "../booking/booking.service.js";

// GET /api/analytics/overview — summary cards for the dashboard.
export async function overview(_req: Request, res: Response) {
  await markOverdueBookings();

  const [
    totalAssets,
    assetAgg,
    totalCategories,
    activeBookings,
    pendingRequests,
    overdueReturns,
    totalUsers,
    issuedCount,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.aggregate({ _sum: { totalQuantity: true, availableQuantity: true } }),
    prisma.category.count(),
    prisma.booking.count({ where: { status: { in: [BookingStatus.APPROVED, BookingStatus.ISSUED] } } }),
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { status: BookingStatus.OVERDUE } }),
    prisma.user.count(),
    prisma.booking.count({ where: { status: BookingStatus.ISSUED } }),
  ]);

  const totalUnits = assetAgg._sum.totalQuantity ?? 0;
  const availableUnits = assetAgg._sum.availableQuantity ?? 0;
  const inUseUnits = totalUnits - availableUnits;
  const utilizationRate = totalUnits > 0 ? Math.round((inUseUnits / totalUnits) * 100) : 0;

  res.json({
    totalAssets,
    totalCategories,
    totalUnits,
    availableUnits,
    inUseUnits,
    utilizationRate,
    activeBookings,
    pendingRequests,
    overdueReturns,
    issuedCount,
    totalUsers,
  });
}

// GET /api/analytics/most-used — most frequently booked assets (bar chart).
export async function mostUsed(_req: Request, res: Response) {
  const grouped = await prisma.booking.groupBy({
    by: ["assetId"],
    _count: { assetId: true },
    _sum: { quantity: true },
    where: { status: { notIn: [BookingStatus.REJECTED, BookingStatus.CANCELLED] } },
    orderBy: { _count: { assetId: "desc" } },
    take: 8,
  });

  const assets = await prisma.asset.findMany({
    where: { id: { in: grouped.map((g) => g.assetId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(assets.map((a) => [a.id, a.name]));

  res.json({
    items: grouped.map((g) => ({
      assetId: g.assetId,
      name: nameById.get(g.assetId) ?? "Unknown",
      bookings: g._count.assetId,
      unitsBooked: g._sum.quantity ?? 0,
    })),
  });
}

// GET /api/analytics/category-distribution — asset spread per category (pie chart).
export async function categoryDistribution(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
  res.json({
    items: categories
      .map((c) => ({ name: c.name, value: c._count.assets }))
      .filter((c) => c.value > 0),
  });
}

// GET /api/analytics/utilization — per-asset utilization rate (reserved/total).
export async function utilization(_req: Request, res: Response) {
  const assets = await prisma.asset.findMany({
    select: { id: true, name: true, totalQuantity: true, availableQuantity: true },
    orderBy: { name: "asc" },
  });
  res.json({
    items: assets.map((a) => {
      const inUse = a.totalQuantity - a.availableQuantity;
      return {
        assetId: a.id,
        name: a.name,
        total: a.totalQuantity,
        inUse,
        available: a.availableQuantity,
        rate: a.totalQuantity > 0 ? Math.round((inUse / a.totalQuantity) * 100) : 0,
      };
    }),
  });
}

// GET /api/analytics/bookings-trend — bookings created per day for last 14 days (line graph).
export async function bookingsTrend(_req: Request, res: Response) {
  const days = 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const bookings = await prisma.booking.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
  });

  // Bucket by YYYY-MM-DD.
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const b of bookings) {
    const key = b.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  res.json({
    items: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
  });
}
