import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { pullModel, deleteModel, listModels } from "../services/ollama.js";
import { cancelSubscription } from "../services/stripe.js";
import prisma from "../config/database.js";

export default async function adminRoutes(fastify) {
  fastify.addHook("preHandler", authenticateUser);
  fastify.addHook("preHandler", requireAdmin);

  // ─── Users ─────────────────────────────────────────────
  fastify.get("/admin/users", async (request) => {
    const { page = 1, limit = 20, search = "" } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? { email: { contains: search, mode: "insensitive" } }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { subscription: true, _count: { select: { queries: true } } },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page: parseInt(page), limit: parseInt(limit) };
  });

  fastify.patch("/admin/users/:userId/role", async (request, reply) => {
    const { role } = request.body;
    if (!["USER", "PRO", "ADMIN"].includes(role)) {
      return reply.code(400).send({ error: "Invalid role" });
    }

    const user = await prisma.user.update({
      where: { id: request.params.userId },
      data: { role },
    });
    return user;
  });

  fastify.patch("/admin/users/:userId/ban", async (request) => {
    const { banned, suspendedUntil } = request.body;
    return prisma.user.update({
      where: { id: request.params.userId },
      data: {
        banned: banned ?? false,
        suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
      },
    });
  });

  // ─── Subscriptions ────────────────────────────────────
  fastify.get("/admin/subscriptions", async () => {
    return prisma.subscription.findMany({
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  fastify.patch("/admin/subscriptions/:subId", async (request) => {
    const { plan, status } = request.body;
    return prisma.subscription.update({
      where: { id: request.params.subId },
      data: { ...(plan && { plan }), ...(status && { status }) },
    });
  });

  fastify.post("/admin/subscriptions/:subId/cancel", async (request, reply) => {
    const sub = await prisma.subscription.findUnique({
      where: { id: request.params.subId },
    });
    if (!sub) return reply.code(404).send({ error: "Subscription not found" });

    if (sub.stripeSubId) {
      try {
        await cancelSubscription(sub.stripeSubId);
      } catch (err) {
        request.log.error(err);
      }
    }

    return prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "CANCELED", plan: "free" },
    });
  });

  // ─── Queries / Analytics ──────────────────────────────
  fastify.get("/admin/queries", async (request) => {
    const { page = 1, limit = 50 } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [queries, total] = await Promise.all([
      prisma.query.findMany({
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
        skip,
      }),
      prisma.query.count(),
    ]);

    return { queries, total };
  });

  fastify.get("/admin/analytics", async () => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalQueries, dailyQueries, weeklyQueries, activeUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.query.count(),
        prisma.query.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.query.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.query.groupBy({
          by: ["userId"],
          where: { createdAt: { gte: dayAgo } },
        }),
      ]);

    const avgResponse = await prisma.query.aggregate({
      _avg: { durationMs: true },
      where: { createdAt: { gte: dayAgo } },
    });

    return {
      totalUsers,
      totalQueries,
      dailyQueries,
      weeklyQueries,
      activeUsersToday: activeUsers.length,
      avgResponseMs: Math.round(avgResponse._avg.durationMs || 0),
    };
  });

  // ─── Model Management ─────────────────────────────────
  fastify.get("/admin/models", async () => {
    const dbModels = await prisma.ollamaModel.findMany({ orderBy: { isDefault: "desc" } });
    let ollamaModels = [];
    try {
      const result = await listModels();
      ollamaModels = result.models || [];
    } catch {
      /* Ollama might be offline */
    }
    return { dbModels, ollamaModels };
  });

  fastify.post("/admin/models", async (request) => {
    const { name, tag = "latest", isDefault = false } = request.body;

    try {
      await pullModel(`${name}:${tag}`);
    } catch (err) {
      request.log.error(err);
    }

    if (isDefault) {
      await prisma.ollamaModel.updateMany({ data: { isDefault: false } });
    }

    return prisma.ollamaModel.upsert({
      where: { name },
      update: { tag, isDefault, isActive: true },
      create: { name, tag, isDefault, isActive: true },
    });
  });

  fastify.delete("/admin/models/:modelId", async (request) => {
    const model = await prisma.ollamaModel.findUnique({
      where: { id: request.params.modelId },
    });
    if (model) {
      try {
        await deleteModel(`${model.name}:${model.tag}`);
      } catch {
        /* ignore */
      }
      await prisma.ollamaModel.delete({ where: { id: model.id } });
    }
    return { success: true };
  });

  fastify.patch("/admin/models/:modelId/default", async (request) => {
    await prisma.ollamaModel.updateMany({ data: { isDefault: false } });
    return prisma.ollamaModel.update({
      where: { id: request.params.modelId },
      data: { isDefault: true },
    });
  });

  // ─── API Logs ─────────────────────────────────────────
  fastify.get("/admin/logs", async (request) => {
    const { page = 1, limit = 100 } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
        skip,
      }),
      prisma.apiLog.count(),
    ]);

    return { logs, total };
  });
}
