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
    where: { name: "qwen2.5-coder" },
    update: { tag: "7b", isDefault: true, isActive: true, sizeGb: 4.7 },
    create: {
      name: "qwen2.5-coder",
      tag: "7b",
      isDefault: true,
      isActive: true,
      sizeGb: 4.7,
    },
  });

  console.log("Seed complete: admin + model created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
