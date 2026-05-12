# OllamaCodeHub

**Affordable SaaS for private Claude-like AI coding in VS Code — powered by Ollama.**

> Inspired by the video [Run Claude Opus 4.7 Locally with Ollama + Connect Claude Opus 4.7 with VS Code For Coding](https://youtu.be/TLz0mZYgWSE). OllamaCodeHub brings enterprise-grade coding AI to your team at a fraction of the cost, with full privacy.

---

## Model Benchmarks & Selection

### Primary Model: Qwen3-Coder 30B (MoE)

After benchmarking available Ollama models for coding/agent tasks (May 2026), **Qwen3-Coder 30B** was selected as the best local model closest to Claude Opus 4.7 for coding.

| Model | HumanEval | SWE-Bench Verified | LiveCodeBench | VRAM (Q4) | Ollama Size |
|-------|-----------|-------------------|---------------|-----------|-------------|
| **Qwen3-Coder 30B** | 90%+ | Trained on SWE-Bench | Top-tier | 18GB | 19GB |
| Qwen2.5-Coder 32B | 92.7% | N/A | Competitive | 22GB | 20GB |
| DeepSeek-R1 32B | ~85% | N/A | 72.6% | 20GB | 20GB |
| CodeLlama 13B (fallback) | ~62% | N/A | N/A | 8GB | 7.4GB |

**Why Qwen3-Coder 30B?**
- **MoE Architecture**: 30B total params, only 3.3B active → fast inference even on limited hardware
- **256K native context**: Handle entire repositories, not just single files
- **SWE-Bench trained**: Reinforcement learning specifically on real-world software engineering tasks
- **19GB at Q4_K_M**: Fits comfortably in Railway's 24GB RAM allocation
- **5.3M+ Ollama downloads**: Well-tested, community-proven

### Benchmark Sources
1. [Morph — Best Ollama Models 2026](https://www.morphllm.com/best-ollama-models) (April 2026, real hardware testing)
2. [BenchLM.ai — SWE-bench & LiveCodeBench Leaderboard](https://benchlm.ai/coding) (May 2026, 95+ models ranked)
3. [Ollama Model Library — qwen3-coder:30b](https://ollama.com/library/qwen3-coder:30b) (official specs)

### Fallback Model: CodeLlama 13B
Lighter model for faster responses when full reasoning isn't needed. 7.4GB, fits alongside the primary model.

---

## Features

### User Features
- **Chat UI**: Code generation, debugging, file explanation — streaming responses
- **Model Selector**: Switch between Qwen3-Coder 30B and CodeLlama 13B
- **Query History**: Full log of all prompts and responses
- **Code Export**: Download any response as a code snippet
- **VS Code Integration**: Auto-generated Continue `config.json` with your API endpoint
- **Pro Plan ($9/mo)**: Unlimited queries (free tier: 100/day)

### Admin Panel (superadmin)
- **User Management**: View all users, change roles, ban/suspend accounts
- **Query Browser**: View all queries across users
- **Analytics Dashboard**: Usage stats, active users, response times
- **Model Management**: Add/remove/switch Ollama models live
- **Subscription Management**: Upgrade/downgrade users, cancel subscriptions
- **API Logs**: Full request/response audit trail

### Security
- Clerk authentication with role-based access (user/pro/admin)
- Rate limiting (200 req/min)
- Helmet security headers
- API key validation
- Hashed admin password (bcrypt, 12 rounds)
- Protected admin routes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Fastify 5, Prisma ORM |
| AI Engine | Ollama (qwen3-coder:30b + codellama:13b) |
| Database | PostgreSQL (Railway) |
| Auth | Clerk (free tier) |
| Payments | Stripe (checkout + webhooks) |
| Deploy | Render (frontend) + Railway (backend + Ollama) |

---

## Quick Start (5 minutes)

### Prerequisites
- Node.js 22+
- PostgreSQL database
- Clerk account (free)
- Stripe account (test mode)

### 1. Clone & Install

```bash
git clone https://github.com/bytepassperks/OllamaCodeHub.git
cd OllamaCodeHub

# Backend
cd backend && npm install && npx prisma generate
cp .env.example .env  # Fill in your values

# Frontend
cd ../frontend && npm install
cp .env.example .env.local  # Fill in your values
```

### 2. Setup Database

```bash
cd backend
npx prisma db push       # Create tables
node prisma/seed.js      # Seed admin + models
```

### 3. Run Locally

```bash
# Terminal 1: Ollama
ollama serve
ollama pull qwen3-coder:30b

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### 4. VS Code Setup

1. Install [Continue extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue)
2. Go to `/vscode-setup` in the dashboard
3. Copy the auto-generated `config.json`
4. Paste into Continue settings (`Ctrl+Shift+P` → "Continue: Open config.json")

See [docs/vscode-setup.md](docs/vscode-setup.md) for detailed instructions.

---

## Deployment

### Railway (Backend + Ollama + Postgres)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

1. Create Railway project with PostgreSQL
2. Deploy Ollama service from `ollama/Dockerfile`
3. Deploy backend from `backend/Dockerfile`
4. Set environment variables (see [docs/deploy-guide.md](docs/deploy-guide.md))

### Render (Frontend)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Connect GitHub repo, root directory: `frontend`
2. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
3. Add Clerk keys

See [docs/deploy-guide.md](docs/deploy-guide.md) for the full deployment guide.

---

## Admin Access

After seeding the database, the admin account is pre-created:

- **Email**: `harryroger798@gmail.com`
- **Password**: `007JamesBond@@` (hashed with bcrypt)

Navigate to `/admin` after logging in. Admin access requires the `ADMIN` role in Clerk.

---

## Project Structure

```
OllamaCodeHub/
├── frontend/                # Next.js 15 + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── dashboard/        # Chat UI + history
│   │   │   ├── admin/            # Admin panel
│   │   │   ├── vscode-setup/     # VS Code config generator
│   │   │   ├── sign-in/          # Clerk sign-in
│   │   │   └── sign-up/          # Clerk sign-up
│   │   ├── components/ui/        # shadcn/ui components
│   │   ├── lib/                  # API client, utilities
│   │   └── middleware.ts         # Route protection
│   ├── Dockerfile
│   └── render.yaml
├── backend/                 # Fastify API + Prisma
│   ├── src/
│   │   ├── routes/
│   │   │   ├── chat.js           # /v1/chat/completions (OpenAI-compat)
│   │   │   ├── admin.js          # /admin/* endpoints
│   │   │   ├── stripe.js         # Stripe checkout + webhooks
│   │   │   ├── vscode.js         # VS Code config endpoint
│   │   │   └── health.js         # Health check
│   │   ├── middleware/auth.js    # Clerk auth + role guards
│   │   ├── services/             # Ollama + Stripe clients
│   │   └── config/               # DB + env config
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.js               # Admin + model seeding
│   ├── Dockerfile
│   └── railway.toml
├── ollama/                  # Ollama deployment
│   ├── Dockerfile
│   ├── entrypoint.sh             # Auto-pull models on start
│   └── railway.toml
├── docs/
│   ├── deploy-guide.md
│   └── vscode-setup.md
└── README.md
```

---

## Cost Estimate

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Railway (Ollama + API + Postgres) | Pro | ~$50-70 |
| Render (Frontend) | Starter | $19 |
| Clerk | Free tier | $0 |
| Stripe | Pay-as-you-go | ~$0 |
| **Total** | | **~$70-90/mo** |

Well under the $100/mo target.

---

## API Reference

### Chat Completions (OpenAI-compatible)
```
POST /v1/chat/completions
Authorization: Bearer <clerk-jwt>

{
  "model": "qwen3-coder:30b",
  "messages": [{"role": "user", "content": "Write a React hook for..."}],
  "stream": true
}
```

### Models
```
GET /v1/models          # List available models
GET /v1/history         # Query history
GET /v1/export/:id      # Export a query
GET /vscode/config      # VS Code Continue config
```

### Admin
```
GET    /admin/users              # List users
PATCH  /admin/users/:id/role     # Change role
PATCH  /admin/users/:id/ban      # Ban/unban
GET    /admin/analytics          # Usage stats
GET    /admin/models             # Model management
POST   /admin/models             # Add model
DELETE /admin/models/:id         # Remove model
GET    /admin/logs               # API audit logs
```

---

## License

MIT
