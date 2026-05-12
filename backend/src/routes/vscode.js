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
            title: "OllamaCodeHub — Qwen3-Coder 30B",
            provider: "openai",
            model: "qwen3-coder:30b",
            apiBase: `${backendUrl}/v1`,
            apiKey: "your-clerk-jwt-token",
            contextLength: 32768,
          },
          {
            title: "OllamaCodeHub — CodeLlama 13B",
            provider: "openai",
            model: "codellama:13b",
            apiBase: `${backendUrl}/v1`,
            apiKey: "your-clerk-jwt-token",
            contextLength: 16384,
          },
        ],
        tabAutocompleteModel: {
          title: "OllamaCodeHub Autocomplete",
          provider: "openai",
          model: "qwen3-coder:30b",
          apiBase: `${backendUrl}/v1`,
          apiKey: "your-clerk-jwt-token",
        },
      };

      return {
        config: continueConfig,
        instructions: [
          "1. Install the 'Continue' extension in VS Code.",
          "2. Open Continue settings (Ctrl+Shift+P → 'Continue: Open config.json').",
          "3. Replace the contents with the config above.",
          "4. Replace 'your-clerk-jwt-token' with your API token from the dashboard.",
          "5. Start coding with AI-powered autocomplete and chat!",
        ],
      };
    }
  );
}
