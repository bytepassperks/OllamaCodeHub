# OllamaCodeHub — Deployment Guide

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│   Frontend       │────▶│   Backend API    │────▶│   Ollama       │
│   (Render)       │     │   (Railway)      │     │   (Railway)    │
│   Next.js 15     │     │   Fastify        │     │   qwen3-coder  │
└─────────────────┘     └──────┬───────────┘     └───────────────┘
                               │
                        ┌──────▼───────────┐
                        │   PostgreSQL      │
                        │   (Railway)       │
                        └──────────────────┘
```

## 1. Railway Setup (Backend + Ollama + Postgres)

### Prerequisites
- Railway Pro account ($20/mo credit)
- GitHub repo connected

### Steps

1. **Create a new Railway project**
2. **Add PostgreSQL**: Click "New" → "Database" → "PostgreSQL"
3. **Deploy Ollama service**:
   - Click "New" → "Docker" → Use `ollama/Dockerfile`
   - Add a volume mounted at `/root/.ollama`
   - Set env: `OLLAMA_HOST=0.0.0.0:11434`
   - Allocate 24GB RAM, 24 CPU
4. **Deploy Backend API**:
   - Click "New" → "Service" → Select the repo
   - Root directory: `backend`
   - Set environment variables:
     ```
     PORT=3001
     NODE_ENV=production
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     OLLAMA_BASE_URL=http://ollama.railway.internal:11434
     CLERK_SECRET_KEY=sk_live_xxx
     STRIPE_SECRET_KEY=sk_live_xxx
     STRIPE_WEBHOOK_SECRET=whsec_xxx
     STRIPE_PRO_PRICE_ID=price_xxx
     ADMIN_EMAIL=harryroger798@gmail.com
     FRONTEND_URL=https://your-frontend.onrender.com
     ```
5. **Run migrations**: `npx prisma migrate deploy && node prisma/seed.js`

### Environment Variables Reference

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `OLLAMA_BASE_URL` | Backend | Internal Ollama URL |
| `CLERK_SECRET_KEY` | Backend | Clerk API secret |
| `STRIPE_SECRET_KEY` | Backend | Stripe secret key |
| `ADMIN_EMAIL` | Backend | Pre-seeded admin email |

## 2. Render Setup (Frontend)

1. Connect your GitHub repo
2. Set root directory to `frontend`
3. Build command: `npm ci && npm run build`
4. Start command: `npm start`
5. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
   CLERK_SECRET_KEY=sk_live_xxx
   ```

## 3. Clerk Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Enable email/password sign-in
3. Create custom roles: `user`, `pro`, `admin`
4. Copy publishable key and secret key

## 4. Stripe Setup

1. Create products in Stripe dashboard:
   - Pro Plan: $9/mo recurring
2. Copy the price ID for `STRIPE_PRO_PRICE_ID`
3. Set up webhook endpoint: `https://your-backend.railway.app/stripe/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## 5. Admin Access

After seeding, log in with:
- Email: `harryroger798@gmail.com`
- Password: `007JamesBond@@`

Navigate to `/admin` for the full management panel.

## Cost Estimate

| Service | Plan | Cost/mo |
|---------|------|---------|
| Railway (Ollama + API + Postgres) | Pro | ~$50-70 |
| Render (Frontend) | Starter | $19 |
| Clerk | Free tier | $0 |
| Stripe | Pay-as-you-go | ~$0 |
| **Total** | | **~$70-90/mo** |
