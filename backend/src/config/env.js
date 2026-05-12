import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  adminEmail: process.env.ADMIN_EMAIL || "harryroger798@gmail.com",
  adminPassword: process.env.ADMIN_PASSWORD || "007JamesBond@@",
  freeQueryLimit: parseInt(process.env.FREE_QUERY_LIMIT || "100", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
