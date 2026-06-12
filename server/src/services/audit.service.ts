import { prisma } from "../lib/prisma.js";

interface AuditInput {
  userId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
}

// Records an audit log entry. Failures are swallowed so auditing never breaks
// the primary operation, but they are logged to the console.
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        details: input.details ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record audit log:", err);
  }
}
