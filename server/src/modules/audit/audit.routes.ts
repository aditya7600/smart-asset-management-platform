import { Router } from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

const querySchema = z.object({
  entityType: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// GET /api/audit — system-wide audit trail (admin only).
async function listAuditLogs(req: Request, res: Response) {
  const q = req.query as unknown as z.infer<typeof querySchema>;
  const where: Record<string, unknown> = {};
  if (q.entityType) where.entityType = q.entityType;
  if (q.action) where.action = q.action;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  res.json({
    logs,
    pagination: {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    },
  });
}

const router = Router();
router.use(authenticate, requireAdmin);
router.get("/", validate(querySchema, "query"), asyncHandler(listAuditLogs));

export default router;
