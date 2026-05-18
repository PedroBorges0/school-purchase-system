import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sendPendingActionEmail, sendStatusChangeEmail } from "@/lib/email";
import {
  canUserActOnRequest,
  resolveNextStatus,
  getWorkflowStep,
  validateActionForStep,
  isCommentRequired,
  shouldAdvanceStep,
  shouldReturnStep,
  getRoleForStatus,
} from "@/lib/workflow";
import { ApprovalAction } from "@prisma/client";
import { z } from "zod";

const approvalSchema = z.object({
  action: z.nativeEnum(ApprovalAction),
  comment: z.string().trim().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      requestedBy: true,
      approvals: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (!canUserActOnRequest(session.user.role, request.status)) {
    return NextResponse.json(
      { error: "Você não tem permissão para agir nesta etapa" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = approvalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { action, comment } = parsed.data;
  const step = getWorkflowStep(request.status);

  const validation = validateActionForStep(request.status, action);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  if (isCommentRequired(request.status, action) && !comment) {
    return NextResponse.json(
      { error: "Comentário obrigatório para esta ação" },
      { status: 400 }
    );
  }

  const oldStatus = request.status;
  const nextStatus = resolveNextStatus(request.status, action, request.requiresDG);

  let nextStepNumber = request.currentStep;

  if (shouldAdvanceStep(action) && nextStatus !== oldStatus) {
    nextStepNumber = request.currentStep + 1;
  }

  if (shouldReturnStep(action)) {
    nextStepNumber = Math.max(1, request.currentStep - 1);
  }

  const [approval, updatedRequest] = await prisma.$transaction([
    prisma.approval.create({
      data: {
        action,
        step: step?.stepNumber ?? request.currentStep,
        stepName: step?.label ?? request.status,
        comment: comment || null,
        requestId: request.id,
        userId: session.user.id,
      },
    }),
    prisma.purchaseRequest.update({
      where: { id: request.id },
      data: {
        status: nextStatus,
        currentStep: nextStepNumber,
      },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    action: `REQUEST_${action}`,
    entityType: "PurchaseRequest",
    entityId: request.id,
    requestId: request.id,
    oldValue: { status: oldStatus, currentStep: request.currentStep },
    newValue: { status: nextStatus, currentStep: nextStepNumber },
    metadata: { comment, stepName: step?.label },
  });

  await sendStatusChangeEmail({
    requestId: request.id,
    requestCode: request.code,
    requestTitle: request.title,
    requesterName: request.requestedBy.name,
    requesterEmail: request.requestedBy.email,
    newStatus: nextStatus,
    action,
    comment,
    actorName: session.user.name || session.user.email || "Usuário",
  
  });

  const nextRole = getRoleForStatus(nextStatus);

  if (nextRole && nextStatus !== oldStatus) {
    const nextActor = await prisma.user.findFirst({
      where: {
        active: true,
        role: nextRole,
      },
      orderBy: { createdAt: "asc" },
    });

    if (nextActor) {
      await sendPendingActionEmail({
        requestId: request.id,
        requestCode: request.code,
        requestTitle: request.title,
        requesterName: request.requestedBy.name,
        recipientEmail: nextActor.email,
        recipientName: nextActor.name,
        newStatus: nextStatus,
        role: nextRole,
      });
    }
  }

  return NextResponse.json({ approval, request: updatedRequest });
}