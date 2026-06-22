import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";
import { sendVehicleRequestEmail } from "@/lib/email";

const createSchema = z.object({
  travelDate: z.string().min(1, "Data da viagem obrigatória"),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  objective: z.string().min(10, "Objetivo muito curto"),
  driver: z.string().min(2, "Condutor obrigatório"),
  otherParticipants: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const role = session.user.role as Role;
  const userId = session.user.id;
  const isCompras = role === Role.COMPRAS || role === Role.ADMIN;

  const requests = await prisma.vehicleRequest.findMany({
    where: isCompras ? undefined : { requestedById: userId },
    include: {
      requestedBy: {
        select: { id: true, name: true, email: true, department: true },
      },
      reviewedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ travelDate: "asc" }, { departureTime: "asc" }],
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const request = await prisma.vehicleRequest.create({
    data: {
      travelDate: new Date(data.travelDate),
      departureTime: data.departureTime,
      returnTime: data.returnTime,
      objective: data.objective,
      driver: data.driver,
      otherParticipants: data.otherParticipants || null,
      requestedById: session.user.id,
    },
    include: {
      requestedBy: { select: { name: true, email: true } },
    },
  });

  // Notify compras
  const comprasUsers = await prisma.user.findMany({
    where: { active: true, role: { in: [Role.COMPRAS, Role.ADMIN] } },
    select: { email: true, name: true },
  });

  await Promise.all(
    comprasUsers.map((u) =>
      sendVehicleRequestEmail({
        requesterName: request.requestedBy.name,
        travelDate: data.travelDate,
        departureTime: data.departureTime,
        returnTime: data.returnTime,
        recipientEmail: u.email,
        recipientName: u.name,
      })
    )
  );

  return NextResponse.json(request, { status: 201 });
}
