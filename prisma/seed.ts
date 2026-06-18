import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe("DEALLOCATE ALL");
  const password = await bcrypt.hash("123456", 10);

  const users = [
    {
      name: "Solicitante Teste",
      email: "solicitante@teste.com",
      role: Role.SOLICITANTE,
    },
    {
      name: "Diretor",
      email: "diretor@teste.com",
      role: Role.DIRETOR,
    },
    {
      name: "Compras",
      email: "compras@teste.com",
      role: Role.COMPRAS,
    },
    {
      name: "Financeiro",
      email: "financeiro@teste.com",
      role: Role.FINANCEIRO,
    },
    {
      name: "Controladoria",
      email: "controladoria@teste.com",
      role: Role.CONTROLADORIA,
    },
    {
      name: "Admin",
      email: "admin@teste.com",
      role: Role.ADMIN,
    },
  ];

  for (const user of users) {
    const exists = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!exists) {
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password,
          role: user.role,
          active: true,
        },
      });

      console.log(`✅ Usuário criado: ${user.email}`);
    } else {
      console.log(`ℹ️ Usuário já existe: ${user.email}`);
    }
  }
}

main()
  .then(() => {
    console.log("🎉 Seed finalizado!");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });