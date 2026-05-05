import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { RequestStatus, Role } from "@prisma/client";
import { z } from "zod";

const quoteSchema = z.object({
  supplierName: z.string().min(2, "Fornecedor obrigatório"),
  totalValue: z.number().positive("Valor deve ser maior que zero"),
  paymentTerms: z.string().optional(),
  deliveryTime: z.string().optional(),
  productUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const saveQuotesSchema = z.object({
  quotes: z.array(quoteSchema).min(1, "Informe pelo menos um orçamento"),
  selectedQuoteIndex: z.number().int().min(0).optional(),
  comment: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (![Role.COMPRAS, Role.ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const request = await prisma.purchaseRequest.findUnique({
    where: { id: params.id },
  });

  if (!request) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  if (request.status !== RequestStatus.EM_ORCAMENTO) {
    return NextResponse.json(
      { error: "Esta solicitação não está na etapa de orçamentos" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = saveQuotesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { quotes, selectedQuoteIndex, comment } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    await tx.quote.deleteMany({
      where: { requestId: params.id },
    });

    const createdQuotes = [];

    for (let i = 0; i < quotes.length; i++) {
      const q = quotes[i];

      const created = await tx.quote.create({
        data: {
          requestId: params.id,
          supplierName: q.supplierName,
          totalValue: Number(q.totalValue),

          paymentTerms: q.paymentTerms || null,
          deliveryDays: q.deliveryTime ? Number(q.deliveryTime) : null,
          productUrl: q.productUrl || null,
          notes: q.notes || null,

          isSelected: selectedQuoteIndex === i,
        },
      });

      createdQuotes.push(created);
    }

    const approval = await tx.approval.create({
      data: {
        requestId: params.id,
        userId: session.user.id,
        action: "APROVADO",
        comment: comment || "Orçamentos registrados e enviados ao Financeiro",
        step: 2,
        stepName: "Registro de Orçamentos",
      },
    });

    const updatedRequest = await tx.purchaseRequest.update({
      where: { id: params.id },
      data: {
        status: RequestStatus.EM_ANALISE_FINANCEIRA,
        currentStep: 3,
      },
    });

    return { createdQuotes, approval, updatedRequest };
  });

  await createAuditLog({
    userId: session.user.id,
    action: "REQUEST_QUOTES_REGISTERED",
    entityType: "PurchaseRequest",
    entityId: params.id,
    requestId: params.id,
    newValue: {
      status: RequestStatus.EM_ANALISE_FINANCEIRA,
      quotesCount: quotes.length,
      selectedQuoteIndex,
    },
    metadata: { comment },
  });

  return NextResponse.json(result);
}