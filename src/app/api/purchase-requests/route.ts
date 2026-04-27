import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { checkRequiresDG, getPendingStatusesForRole } from "@/lib/workflow";
import { generateSequentialRequestCode } from "@/lib/request-code";
import { sendNewRequestEmail } from "@/lib/email";
import { z } from "zod";
import { Category, RequestStatus, Role } from "@prisma/client";

const createRequestSchema = z.object({
  title: z.string().min(5, "Título muito curto").max(200),
  category: z.nativeEnum(Category),
  description: z.string().min(10, "Descrição muito curta"),
  quantity: z.number().int().positive(),
  unit: z.string().min(1).default("un"),
  justification: z.string().min(10, "Justificativa muito curta"),
  productUrl: z.string().url().optional().or(z.literal("")),
  estimatedValue: z.number().positive().optional(),
  expectedUseDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as RequestStatus | null;
  const mine = searchParams.get("mine") === "true";
  const pending = searchParams.get("pending") === "true";

  const role = session.user.role;
  const userId = session.user.id;

  const where: any = {};

  if (mine) where.requestedById = userId;
  if (pending) where.status = { in: getPendingStatusesForRole(role) };
  if (status) where.status = status;

  const requests = await prisma.purchaseRequest.findMany({
    where,
    include: {
      requestedBy: {
        select: { id: true, name: true, email: true, department: true },
      },
      approvals: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
      quotes: { orderBy: { createdAt: "asc" } },
      _count: { select: { attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const requiresDG = checkRequiresDG(data.estimatedValue);

  const result = await prisma.$transaction(async (tx) => {
    const code = await generateSequentialRequestCode(tx);

    const request = await tx.purchaseRequest.create({
      data: {
        code,
        title: data.title,
        category: data.category,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        justification: data.justification,
        productUrl: data.productUrl || null,
        estimatedValue: data.estimatedValue ?? null,
        expectedUseDate: data.expectedUseDate ? new Date(data.expectedUseDate) : null,
        requiresDG,
        status: RequestStatus.EM_APROVACAO_DIRETOR,
        currentStep: 1,
        requestedById: session.user.id,
      },
      include: {
        requestedBy: true,
      },
    });

    return request;
  });

  await createAuditLog({
    userId: session.user.id,
    action: "REQUEST_CREATED",
    entityType: "PurchaseRequest",
    entityId: result.id,
    requestId: result.id,
    newValue: { code: result.code, status: result.status },
  });

  const director = await prisma.user.findFirst({
    where: {
      active: true,
      role: { in: [Role.DIRETOR, Role.ADMIN] },
    },
    orderBy: { createdAt: "asc" },
  });

  if (director) {
    await sendNewRequestEmail({
      requestId: result.id,
      requestCode: result.code,
      requestTitle: result.title,
      requesterName: result.requestedBy.name,
      recipientEmail: director.email,
      recipientName: director.name,
    });
  }

  return NextResponse.json(result, { status: 201 });
}