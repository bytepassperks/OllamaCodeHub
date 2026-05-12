import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import { config } from "./config/env.js";
import prisma from "./config/database.js";

import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import stripeRoutes from "./routes/stripe.js";
import vscodeRoutes from "./routes/vscode.js";
import healthRoutes from "./routes/health.js";

const fastify = Fastify({
  logger: true,
  bodyLimit: 5 * 1024 * 1024,
});

await fastify.register(cors, {
  origin: [config.frontendUrl, "http://localhost:3000"],
  credentials: true,
});

await fastify.register(helmet, { contentSecurityPolicy: false });

await fastify.register(rateLimit, {
  max: 200,
  timeWindow: "1 minute",
});

// API logging middleware
fastify.addHook("onResponse", async (request, reply) => {
  if (request.url.startsWith("/health")) return;
  try {
    await prisma.apiLog.create({
      data: {
        userId: request.user?.id || null,
        method: request.method,
        path: request.url,
        statusCode: reply.statusCode,
        durationMs: Math.round(reply.elapsedTime || 0),
        ip: request.ip,
      },
    });
  } catch {
    /* non-critical */
  }
});

await fastify.register(healthRoutes);
await fastify.register(chatRoutes);
await fastify.register(adminRoutes);
await fastify.register(stripeRoutes);
await fastify.register(vscodeRoutes);

const start = async () => {
  try {
    await prisma.$connect();
    fastify.log.info("Database connected");

    await fastify.listen({ port: config.port, host: "0.0.0.0" });
    fastify.log.info(`Server running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
