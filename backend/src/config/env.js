import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  ollamaApiKey: process.env.OLLAMA_API_KEY || "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID || "",
  adminEmail: process.env.ADMIN_EMAIL || "harryroger798@gmail.com",
  freeQueryLimit: parseInt(process.env.FREE_QUERY_LIMIT || "100", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
