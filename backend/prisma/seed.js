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
    where: { name: "nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull" },
    update: { tag: "Q2_K_MTX", isDefault: true, isActive: true, sizeGb: 13.0 },
    create: {
      name: "nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull",
      tag: "Q2_K_MTX",
      isDefault: true,
      isActive: true,
      sizeGb: 13.0,
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
