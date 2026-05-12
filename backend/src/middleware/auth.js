import { createClerkClient } from "@clerk/backend";
import { config } from "../config/env.js";
import prisma from "../config/database.js";

const clerk = createClerkClient({ secretKey: config.clerkSecretKey });

export async function authenticateUser(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Missing authorization token" });
    }

    const token = authHeader.replace("Bearer ", "");

    let clerkUser;
    try {
      const decoded = await clerk.verifyToken(token);
      clerkUser = await clerk.users.getUser(decoded.sub);
    } catch {
      return reply.code(401).send({ error: "Invalid token" });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return reply.code(401).send({ error: "No email found" });
    }

    let user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          role: email === config.adminEmail ? "ADMIN" : "USER",
        },
      });
    }

    if (user.banned) {
      return reply.code(403).send({ error: "Account suspended" });
    }

    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return reply.code(403).send({ error: "Account temporarily suspended" });
    }

    request.user = user;
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Authentication failed" });
  }
}

export async function requireAdmin(request, reply) {
  if (!request.user || request.user.role !== "ADMIN") {
    return reply.code(403).send({ error: "Admin access required" });
  }
}

export async function checkQueryLimit(request, reply) {
  const user = request.user;
  if (!user) return;

  if (user.role === "PRO" || user.role === "ADMIN") return;

  const now = new Date();
  const resetAt = new Date(user.queriesResetAt);
  if (now - resetAt > 24 * 60 * 60 * 1000) {
    await prisma.user.update({
      where: { id: user.id },
      data: { queriesUsed: 0, queriesResetAt: now },
    });
    user.queriesUsed = 0;
    return;
  }

  if (user.queriesUsed >= config.freeQueryLimit) {
    return reply.code(429).send({
      error: "Daily query limit reached. Upgrade to Pro for unlimited queries.",
      queriesUsed: user.queriesUsed,
      limit: config.freeQueryLimit,
    });
  }
}
