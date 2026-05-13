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
            ? "https://backend-production-57447.up.railway.app"
            : `http://localhost:${config.port}`;

      // Generate a fresh long-lived token for VS Code usage
      const userToken = signToken(request.user);

      const continueConfig = {
        models: [
          {
            title: "OllamaCodeHub — qwen2.5-coder:3b",
            provider: "openai",
            model: "qwen2.5-coder:3b",
            apiBase: `${backendUrl}/v1`,
            apiKey: userToken,
            contextLength: 32768,
          },
        ],
        tabAutocompleteModel: {
          title: "OllamaCodeHub Autocomplete",
          provider: "openai",
          model: "qwen2.5-coder:3b",
          apiBase: `${backendUrl}/v1`,
          apiKey: userToken,
        },
      };

      return {
        config: continueConfig,
        backendUrl,
        token: userToken,
        instructions: [
          "1. Install the 'Continue' extension in VS Code (ext install Continue.continue).",
          "2. Open Continue settings: Ctrl+Shift+P → 'Continue: Open config.json'.",
          "3. Paste the config JSON above — your token is already filled in.",
          "4. Save the file and start coding with AI-powered autocomplete and chat!",
          `5. Your backend URL: ${backendUrl}`,
          "6. Token expires in 7 days. Revisit this page to regenerate.",
        ],
      };
    }
  );
}
