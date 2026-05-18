import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(params: {
  name: string;
  email: string;
  role: Role;
  department: string;
  passwordHash: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      role: params.role,
      department: params.department,
      active: true,
      password: params.passwordHash,
    },
    create: {
      name: params.name,
      email: params.email,
      role: params.role,
      department: params.department,
      active: true,
      password: params.passwordHash,
    },
  });

  return user;
}

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const users = [
    {
      name: "Solicitante Teste",
      email: "solicitante@teste.com",
      role: Role.SOLICITANTE,
      department: "Administrativo",
    },
    {
      name: "Diretor Teste",
      email: "diretor@teste.com",
      role: Role.DIRETOR,
      department: "Direção",
    },
    {
      name: "Compras Teste",
      email: "compras@teste.com",
      role: Role.COMPRAS,
      department: "Compras",
    },
    {
      name: "Financeiro Teste",
      email: "financeiro@teste.com",
      role: Role.FINANCEIRO,
      department: "Financeiro",
    },
    {
      name: "Controladoria Teste",
      email: "controladoria@teste.com",
      role: Role.CONTROLADORIA,
      department: "Controladoria",
    },
    {
      name: "Diretor Geral Teste",
      email: "pb20112005@gmail.com",
      role: Role.DIRETOR_GERAL,
      department: "Direção Geral",
    },
    {
      name: "Admin Teste",
      email: "pb20112005@gmail.com",
      role: Role.ADMIN,
      department: "Administração",
    },
  ];

  for (const userData of users) {
    const user = await upsertUser({
      ...userData,
      passwordHash,
    });

    console.log(`Usuário pronto: ${user.email} (${user.role})`);
  }

  console.log("\nSenha de todos os usuários: 123456");
}

main()
  .catch((error) => {
    console.error("Erro ao criar usuários de teste:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });