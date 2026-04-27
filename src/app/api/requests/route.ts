import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const request = await prisma.purchaseRequest.create({
    data: {
      title: body.title,
      description: body.description,
      requesterId: session.user.id,
      status: "EM_APROVACAO",
      currentStep: 1,
    },
  });

  return NextResponse.json(request);
}