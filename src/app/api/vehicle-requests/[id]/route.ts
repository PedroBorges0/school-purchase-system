export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, VehicleRequestStatus } from "@prisma/client";
import { z } from "zod";
import { sendVehicleReviewEmail } from "@/lib/email";

const reviewSchema = z.object({
  status: z.nativeEnum(VehicleRequestStatus),
  managerComment: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const role = session.user.role as Role;
  const isCompras = role === Role.COMPRAS || role === Role.ADMIN;

  const request = await prisma.vehicleRequest.findUnique({
    where: { id },
    include: {
      requestedBy: { select: { id: true, name: true, email: true, department: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const isOwner = request.requestedById === session.user.id;
  if (!isOwner && !isCompras) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json(request);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const role = session.user.role as Role;
  if (role !== Role.COMPRAS && role !== Role.ADMIN) {
    return NextResponse.json({ error: "Apenas Compras pode dar parecer" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.vehicleRequest.findUnique({
    where: { id },
    include: { requestedBy: { select: { name: true, email: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const updated = await prisma.vehicleRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      managerComment: parsed.data.managerComment || null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  await sendVehicleReviewEmail({
    requesterName: existing.requestedBy.name,
    requesterEmail: existing.requestedBy.email,
    travelDate: existing.travelDate.toISOString().split("T")[0],
    newStatus: parsed.data.status,
    managerComment: parsed.data.managerComment,
    reviewerName: session.user.name ?? "Compras",
  });

  return NextResponse.json(updated);
}
