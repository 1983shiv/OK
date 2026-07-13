<div align="center">
  <img src="https://img.shields.io/badge/status-building-22c55e?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-6366f1?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/powered_by-NestJS-ea2845?style=flat-square&logo=nestjs" alt="NestJS">
  <img src="https://img.shields.io/badge/frontend-Next.js-000000?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/ORM-Prisma-2d3748?style=flat-square&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/database-PostgreSQL-316192?style=flat-square&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/cache-Redis-dc382d?style=flat-square&logo=redis" alt="Redis">
  <img src="https://img.shields.io/badge/monorepo-Turborepo-ef4444?style=flat-square&logo=turborepo" alt="Turborepo">
  <br>
  <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/-JWT_RS256-000000?style=flat-square&logo=jsonwebtokens" alt="JWT">
  <img src="https://img.shields.io/badge/-TanStack_Query-FF4154?style=flat-square&logo=react-query" alt="TanStack Query">
  <img src="https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/-OpenAI_GPT--4o-412991?style=flat-square&logo=openai" alt="OpenAI">
  <img src="https://img.shields.io/badge/-Razorpay-02042B?style=flat-square&logo=razorpay" alt="Razorpay">
</div>

<br>

# 🏦 OptionKart — NSE Options Analytics Platform

**Turn raw NSE F&O data into institutional-grade trading signals.** OptionKart is a full-stack web application purpose-built for Indian retail traders who want data-driven options insights — without the Bloomberg terminal price tag.

> ⚡ Real-time Put/Call Ratio · Max Pain · OI Build-up · AI-powered market briefs · Unusual activity detection

---

## ✨ Features

### 📊 Live Market Intelligence

- **Options Chain** — Real-time streaming chain with OI, volume, IV, Greeks
- **Put/Call Ratio** — Live PCR with historical trend charts
- **Max Pain** — Automatic calculation pinned to ATM strikes
- **OI Support & Resistance** — Detect whale-level OI concentration levels
- **Unusual Activity Scanner** — Flag abnormal OI/volume spikes across strikes

### 🤖 AI-Powered Insights

- **Chat Interface** — Ask natural-language questions about the market
- **Strategy Suggestions** — Get option strategies based on current sentiment
- **Daily Briefs** — Auto-generated pre-market summaries via GPT-4o-mini
- **Grounded Context** — AI responses anchored to live data, not hallucinations

### 📈 Advanced Analytics (Starter+)

- **OI History** — Time-series OI visualization per strike
- **PCR History** — 7/30/90 day PCR trends
- **OI Heatmap** — Visualize contract concentration across strikes & expiries
- **Volume Profile** — High-volume node detection

### 🔔 Smart Alerts & Watchlist

- **Conditional Alerts** — Trigger on OI change %, PCR threshold, price breach
- **Multi-channel** — Email + Telegram (Pro+) delivery
- **Watchlist Management** — Track your favorite strikes across indices
- **Alert History** — Review all past triggers with context snapshots

### 🛡️ Enterprise-Grade Auth

- **Magic Link** — Passwordless email login (Resend)
- **Google OAuth** — One-click social login
- **JWT RS256** — Asymmetric token signing, 15-min access + 7-day refresh
- **Rate Limited** — Redis-backed rate limiting on sensitive endpoints

### 💳 Freemium Monetization

|                    | Free       | Starter   | Pro       | Elite         |
| ------------------ | ---------- | --------- | --------- | ------------- |
| **Price**          | ₹0         | ₹199/mo   | ₹499/mo   | ₹999/mo       |
| **Watchlist**      | 5 items    | 15 items  | 30 items  | 50 items      |
| **Alerts**         | 3 active   | 10 active | 25 active | Unlimited     |
| **AI queries/day** | 5          | 30        | 100       | 300           |
| **History**        | Today only | 7 days    | 30 days   | 90 days + CSV |
| **Telegram**       | —          | —         | ✅        | ✅            |
| **BYO OpenAI key** | —          | —         | —         | ✅            |

---

## 🧱 Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Turborepo (pnpm)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐ │
│  │   apps/web  │  │  apps/api   │  │ packages │  │ packages │ │
│  │  Next.js 16 │  │  NestJS 11  │  │  /types  │  │ /utils   │ │
│  │  (App Rtr)  │  │  (REST)     │  │  (TS IF) │  │ (Finance)│ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┘  └──────────┘ │
│         │                │                                      │
│         │    Axios +     │                                      │
│         │   TanStack     │                                      │
│         │    Query       │                                      │
│         └────────┬───────┘                                      │
└──────────────────┼──────────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌────────┐  ┌───────────┐  ┌──────────┐
│ Redis  │  │ PostgreSQL│  │ MongoDB  │
│ Cache  │  │ ║ Prisma  │  │ (History)│
│ Queue  │  │ 9 models  │  │ 3 colls  │
└────────┘  └───────────┘  └──────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   ┌────────────┐   ┌──────────────┐
   │ Upstox API │   │  OpenAI API  │
   │ (Market)   │   │  (GPT-4o-mini)│
   └────────────┘   └──────────────┘
```

### 🔧 Tech Stack

| Layer            | Tech                       | Purpose                             |
| ---------------- | -------------------------- | ----------------------------------- |
| **Frontend**     | Next.js 16, TypeScript 5   | SSR dashboard, App Router           |
| **State & Data** | TanStack Query 5, Axios    | Cached fetching, silent 401 refresh |
| **Backend**      | NestJS 11, TypeScript      | Modular REST API (14 modules)       |
| **Primary DB**   | PostgreSQL 16 + Prisma 7   | Users, subs, alerts, watchlists     |
| **Document DB**  | MongoDB 7 + Mongoose 8     | Market snapshots, AI logs           |
| **Cache**        | Redis 7 + ioredis + BullMQ | Live data, sessions, queues         |
| **Auth**         | Jose (JWT RS256)           | Magic link, Google OAuth            |
| **AI**           | OpenAI GPT-4o-mini         | Chat, briefs, strategy              |
| **Payments**     | Razorpay SDK               | Subscription management             |
| **Infra**        | Docker, Turborepo          | Local dev, monorepo builds          |

---

## 🚀 Quick Start

```bash
# Clone & install
pnpm install

# Start infrastructure (Postgres + Mongo + Redis)
docker compose up -d

# Generate Prisma client & apply migrations
pnpm --filter @optionkart/api exec prisma generate
pnpm --filter @optionkart/api exec prisma migrate dev --name init

# Start backend (port 3001)
pnpm --filter @optionkart/api start:dev

# Start frontend (port 3000) — new terminal
pnpm --filter @optionkart/web dev
```

### 📁 Project Structure

```
optionkart/
├── apps/
│   ├── web/              # Next.js frontend (dashboard, chain, charts, AI)
│   └── api/              # NestJS backend (auth, market, user, alerts, subs, AI)
├── packages/
│   ├── types/            # Shared TypeScript interfaces & enums
│   └── utils/            # Pure financial calculations (PCR, Max Pain, sentiment)
├── docker-compose.yml    # Postgres 16 + Mongo 7 + Redis 7
├── turbo.json            # Turborepo pipeline config
└── pnpm-workspace.yaml   # Monorepo workspace config
```

---

## 📊 What Makes This Stand Out

| Aspect                    | Detail                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------ |
| **Real-world problem**    | Indian F&O market sees $4B+ daily premium — retail traders lack accessible analytics |
| **Production-grade**      | Health checks, error enveloping, silent token refresh, rate limiting, RBAC           |
| **Clean monorepo**        | Turborepo caching, shared types, pure utility functions, separate concerns           |
| **Data pipeline**         | 3-min polling → Redis (90s TTL) → MongoDB snapshots → cache-miss fallback            |
| **AI with safeguards**    | Grounded context, disclaimers, daily quota enforcement, cache dedup                  |
| **Freemium model**        | Razorpay subscriptions, plan gating decorators, webhook verification                 |
| **TypeScript everywhere** | Zod env validation, strict mode, class-validator DTOs, shared interfaces             |

---

## 📈 API Overview

All endpoints under `/v1/*` with consistent envelope:

```json
// ✅ Success
{ "success": true, "data": { ... }, "timestamp": "2026-07-13T10:30:00.000Z" }

// ❌ Error
{ "success": false, "error": { "code": 404, "message": "...", "path": "/v1/...", "timestamp": "..." } }
```

| Category          | Public                                | Authenticated        | Plan-Gated                                    |
| ----------------- | ------------------------------------- | -------------------- | --------------------------------------------- |
| **Health**        | `GET /health`                         | —                    | —                                             |
| **Market**        | Dashboard, chain, spot, PCR, Max Pain | —                    | History, heatmap, unusual activity (Starter+) |
| **Auth**          | Magic link, Google, refresh           | Logout               | —                                             |
| **User**          | —                                     | Profile, preferences | —                                             |
| **Watchlist**     | —                                     | CRUD                 | —                                             |
| **Alerts**        | —                                     | CRUD, history        | —                                             |
| **Subscriptions** | —                                     | Create, cancel       | —                                             |
| **AI**            | —                                     | Chat (all plans)     | Strategy, daily brief (Pro+)                  |

Full 28-endpoint REST API with plan-based feature gating.

---

## 🔐 Security & Reliability

- **JWT RS256** asymmetric signing — private key never leaves the server
- **HttpOnly cookies** for refresh tokens — immune to XSS
- **Rate limiting** — Redis-backed sliding window (3 magic links / 10 min per email)
- **Razorpay webhooks** — HMAC-SHA256 signature verification + idempotency dedup
- **CORS** — strict origin whitelist
- **Helmet** — security headers (XSS, clickjacking, MIME sniffing)
- **Input validation** — Zod (env) + class-validator (DTOs) — never trust raw input

---

## 🧪 Development

```bash
# Type-check all packages
pnpm turbo run type-check

# Build all packages
pnpm turbo run build

# Lint
pnpm turbo run lint

# Run tests
pnpm turbo run test
```

---

## 🗺️ Roadmap

- [x] **Phase 0** — Infrastructure, CI/CD, local dev setup
- [ ] **Phase 1** — Auth (magic link + Google OAuth), User module, DB schema
- [ ] **Phase 2** — 🚀 Market data pipeline, live dashboard (MVP launch)
- [ ] **Phase 3** — Watchlists, alerts, notifications
- [ ] **Phase 4** — 💰 Razorpay subscriptions (first revenue)
- [ ] **Phase 5** — OI history charts, heatmap, PCR trends
- [ ] **Phase 6** — AI chat, strategy suggestions, daily briefs
- [ ] **Phase 7** — Sentry monitoring, Telegram bot, analytics

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
  <sub>Built with TypeScript · NestJS · Next.js · Prisma · Redis · MongoDB · Docker · Turborepo</sub>
  <br>
  <sub>Data sourced from NSE via Upstox API | AI powered by OpenAI GPT-4o-mini</sub>
  <br><br>
  <a href="https://www.nseindia.com">NSE</a> ·
  <a href="https://upstox.com">Upstox</a> ·
  <a href="https://openai.com">OpenAI</a> ·
  <a href="https://razorpay.com">Razorpay</a>
</div>
