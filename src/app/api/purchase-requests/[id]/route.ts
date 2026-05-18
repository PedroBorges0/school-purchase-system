import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params; // ✅ correto

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          role: true,
        },
      },
      approvals: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
      quotes: {
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  return NextResponse.json(request);


  const isOwner = request.requestedById === session.user.id;
  const privilegedRoles: Role[] = [
    Role.ADMIN,
    Role.DIRETOR,
    Role.COMPRAS,
    Role.FINANCEIRO,
    Role.CONTROLADORIA,
    Role.DIRETOR_GERAL,
  ];

  if (!isOwner && !privilegedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

}