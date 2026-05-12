# OllamaCodeHub

**Affordable SaaS for private Claude-like AI coding in VS Code — powered by Ollama.**

> Inspired by [Run Claude Opus 4.7 Locally with Ollama + Connect with VS Code](https://youtu.be/TLz0mZYgWSE). OllamaCodeHub brings Claude Opus-grade coding AI to your team at a fraction of the cost, with full privacy.

---

## Model: Qwen3.6-35B Claude 4.7 Opus Distilled (APEX)

**[yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality](https://ollama.com/yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality)**

| Spec | Value |
|------|-------|
| Architecture | Qwen 3.5 MoE — 35B total, ~3B active per token |
| Size | 23GB (APEX I-Quality quantized) |
| Context | 256K tokens |
| Experts | 256 routed + shared experts, 40 layers |
| Quantization | APEX (Adaptive Precision for Expert Models) with imatrix calibration |
| Distilled From | Claude 4.7 Opus reasoning |
| License | Apache-2.0 |

**Why this model?**
- **Claude Opus reasoning distilled** — trained to replicate Claude 4.7 Opus reasoning patterns
- **MoE efficiency** — 35B total params but only 3B active per token = fast inference
- **APEX I-Quality** — highest quality quantization tier with imatrix covering chat, code, reasoning, tool calls
- **256K context** — handle entire repositories, not just single files
- **23GB fits Railway's 24GB RAM** allocation

### Sources
1. [Ollama — yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality](https://ollama.com/yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality)
2. [HuggingFace — mudler/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-GGUF](https://huggingface.co/mudler/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-GGUF)
3. [HuggingFace — lordx64/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled](https://huggingface.co/lordx64/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled) (source distillation model)

---

## Features

### User Features
- **Chat UI**: Code generation, debugging, file explanation — streaming responses
- **Model Selector**: Choose from available models (admin can add more)
- **Query History**: Full log of all prompts and responses
- **Code Export**: Download any response as a code snippet
- **VS Code Integration**: Auto-generated Continue `config.json` with your API endpoint
- **Free tier**: 100 queries/day (admin can upgrade users to Pro for unlimited)

### Admin Panel (superadmin)
- **User Management**: Create users, change roles, reset passwords, ban/suspend
- **Query Browser**: View all queries across users
- **Analytics Dashboard**: Usage stats, active users, response times
- **Model Management**: Add/remove/switch Ollama models live
- **API Logs**: Full request/response audit trail

### Security
- Custom JWT authentication (7-day tokens)
- Role-based access control (USER / PRO / ADMIN)
- Rate limiting (200 req/min)
- Helmet security headers
- Hashed passwords (bcrypt, 12 rounds)
- Protected admin routes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Fastify 5, Prisma ORM |
| AI Engine | Ollama (Qwen3.6-35B Claude Opus Distilled) |
| Database | PostgreSQL (Railway) |
| Auth | Custom JWT (email/password) |
| Deploy | Render (frontend) + Railway (backend + Ollama) |

---

## Quick Start (5 minutes)

### Prerequisites
- Node.js 22+
- PostgreSQL database

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
node prisma/seed.js      # Seed admin + model
```

### 3. Run Locally

```bash
# Terminal 1: Ollama
ollama serve
ollama pull yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality

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

1. Create Railway project with PostgreSQL
2. Deploy Ollama service from `ollama/Dockerfile`
3. Deploy backend from `backend/Dockerfile`
4. Set environment variables (see [docs/deploy-guide.md](docs/deploy-guide.md))

### Render (Frontend)

1. Connect GitHub repo, root directory: `frontend`
2. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL

See [docs/deploy-guide.md](docs/deploy-guide.md) for the full deployment guide.

---

## Admin Access

After seeding the database, the admin account is pre-created:

- **Email**: `harryroger798@gmail.com`
- **Password**: `007JamesBond@@` (hashed with bcrypt)

Navigate to `/admin` after logging in. Only users with `ADMIN` role can access admin routes.

Admin can:
- Create new users with passwords
- Upgrade users to PRO (unlimited queries)
- Reset user passwords
- Ban/suspend users

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
│   │   │   ├── login/            # Login page
│   │   │   └── signup/           # Signup page
│   │   ├── components/ui/        # shadcn/ui components
│   │   └── lib/                  # API client, auth, utilities
│   ├── Dockerfile
│   └── render.yaml
├── backend/                 # Fastify API + Prisma
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js           # Login, signup, admin user creation
│   │   │   ├── chat.js           # /v1/chat/completions (OpenAI-compat)
│   │   │   ├── admin.js          # /admin/* endpoints
│   │   │   ├── vscode.js         # VS Code config endpoint
│   │   │   └── health.js         # Health check
│   │   ├── middleware/auth.js    # JWT auth + role guards
│   │   ├── services/ollama.js   # Ollama client
│   │   └── config/               # DB + env config
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.js               # Admin + model seeding
│   ├── Dockerfile
│   └── railway.toml
├── ollama/                  # Ollama deployment
│   ├── Dockerfile
│   ├── entrypoint.sh             # Auto-pull model on start
│   └── railway.toml
├── docs/
│   ├── deploy-guide.md
│   ├── vscode-setup.md
│   └── e2e-test.sh
└── README.md
```

---

## Cost Estimate

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Railway (Ollama + API + Postgres) | Pro | ~$50-70 |
| Render (Frontend) | Starter | $19 |
| **Total** | | **~$70-90/mo** |

Well under the $100/mo target.

---

## API Reference

### Auth
```
POST /auth/login           # { email, password } → { token, user }
POST /auth/signup          # { email, password, name? } → { token, user }
GET  /auth/me              # Get current user (requires Bearer token)
```

### Chat Completions (OpenAI-compatible)
```
POST /v1/chat/completions
Authorization: Bearer <jwt-token>

{
  "model": "yanjia/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-APEX-I-Quality:latest",
  "messages": [{"role": "user", "content": "Write a React hook for..."}],
  "stream": true
}
```

### Models & History
```
GET /v1/models          # List available models
GET /v1/history         # Query history
GET /v1/export/:id      # Export a query
GET /vscode/config      # VS Code Continue config
```

### Admin
```
GET    /admin/users              # List users
POST   /admin/users/create       # Create user with password
POST   /admin/users/:id/password # Reset user password
PATCH  /admin/users/:id/role     # Change role (USER/PRO/ADMIN)
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
