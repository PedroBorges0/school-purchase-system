import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface AuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValue: input.oldValue ?? Prisma.JsonNull,
        newValue: input.newValue ?? Prisma.JsonNull,
        metadata: input.metadata ?? Prisma.JsonNull,
        userId: input.userId,
        requestId: input.requestId ?? null,
      },
    });
  } catch (error) {
    console.error("[AUDIT] Falha ao registrar log:", error);
  }
}