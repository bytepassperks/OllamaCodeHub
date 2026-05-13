import { authenticateUser } from "../middleware/auth.js";
import { config } from "../config/env.js";

export default async function vscodeRoutes(fastify) {
  fastify.get(
    "/vscode/config",
    { preHandler: [authenticateUser] },
    async (request) => {
      const backendUrl = config.frontendUrl.includes("localhost")
        ? `http://localhost:${config.port}`
        : config.frontendUrl.replace(/:\d+$/, `:${config.port}`);

      const continueConfig = {
        models: [
          {
            title: "OllamaCodeHub — Qwen3.6-35B Claude Opus Distilled",
            provider: "openai",
            model: "qwen2.5-coder:7b",
            apiBase: `${backendUrl}/v1`,
            apiKey: "your-jwt-token",
            contextLength: 32768,
          },
        ],
        tabAutocompleteModel: {
          title: "OllamaCodeHub Autocomplete",
          provider: "openai",
          model: "qwen2.5-coder:7b",
          apiBase: `${backendUrl}/v1`,
          apiKey: "your-jwt-token",
        },
      };

      return {
        config: continueConfig,
        instructions: [
          "1. Install the 'Continue' extension in VS Code.",
          "2. Open Continue settings (Ctrl+Shift+P → 'Continue: Open config.json').",
          "3. Replace the contents with the config above.",
          "4. Replace 'your-jwt-token' with your token from: localStorage.getItem('ollamacodehub_token')",
          "5. Start coding with AI-powered autocomplete and chat!",
        ],
      };
    }
  );
}
