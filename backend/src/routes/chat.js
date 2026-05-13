import { authenticateUser, checkQueryLimit } from "../middleware/auth.js";
import { chatCompletion } from "../services/ollama.js";
import prisma from "../config/database.js";

export default async function chatRoutes(fastify) {
  fastify.post(
    "/v1/chat/completions",
    { preHandler: [authenticateUser, checkQueryLimit] },
    async (request, reply) => {
      const { model, messages, stream, tools, tool_choice } = request.body;
      const user = request.user;
      const startTime = Date.now();

      const defaultModel = await prisma.ollamaModel.findFirst({ where: { isDefault: true, isActive: true } });
      const selectedModel = model || (defaultModel ? `${defaultModel.name}:${defaultModel.tag}` : "qwen2.5-coder:3b");

      const modelName = selectedModel.includes(":") ? selectedModel.split(":").slice(0, -1).join(":") : selectedModel;
      const dbModel = await prisma.ollamaModel.findFirst({
        where: { name: modelName, isActive: true },
      });
      if (!dbModel) {
        return reply.code(400).send({ error: `Model "${selectedModel}" is not available` });
      }

      const ollamaModel = `${dbModel.name}:${dbModel.tag}`;

      if (stream) {
        const response = await chatCompletion(ollamaModel, messages, true, tools, tool_choice);
        const origin = request.headers.origin || "*";
        reply.raw.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let inThink = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });

            // Process each SSE line, stripping <think> content
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) {
                reply.raw.write(line + "\n");
                continue;
              }

              if (line.trim() === "data: [DONE]") {
                reply.raw.write(line + "\n");
                continue;
              }

              try {
                const data = JSON.parse(line.slice(6));
                const delta = data.choices?.[0]?.delta;
                const content = delta?.content || "";

                if (!content) {
                  reply.raw.write(line + "\n");
                  continue;
                }

                // Handle <think> tag filtering
                let filtered = content;

                if (filtered.includes("<think>")) {
                  inThink = true;
                  filtered = filtered.split("<think>")[0];
                }
                if (filtered.includes("</think>")) {
                  inThink = false;
                  filtered = filtered.split("</think>").pop();
                }
                if (inThink) {
                  continue; // Skip think content entirely
                }

                if (filtered) {
                  data.choices[0].delta.content = filtered;
                  reply.raw.write("data: " + JSON.stringify(data) + "\n");
                  fullResponse += filtered;
                }
              } catch {
                reply.raw.write(line + "\n");
              }
            }
          }
        } finally {
          reply.raw.end();
        }

        const durationMs = Date.now() - startTime;
        await prisma.query.create({
          data: {
            userId: user.id,
            model: ollamaModel,
            prompt: messages[messages.length - 1]?.content || "",
            response: fullResponse.slice(0, 10000),
            tokens: Math.ceil(fullResponse.length / 4),
            durationMs,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { queriesUsed: { increment: 1 } },
        });

        return;
      }

      const result = await chatCompletion(ollamaModel, messages, false, tools, tool_choice);
      const durationMs = Date.now() - startTime;

      const responseText =
        result.choices?.[0]?.message?.content || "";

      await prisma.query.create({
        data: {
          userId: user.id,
          model: ollamaModel,
          prompt: messages[messages.length - 1]?.content || "",
          response: responseText.slice(0, 10000),
          tokens: result.usage?.total_tokens || 0,
          durationMs,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { queriesUsed: { increment: 1 } },
      });

      return result;
    }
  );

  fastify.get(
    "/v1/models",
    { preHandler: [authenticateUser] },
    async () => {
      const models = await prisma.ollamaModel.findMany({
        where: { isActive: true },
        orderBy: { isDefault: "desc" },
      });
      return {
        object: "list",
        data: models.map((m) => ({
          id: `${m.name}:${m.tag}`,
          object: "model",
          created: Math.floor(m.createdAt.getTime() / 1000),
          owned_by: "ollama",
          isDefault: m.isDefault,
        })),
      };
    }
  );

  fastify.get(
    "/v1/history",
    { preHandler: [authenticateUser] },
    async (request) => {
      const { limit = 50, offset = 0 } = request.query;
      const queries = await prisma.query.findMany({
        where: { userId: request.user.id },
        orderBy: { createdAt: "desc" },
        take: Math.min(parseInt(limit), 100),
        skip: parseInt(offset),
      });
      const total = await prisma.query.count({ where: { userId: request.user.id } });
      return { queries, total };
    }
  );

  fastify.get(
    "/v1/export/:queryId",
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const query = await prisma.query.findFirst({
        where: { id: request.params.queryId, userId: request.user.id },
      });
      if (!query) return reply.code(404).send({ error: "Query not found" });
      return {
        prompt: query.prompt,
        response: query.response,
        model: query.model,
        tokens: query.tokens,
        createdAt: query.createdAt,
      };
    }
  );
}
