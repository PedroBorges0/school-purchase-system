import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@email.com",
      password: passwordHash,
      role: "ADMIN",
      department: "Administração",
      active: true,
    },
  });

  console.log("Usuário criado:", user.email);
}

main();