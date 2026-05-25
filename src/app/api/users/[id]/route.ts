import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  role: z.nativeEnum(Role),
  department: z.string().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
});

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  if (session.user.role !== Role.ADMIN) return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();

  // Toggle ativo/inativo
  if (typeof body.active === "boolean") {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { active: body.active },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        active: true,
        createdAt: true,
      },
    });
    return NextResponse.json(user);
  }

  // Edição completa
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, role, department, password } = parsed.data;

  // Verifica se email já está em uso por outro usuário
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: params.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Este e-mail já está em uso por outro usuário" },
      { status: 409 }
    );
  }

  const data: any = { name, email, role, department: department || null };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}