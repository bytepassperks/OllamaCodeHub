import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import prisma from "../config/database.js";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function authenticateUser(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Missing authorization token" });
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return reply.code(401).send({ error: "Invalid or expired token" });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return reply.code(401).send({ error: "User not found" });
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
      error: "Daily query limit reached. Contact admin to upgrade to Pro.",
      queriesUsed: user.queriesUsed,
      limit: config.freeQueryLimit,
    });
  }
}
