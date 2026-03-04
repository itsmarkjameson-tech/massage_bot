# Deployment Guide

This guide explains how to deploy the Massage Bot application using free-tier services.

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│    Koyeb    │────▶│  Supabase   │
│  (Frontend) │     │  (Backend)  │     │ (PostgreSQL)│
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Upstash   │
                    │    Redis    │
                    └─────────────┘
```

## Services Used

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Vercel** | Frontend hosting | 100GB bandwidth |
| **Koyeb** | Backend API | 2 micro instances |
| **Supabase** | PostgreSQL database | 500MB storage |
| **Upstash** | Redis for BullMQ | 10,000 ops/day |

---

## Prerequisites

- GitHub account
- Supabase account (https://supabase.com)
- Upstash account (https://upstash.com)
- Koyeb account (https://koyeb.com) - use GitHub signup, no card required

---

## Step 1: Setup Supabase (PostgreSQL)

1. Go to https://supabase.com and create a new project
2. Wait for the database to be provisioned
3. Go to **Project Settings** → **Database** → **Connection string**
4. Select **URI** format
5. Copy the connection string (replace `[YOUR-PASSWORD]` with your actual password)

Example:
```
postgresql://postgres:your-password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Save this for later - you'll need it as `DATABASE_URL`.

---

## Step 2: Setup Upstash (Redis)

1. Go to https://upstash.com and create a new Redis database
2. Select **Global** type (for multi-region)
3. Choose a region close to your users (e.g., Frankfurt for EU)
4. Go to your database → **Details**
5. Copy the **Redis URL** (starts with `rediss://`)

Example:
```
rediss://default:your-password@your-host.upstash.io:6379
```

Save this for later - you'll need it as `REDIS_URL`.

---

## Step 3: Deploy Backend to Koyeb

### Option A: Using GitHub Integration (Recommended)

1. Fork/clone this repository to your GitHub account
2. Go to https://app.koyeb.com
3. Click **Create App**
4. Select **GitHub** as deployment method
5. Connect your GitHub account and select this repository
6. Configure:
   - **Name**: `massage-bot-api`
   - **Branch**: `master`
   - **Dockerfile**: `./apps/server/Dockerfile`
   - **Port**: `3000`
   - **Health Check**: `/health`

7. Add Environment Variables:

   | Variable | Value | Description |
   |----------|-------|-------------|
   | `NODE_ENV` | `production` | Environment mode |
   | `PORT` | `3000` | Server port |
   | `DATABASE_URL` | *from Supabase* | PostgreSQL connection |
   | `REDIS_URL` | *from Upstash* | Redis connection |
   | `BOT_TOKEN` | *from @BotFather* | Telegram bot token |
   | `JWT_SECRET` | *generate random* | JWT signing key |
   | `WEBAPP_URL` | *your Vercel URL* | Frontend URL |
   | `BOT_WEBHOOK_URL` | *your Koyeb URL* | Backend URL |
   | `CORS_ORIGIN` | *your Vercel URL* | Allowed CORS origin |
   | `ADMIN_TELEGRAM_ID` | *your Telegram ID* | Admin user ID |

8. Click **Deploy**

### Option B: Using koyeb.yaml

If you have Koyeb CLI installed:

```bash
koyeb login
koyeb app init --config koyeb.yaml
```

Then set environment variables in the Koyeb dashboard.

---

## Step 4: Setup Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow instructions
3. Copy the bot token (format: `123456789:ABCdef...`)
4. Set this as `BOT_TOKEN` in Koyeb environment variables
5. Get your Telegram ID from **@userinfobot**
6. Set this as `ADMIN_TELEGRAM_ID` in Koyeb

---

## Step 5: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variable:
   - `VITE_API_URL`: Your Koyeb backend URL (e.g., `https://massage-bot-api-xxx.koyeb.app`)

5. Deploy

---

## Step 6: Update Environment Variables

After first deployment:

1. Copy your **Koyeb URL** (e.g., `https://massage-bot-api-xxx.koyeb.app`)
2. Update `BOT_WEBHOOK_URL` in Koyeb: `https://massage-bot-api-xxx.koyeb.app`
3. Copy your **Vercel URL** (e.g., `https://massage-bot.vercel.app`)
4. Update in Koyeb:
   - `WEBAPP_URL`: `https://massage-bot.vercel.app`
   - `CORS_ORIGIN`: `https://massage-bot.vercel.app`

Redeploy if necessary.

---

## Step 7: Initialize Database

Run migrations and seed data:

```bash
# Local setup (if you have DATABASE_URL in .env)
cd apps/server
pnpm install
pnpm db:generate
pnpm db:migrate:prod
pnpm db:seed

# Or use Supabase SQL Editor to run migration.sql manually
```

---

## Monitoring & Logs

### Koyeb Dashboard
- Go to https://app.koyeb.com
- Select your app
- View logs, metrics, and scale settings

### Health Check
Test your deployment:
```bash
curl https://your-api.koyeb.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

---

## Troubleshooting

### Database Connection Issues
- Ensure you're using **Connection Pooler** URL from Supabase (port 6543)
- Check that password is correct (no special characters issues)
- Verify `pgbouncer=true` parameter in URL

### Redis Connection Issues
- Ensure URL starts with `rediss://` (double s for SSL)
- Check Upstash database is in active state

### CORS Errors
- Verify `CORS_ORIGIN` matches your Vercel URL exactly
- Include `https://` protocol

### Telegram Webhook Issues
- Ensure `BOT_WEBHOOK_URL` is set correctly
- Check bot token is valid
- Verify HTTPS is working (Telegram requires SSL)

---

## Free Tier Limits

| Service | Limit | Action if exceeded |
|---------|-------|-------------------|
| Koyeb | 2 micro instances | Upgrade to paid |
| Supabase | 500MB DB, 2GB egress | Upgrade or optimize |
| Upstash | 10,000 ops/day | Upgrade or reduce jobs |
| Vercel | 100GB bandwidth | Upgrade or CDN |

---

## Updating Deployment

Just push to GitHub - all services auto-deploy:

```bash
git add .
git commit -m "update: your changes"
git push origin master
```

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Start only backend
pnpm dev:bot

# Start only frontend
pnpm dev:web
```

See `.env.example` files for required environment variables.
