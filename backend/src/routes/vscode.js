import { authenticateUser } from "../middleware/auth.js";
import { signToken } from "../middleware/auth.js";
import { config } from "../config/env.js";

export default async function vscodeRoutes(fastify) {
  fastify.get(
    "/vscode/config",
    { preHandler: [authenticateUser] },
    async (request) => {
      const backendUrl =
        process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : config.nodeEnv === "production"
            ? "https://backend-production-bd0e.up.railway.app"
            : `http://localhost:${config.port}`;

      // Generate a fresh long-lived token for VS Code usage
      const userToken = signToken(request.user);

      const yamlConfig = `name: OllamaCodeHub Agent
version: 0.0.1
schema: v1

models:
  - name: Claude Opus 4.7
    provider: openai
    model: nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull
    apiBase: ${backendUrl}/v1
    apiKey: ${userToken}
    contextLength: 32768
    roles:
      - chat
      - edit
      - apply

rules:
  - >
    You are an expert AI coding agent powered by Claude Opus 4.7.
    You can read files, edit code, create new files, run terminal commands,
    and search the codebase. Always explain your reasoning step by step.
    When editing files, preserve existing code style. Write clean,
    well-structured code with proper error handling.`;

      return {
        yamlConfig,
        backendUrl,
        token: userToken,
        instructions: [
          "1. Install the 'Continue' extension in VS Code.",
          "2. Press Ctrl+Shift+P → type 'Continue: Open config.yaml' → click it.",
          "3. Select all (Ctrl+A), delete, then paste the YAML config above.",
          "4. Save (Ctrl+S). Open a project folder (File → Open Folder).",
          "5. Switch to 'Agent' mode in the Continue chat dropdown for Devin-like coding!",
          "6. Token expires in 7 days. Revisit this page to regenerate.",
        ],
      };
    }
  );
}
