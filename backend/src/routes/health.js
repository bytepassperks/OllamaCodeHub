import { config } from "../config/env.js";

export default async function healthRoutes(fastify) {
  fastify.get("/health", async () => {
    let ollamaStatus = "unknown";
    try {
      const res = await fetch(`${config.ollamaBaseUrl}/api/tags`);
      ollamaStatus = res.ok ? "connected" : "error";
    } catch {
      ollamaStatus = "disconnected";
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      ollama: ollamaStatus,
      version: "1.0.0",
    };
  });
}
