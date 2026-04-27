// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco...");

  const users = [
    {
      name: "Administrador",
      email: "admin@colegio.edu.br",
      password: "admin123",
      role: Role.ADMIN,
      department: "TI",
    },
    {
      name: "João Silva",
      email: "solicitante@colegio.edu.br",
      password: "senha123",
      role: Role.SOLICITANTE,
      department: "Administrativo",
    },
    {
      name: "Dra. Maria Santos",
      email: "diretor@colegio.edu.br",
      password: "senha123",
      role: Role.DIRETOR,
      department: "Direção",
    },
    {
      name: "Carlos Compras",
      email: "compras@colegio.edu.br",
      password: "senha123",
      role: Role.COMPRAS,
      department: "Compras",
    },
    {
      name: "Ana Financeiro",
      email: "financeiro@colegio.edu.br",
      password: "senha123",
      role: Role.FINANCEIRO,
      department: "Financeiro",
    },
    {
      name: "Paulo Controladoria",
      email: "controladoria@colegio.edu.br",
      password: "senha123",
      role: Role.CONTROLADORIA,
      department: "Controladoria",
    },
    {
      name: "Dir. Roberto Geral",
      email: "diretorgeral@colegio.edu.br",
      password: "senha123",
      role: Role.DIRETOR_GERAL,
      department: "Direção Geral",
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        department: userData.department,
      },
    });

    console.log(`✅ Usuário criado: ${userData.email} (${userData.role})`);
  }

  // Config inicial
  await prisma.systemConfig.upsert({
    where: { key: "DG_VALUE_THRESHOLD" },
    update: {},
    create: { key: "DG_VALUE_THRESHOLD", value: "5000" },
  });

  console.log("✅ Seed concluído!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
    await prisma.systemConfig.upsert({
    where: { key: "PURCHASE_REQUEST_SEQUENCE" },
    update: {},
    create: { key: "PURCHASE_REQUEST_SEQUENCE", value: "0" },
  });
