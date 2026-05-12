import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "harryroger798@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "007JamesBond@@";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  await prisma.ollamaModel.upsert({
    where: { name: "qwen3-coder" },
    update: {},
    create: {
      name: "qwen3-coder",
      tag: "30b",
      isDefault: true,
      isActive: true,
      sizeGb: 19,
    },
  });

  await prisma.ollamaModel.upsert({
    where: { name: "codellama" },
    update: {},
    create: {
      name: "codellama",
      tag: "13b",
      isDefault: false,
      isActive: true,
      sizeGb: 7.4,
    },
  });

  console.log("Seed complete: admin + models created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
