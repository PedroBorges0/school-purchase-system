import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const SEQUENCE_KEY = "PURCHASE_REQUEST_SEQUENCE";

export async function generateSequentialRequestCode(
  tx: Prisma.TransactionClient
): Promise<string> {
  const db = tx ?? prisma;

  const config = await db.systemConfig.upsert({
    where: { key: SEQUENCE_KEY },
    update: {},
    create: {
      key: SEQUENCE_KEY,
      value: "0",
    },
  });

  const currentValue = Number(config.value || "0");
  const nextValue = currentValue + 1;

  await db.systemConfig.update({
    where: { key: SEQUENCE_KEY },
    data: { value: String(nextValue) },
  });

  return `SC-${String(nextValue).padStart(4, "0")}`;
}