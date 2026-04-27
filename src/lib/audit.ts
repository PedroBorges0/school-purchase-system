// src/lib/audit.ts
import { prisma } from "./prisma";

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
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
        metadata: input.metadata ?? null,
        userId: input.userId,
        requestId: input.requestId ?? null,
      },
    });
  } catch (error) {
    // Nunca lança erro — auditoria não deve quebrar o fluxo principal
    console.error("[AUDIT] Falha ao registrar log:", error);
  }
}
