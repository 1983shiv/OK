# OptionKart — Module Map & Phased Build Order

**Version:** 1.0  
**Last Updated:** May 26, 2026  
**Author:** Principal Architecture  
**Derived From:** PRD v2.0 + TSD v1.0

---

## Table of Contents

1. [Module Map](#1-module-map)
2. [Dependency Graph](#2-dependency-graph)
3. [Phased Build Order](#3-phased-build-order)
4. [Critical Path Summary](#4-critical-path-summary)

---

# 1. Module Map

The system is decomposed into **13 logical modules** across backend, frontend, and shared packages. Each module is **highly cohesive** (one clear responsibility) and **loosely coupled** (communicates via well-defined interfaces, not internals).

---

## M0 — Shared Infrastructure

**Purpose:** Cross-cutting setup consumed by every other module. Not a runtime module — it is the foundation everything else is built on.

| Layer                | Contents                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repo / Toolchain** | Turborepo monorepo, pnpm workspaces, `tsconfig` base, ESLint, Prettier, Husky                                                                               |
| **`packages/types`** | Shared TypeScript interfaces: `User`, `Plan`, `DashboardData`, `OptionsChain`, `Alert`, `ApiResponse<T>`                                                    |
| **`packages/utils`** | Pure financial calculations: `calculatePCR`, `calculateMaxPain`, `calculateSentiment`; date/time helpers (IST market hours check)                           |
| **Backend infra**    | `main.ts` bootstrap, global `ValidationPipe`, `ResponseInterceptor`, `HttpExceptionFilter`, `ConfigModule`, `PrismaModule`, `MongooseModule`, `RedisModule` |
| **Frontend infra**   | `api-client.ts` (Axios + interceptors), global `SWRConfig`, `ThemeProvider`, root `layout.tsx`                                                              |
| **DevOps**           | `docker-compose.yml` (Postgres + Redis + MongoDB), CI/CD (GitHub Actions), Railway + Vercel project config, `Dockerfile`                                    |
| **Observability**    | Sentry init (BE + FE), `GET /v1/health` endpoint, UptimeRobot config                                                                                        |

**Owns no business logic.** All other modules depend on this.

---

## M1 — Auth Module

**Purpose:** Prove who the user is. Issue and validate tokens. Nothing more.

| Layer            | Contents                                                                                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**      | `AuthModule`, `AuthController`, `AuthService`; `JwtStrategy` (RS256), `GoogleStrategy` (Passport); `JwtAuthGuard`, `OptionalJwtGuard`; `MagicLinkToken` Prisma model; `EncryptionService` (AES-256-GCM for stored keys) |
| **Backend DTOs** | `MagicLinkDto`, `VerifyTokenDto`, `GoogleCallbackDto`                                                                                                                                                                   |
| **DB**           | `users` table (id, email, authProvider, googleId, plan), `magic_link_tokens` table                                                                                                                                      |
| **Frontend**     | `(auth)/login/page.tsx`, `(auth)/verify/page.tsx`; auth state (access token in memory); `useUser()` hook; silent refresh logic in `api-client.ts`                                                                       |
| **Emails**       | Magic link email template (via Resend)                                                                                                                                                                                  |

**Exposes to other modules:** `JwtAuthGuard`, `OptionalJwtGuard`, `User` entity from request context.

---

## M2 — User & Plan Module

**Purpose:** Manage user profile, preferences, and the _current state_ of a user's plan. Answers "who is this user and what are they allowed to do?"

| Layer        | Contents                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Backend**  | `UserModule`, `UserController`, `UserService`; `PlanGateGuard` + `@RequiresPlan()` decorator; AI quota counter helpers (reads Redis) |
| **DB**       | `users.plan`, `users.aiCreditsRemaining`; `user_preferences` table                                                                   |
| **Frontend** | `settings/page.tsx`; `PlanBadge` component; `useUser()` hook (reads cached user from SWR)                                            |

**Exposes to other modules:** `PlanGateGuard` (consumed by Market, AI, Subscription, Alerts, Watchlist modules). Plan-limit constants (`WATCHLIST_LIMITS`, `ALERT_LIMITS`, `AI_DAILY_LIMITS`).

---

## M3 — Market Data Module

**Purpose:** The beating heart of the product. Fetches raw data from Upstox, computes all derived metrics, and serves them via cache-first API endpoints.

| Layer                     | Contents                                                                                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend — Ingestion**   | `UpstoxService` (REST client, token refresh); `MarketDataScheduler` (NestJS cron jobs: spot every 1 min, chain every 3 min); instrument key config (`NIFTY`, `BANKNIFTY`)                                                                                   |
| **Backend — Computation** | `MarketService.computeDashboard()` — calls `calculatePCR`, `calculateMaxPain`, `calculateSentiment` from `packages/utils`                                                                                                                                   |
| **Backend — API**         | `MarketController`; public endpoints: `GET /market/dashboard/:index`, `GET /market/chain/:index`, `GET /market/spot/:index`, `GET /market/pcr/:index`, `GET /market/max-pain/:index`, `GET /market/support-resistance/:index`                               |
| **Backend — Cache**       | Redis keys `ok:live:{INDEX}:chain`, `ok:live:{INDEX}:dashboard`, `ok:live:{INDEX}:spot` (TTL 90s/30s); cache-miss fallback to MongoDB last snapshot                                                                                                         |
| **Frontend**              | `(dashboard)/dashboard/page.tsx`; `SentimentCard`, `PCRGauge`, `OIBarChart`, `TopMovers`, `MarketStatusBadge` components; `useDashboard()` SWR hook (60s revalidate); `(dashboard)/chain/page.tsx`; `OptionsChainTable` component; `useOptionsChain()` hook |

**This module has no upstream dependencies** (besides M0 infra and Upstox API). Everything else depends on it.

---

## M4 — Data History Module

**Purpose:** Persist time-series OI data to MongoDB and expose historical query endpoints for charts.

| Layer                  | Contents                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend — Pipeline** | `DataIngestionWorker` (BullMQ); 5-minute snapshot writer to MongoDB `oi_snapshots`; `DailySummaryWorker` (runs at 15:35 IST) populates `daily_summaries` |
| **Backend — API**      | Gated endpoints: `GET /market/pcr/:index/history`, `GET /market/heatmap/:index`, `GET /market/oi-history/:index`; plan-based date range limiting         |
| **DB**                 | MongoDB: `oi_snapshots`, `daily_summaries` collections with compound + TTL indexes                                                                       |
| **Frontend**           | `(dashboard)/heatmap/page.tsx`; `OITrendChart`, `PCRHistoryChart`, `OIHeatmap` components                                                                |

**Depends on:** M0, M3 (data source), M2 (plan gating for history range).

---

## M5 — Watchlist Module

**Purpose:** Let authenticated users save and track specific option strikes.

| Layer            | Contents                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backend**      | `WatchlistModule`, `WatchlistController`, `WatchlistService`; limit enforcement by plan (`FREE: 5`, `STARTER: 15`, `PRO: 30`, `ELITE: 50`) |
| **Backend DTOs** | `AddWatchlistItemDto` (instrumentKey, symbol, strikePrice, optionType, expiryDate)                                                         |
| **DB**           | `watchlist_items` table                                                                                                                    |
| **Frontend**     | `(dashboard)/watchlist/page.tsx`; watchlist panel with live OI data overlay (hydrated from M3 cache); `⭐` button on `OptionsChainTable`   |

**Depends on:** M0, M1 (auth required), M2 (plan limit), M3 (live OI enrichment).

---

## M6 — Alert Module

**Purpose:** Let users define trigger conditions on market data and receive notifications when those conditions are met.

| Layer                   | Contents                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Backend — CRUD**      | `AlertsModule`, `AlertsController`, `AlertsService`; alert limit enforcement by plan                                            |
| **Backend — Engine**    | `AlertEvaluatorWorker` (BullMQ processor); dedup via Redis `ok:alert:last:{alertId}` (5-min window); `AlertHistory` persistence |
| **Backend — Scheduler** | Alert evaluation enqueued every 3 min from `MarketDataScheduler` after each data fetch                                          |
| **Backend DTOs**        | `CreateAlertDto` (alertType, symbol, strikePrice, conditionOperator, conditionValue, deliveryChannels)                          |
| **DB**                  | `alerts`, `alert_history` tables                                                                                                |
| **Frontend**            | `(dashboard)/alerts/page.tsx`; alert creation form; trigger history list; in-app notification bell                              |

**Depends on:** M0, M1 (auth), M2 (plan limits), M3 (current market data to evaluate against), M7 (notification delivery).

---

## M7 — Notification Module

**Purpose:** Deliver messages to users across multiple channels. Decoupled from the business logic that triggers them.

| Layer        | Contents                                                                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**  | `NotificationWorker` (BullMQ `notifications` queue); channel drivers: in-app (Prisma write + polling), browser push (`web-push` + VAPID), email (Resend templates), Telegram (Grammy bot) |
| **DB**       | `notifications` table (in-app inbox); `user_preferences.telegramChatId`                                                                                                                   |
| **Frontend** | Notification bell + dropdown; browser push opt-in prompt                                                                                                                                  |

**Depends on:** M0, M1 (user identity), M2 (user preferences for channel config).  
**Used by:** M6 (alerts), M9 (AI daily brief delivery), M11 (payment events).

---

## M8 — Subscription & Payment Module

**Purpose:** Manage the full lifecycle of Razorpay subscriptions and synchronize plan state back to the `User` record.

| Layer                      | Contents                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backend**                | `SubscriptionModule`, `SubscriptionController`, `SubscriptionService`; `WebhookService` (HMAC-SHA256 verification + idempotency via `WebhookEvent` table); `RazorpayService` wrapper |
| **Webhook events handled** | `subscription.charged`, `subscription.activated`, `subscription.halted`, `subscription.cancelled`, `payment.failed`, `refund.created`                                                |
| **DB**                     | `subscriptions`, `payments`, `webhook_events` tables                                                                                                                                 |
| **Frontend**               | `pricing/page.tsx`; Razorpay Checkout modal integration; upgrade/downgrade/cancel flows; `PaywallGate` component; `UpgradeCTA` component                                             |

**Depends on:** M0, M1 (auth), M2 (user record to update plan on).  
**Downstream effects on:** M2 (plan field update), M7 (payment confirmation / failure emails).

---

## M9 — AI Module

**Purpose:** Serve AI-powered insights grounded in real market data. Manage quotas and token costs.

| Layer                 | Contents                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backend**           | `AiModule`, `AiController`, `AiService`; `ContextBuilderService` (assembles Redis market data as JSON for the prompt); `PromptBuilderService` (3 templates: chat, strategy, daily brief); `QuotaService` (Redis counter, resets at midnight IST) |
| **Backend — Workers** | `DailyBriefWorker` (BullMQ, 15:35 IST cron) — generates brief once, serves to all paid users                                                                                                                                                     |
| **DB**                | MongoDB: `ai_conversations` (TTL 30 days), `daily_summaries.aiSummary` field                                                                                                                                                                     |
| **Frontend**          | `(dashboard)/ai/page.tsx`; `ChatInterface`, `ChatMessage` components; SSE token streaming; daily brief card; strategy suggestion cards                                                                                                           |
| **BYO Key**           | Elite users: encrypted key stored in `user_preferences.byoOpenaiKey`, decrypted server-side only                                                                                                                                                 |

**Depends on:** M0, M1 (auth), M2 (plan + quota gating), M3 (live market context), M4 (daily summary data).

---

## M10 — Analytics & Tracking Module

**Purpose:** Instrument all meaningful user actions for product iteration.

| Layer        | Contents                                                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | PostHog provider wrapper; `trackEvent()` helper; instrumented events: `dashboard_loaded`, `paywall_hit`, `checkout_completed`, `ai_query_sent`, `watchlist_add`, `alert_created`, etc. |
| **Backend**  | Sentry middleware (unhandled exceptions + performance); `api_error` and `upstox_fetch_failed` logged to Sentry                                                                         |

**Depends on:** M0 only. Passive — does not block any feature.

---

## M11 — SEO & Marketing Module

**Purpose:** Maximize organic discoverability. Exists entirely in the frontend.

| Layer        | Contents                                                                                                                                                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | `app/page.tsx` (landing page: hero, features, how-it-works, FAQ, social proof); SEO content pages: `/nifty-pcr-live`, `/nifty-max-pain`, `/nifty-option-chain`, `/bank-nifty-oi-analysis`; `generateMetadata()` on every page; `sitemap.xml` route handler; JSON-LD structured data; OG image generation (Next.js `ImageResponse`) |

**Depends on:** M0, M3 (live data embedded in SEO pages via ISR).

---

## M12 — Platform Module _(Stage 5 — Future)_

**Purpose:** Network-effect features that turn the tool into a platform.

| Layer                  | Contents                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **Backtesting Engine** | Historical OI replay, strategy simulation, P&L/drawdown/Sharpe calculations                    |
| **Community**          | Trade ideas feed, discussion threads, upvotes                                                  |
| **Gamification**       | Paper trading leaderboard, prediction accuracy scoring, badges                                 |
| **Public API**         | `/api/v1/sentiment`, `/api/v1/oi`, `/api/v1/pcr`, `/api/v1/heatmap`; separate rate limit tiers |

**Depends on:** All prior modules. **Not on the critical path to MVP or paid launch.**

---

# 2. Dependency Graph

## 2.1 Module Dependency Matrix

An arrow `A → B` means **A depends on B** (B must exist before A can function).

```
M1  Auth              → M0
M2  User & Plan       → M0, M1
M3  Market Data       → M0  (no user dependency — public endpoints)
M4  Data History      → M0, M3, M2
M5  Watchlist         → M0, M1, M2, M3
M6  Alerts            → M0, M1, M2, M3, M7
M7  Notifications     → M0, M1, M2
M8  Subscription      → M0, M1, M2, M7
M9  AI                → M0, M1, M2, M3, M4
M10 Analytics         → M0
M11 SEO & Marketing   → M0, M3
M12 Platform (future) → M0, M1–M11
```

## 2.2 Visual Dependency Graph

```
                ┌──────────────────────────────────────────────┐
                │                M0 — Shared Infra              │
                │   (types, utils, DB clients, CI/CD, config)   │
                └────────────────────┬─────────────────────────┘
                                     │ everything depends on M0
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
   ┌─────────────┐           ┌──────────────┐          ┌──────────────┐
   │  M1 — Auth  │           │M3 — Market   │          │M10 — Analytics│
   │  Magic Link │           │    Data      │          │  PostHog/    │
   │  Google OAuth│          │  (public)    │          │  Sentry      │
   └──────┬──────┘           └──────┬───────┘          └──────────────┘
          │                         │
          ▼                         │
   ┌─────────────┐                  │
   │M2 — User &  │◄─────────────────┘
   │    Plan     │   (plan gates market history)
   └──────┬──────┘
          │
          ├──────────────────────────────────────────────┐
          │                                              │
          ▼                                              ▼
   ┌─────────────┐                               ┌──────────────┐
   │M8 — Subs &  │                               │M7 — Notifi-  │
   │  Payments   │──────────────────────────────►│   cations    │
   └─────────────┘  (payment events → notify)    └──────┬───────┘
                                                         │
          ┌──────────────────────────────────────────────┤
          │                          │                   │
          ▼                          ▼                   │
   ┌─────────────┐           ┌──────────────┐            │
   │M5 — Watch-  │           │  M6 — Alerts │────────────┘
   │    list     │           │  (eval+CRUD) │  (triggers notifications)
   └─────────────┘           └──────────────┘
          │                          │
          │    ┌─────────────────────┘
          │    │
          ▼    ▼
   ┌─────────────────┐
   │  M4 — Data      │
   │  History        │
   │  (MongoDB snaps)│
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │   M9 — AI       │
   │  (chat, brief,  │
   │   strategy)     │
   └─────────────────┘

   M11 — SEO/Marketing  ──► M3 (live data in ISR pages)
   M12 — Platform       ──► everything above
```

## 2.3 Hard Blockers (cannot start B until A is done)

| Blocked Module   | Hard Requirement                                                  |
| ---------------- | ----------------------------------------------------------------- |
| M2 User & Plan   | M1 Auth (users table seeded by auth flow)                         |
| M5 Watchlist     | M1 Auth + M2 Plan (auth guard + limit check)                      |
| M6 Alerts        | M7 Notifications (alert trigger must have delivery target)        |
| M8 Subscriptions | M2 User (plan field must exist to update)                         |
| M9 AI            | M3 Market Data (context builder needs live cache to be populated) |
| M4 Data History  | M3 Market Data (snapshots come from the ingestion pipeline)       |

---

# 3. Phased Build Order

> **North Star constraint:** Reach a publicly accessible, working dashboard (MVP) in ≤2 weeks. Every phase is ordered to unblock the next.

---

## Phase 0 — Infrastructure & Config

**Goal:** Every developer can clone, run the stack locally, and push to a working CI pipeline.  
**Duration:** 1–2 days  
**Output:** Green CI build, local dev environment boots in one command.

### P0.1 — Monorepo Scaffolding

- [ ] Initialize repo with Turborepo + pnpm workspaces
- [ ] Create `apps/api` (NestJS), `apps/web` (Next.js 15), `packages/types`, `packages/utils`
- [ ] Root `tsconfig.base.json`, ESLint + Prettier config, Husky pre-commit hook
- [ ] `.env.example` with all required variable names (no values)

### P0.2 — Local Services

- [ ] `docker-compose.yml`: Postgres 16, Redis 7, MongoDB 7
- [ ] Verify all three services connect from both apps via env vars

### P0.3 — Backend Bootstrap (M0 backend)

- [ ] NestJS app boots with `ConfigModule` (Joi validation of env vars)
- [ ] `PrismaModule` connected to Postgres (empty schema `npx prisma init`)
- [ ] `MongooseModule` connected to MongoDB
- [ ] `RedisModule` (ioredis) connected
- [ ] `GET /v1/health` returns `{ status: 'ok' }`
- [ ] Global `ValidationPipe`, `ResponseInterceptor`, `HttpExceptionFilter` wired up

### P0.4 — Frontend Bootstrap (M0 frontend)

- [ ] Next.js app boots, dark theme baseline CSS (`globals.css`)
- [ ] `api-client.ts` (Axios instance, base URL from env)
- [ ] `packages/types` imported successfully in both apps

### P0.5 — CI/CD & Deployment Config

- [ ] GitHub Actions: lint + type-check + test on every PR
- [ ] Railway project created, connected to `apps/api`, env vars set
- [ ] Vercel project created, connected to `apps/web`, env vars set
- [ ] Neon project + connection string in env
- [ ] MongoDB Atlas cluster + connection string in env
- [ ] Upstash Redis instance + connection string in env
- [ ] Sentry DSN configured in both apps

**✅ Gate:** `docker-compose up && pnpm dev` boots both apps. CI passes on an empty push. Production deployments succeed (with health check returning 200).

---

## Phase 1 — Foundation: Auth + Database Schema

**Goal:** A user can sign up, sign in, and be identified on every subsequent request. All DB tables exist.  
**Duration:** 3–4 days  
**Output:** Working magic link + Google OAuth. JWT issued. All Prisma migrations applied.

### P1.1 — Full Prisma Schema Migration (M0 DB)

- [ ] Write complete `schema.prisma` (all 9 models: User, MagicLinkToken, Subscription, Payment, WatchlistItem, Alert, AlertHistory, UserPreferences, WebhookEvent)
- [ ] Run `prisma migrate dev --name init` — all tables created
- [ ] Confirm all enums (Plan, AuthProvider, SubscriptionStatus, AlertType, OptionType) exist

> **Why now?** Run all migrations once upfront to avoid retroactive schema surgery later. Columns can be nullable initially.

### P1.2 — Auth Backend (M1)

- [ ] `AuthModule` with `AuthService`, `AuthController`
- [ ] `POST /auth/magic-link` — rate-check (Redis), upsert user, generate opaque token, send email via Resend
- [ ] `POST /auth/verify-magic-link` — validate token, mark used, return JWT pair
- [ ] `POST /auth/google` — Passport GoogleStrategy, upsert user, return JWT pair
- [ ] `POST /auth/refresh` — validate refresh cookie, rotate both tokens
- [ ] `POST /auth/logout` — clear cookie
- [ ] `JwtStrategy` (RS256), `JwtAuthGuard`, `OptionalJwtGuard`
- [ ] `EncryptionService` (AES-256-GCM) in `common/`

### P1.3 — User Backend (M2)

- [ ] `UserModule`, `UserService`, `UserController`
- [ ] `GET /user/profile`, `PATCH /user/profile`, `GET/PUT /user/preferences`
- [ ] `PlanGateGuard` + `@RequiresPlan()` decorator
- [ ] Plan-limit constants file (`PLAN_LIMITS`)

### P1.4 — Auth Frontend (M1)

- [ ] `(auth)/login/page.tsx` — email input + "Send Magic Link" + Google button
- [ ] `(auth)/verify/page.tsx` — reads `?token=` from URL, calls `/auth/verify-magic-link`, stores access token in memory, redirects
- [ ] `useUser()` SWR hook (`GET /user/profile`, `null` when unauthenticated)
- [ ] Silent refresh wired into `api-client.ts` interceptor

### P1.5 — `packages/utils` — Financial Calculations

- [ ] `calculatePCR(chain)`
- [ ] `calculateMaxPain(chain)`
- [ ] `calculateSentiment(pcr, callOIChange, putOIChange)`
- [ ] `isMarketOpen(now: Date): boolean` (IST market hours + public holiday list)
- [ ] `getATMStrike(chain, spotPrice)`
- [ ] 100% unit test coverage for all functions

**✅ Gate:** A user can receive a magic link, click it, and `GET /user/profile` returns their record with a valid JWT.

---

## Phase 2 — Core Domain: Market Data & Public Dashboard

**Goal:** The MVP is live and publicly accessible. Anyone can view the live dashboard without signing in.  
**Duration:** 5–6 days  
**Output:** `optionkart.com/dashboard` is live with real Nifty/BankNifty data. This is the launchable artifact.

### P2.1 — Upstox Integration & Data Ingestion (M3)

- [ ] `UpstoxService`: `getOptionsChain()`, `getSpotPrice()`, token refresh flow (store in Redis `ok:upstox:access_token`)
- [ ] `MarketDataScheduler` (`@nestjs/schedule`):
  - Spot price: every 1 min during market hours
  - Options chain: every 3 min
  - Cache-write to Redis after every fetch
- [ ] Market hours guard in scheduler (`isMarketOpen()` from `packages/utils`)

### P2.2 — Dashboard API (M3)

- [ ] `MarketController` + `MarketService`
- [ ] `GET /market/dashboard/:index` — reads from Redis, falls back to last MongoDB snapshot; returns full `DashboardData` shape
- [ ] `GET /market/chain/:index` — reads chain from Redis; ATM-centered, ±10 strikes default
- [ ] `GET /market/spot/:index`
- [ ] `GET /market/pcr/:index`
- [ ] `GET /market/max-pain/:index`
- [ ] `GET /market/support-resistance/:index`
- [ ] Edge case: `isMarketOpen = false` → serve cached data with `marketStatus: 'CLOSED'` + `nextOpenAt`

### P2.3 — BullMQ Queue Setup (M0 backend)

- [ ] `BullModule` global registration with Redis config
- [ ] `market-fetch` queue defined (used by ingestion worker)
- [ ] `alert-eval` queue defined (used in Phase 3)
- [ ] `notifications` queue defined (used in Phase 3)

### P2.4 — Dashboard Frontend (M3 + M11)

- [ ] `(dashboard)/dashboard/page.tsx` — SSR initial render + SWR 60s revalidate
- [ ] `SentimentCard` (🟢/🟡/🔴 + score)
- [ ] `PCRGauge` (animated gauge component)
- [ ] `OIBarChart` (Call OI vs Put OI horizontal bar)
- [ ] `TopMovers` (call build-up + put build-up lists)
- [ ] `MarketStatusBadge` (OPEN / CLOSED / HOLIDAY + countdown)
- [ ] `LoadingSkeleton` for each card
- [ ] Dark theme default, light mode toggle
- [ ] Mobile-first responsive layout (single column → 2-col grid on `md+`)
- [ ] Last updated timestamp visible at all times
- [ ] Index toggle: Nifty / BankNifty

### P2.5 — Options Chain Frontend (M3)

- [ ] `(dashboard)/chain/page.tsx`
- [ ] `OptionsChainTable` — Strike | Call OI | Call OI Chg | Call LTP | Put LTP | Put OI Chg | Put OI
- [ ] ATM row highlighted; color-coded OI change (green/red)
- [ ] ±10 strikes default, "Show all" expand
- [ ] Far OTM with zero OI collapsed

### P2.6 — SEO Landing Page (M11)

- [ ] `app/page.tsx` — Hero, Features, How It Works, Who It's For, FAQ, Disclaimer footer
- [ ] `generateMetadata()` with target keywords
- [ ] OG image via Next.js `ImageResponse`
- [ ] `sitemap.xml` and `robots.txt` route handlers
- [ ] Core Web Vitals pass: LCP < 2.5s on 4G simulation

**✅ Gate:** `optionkart.com` is deployed. Dashboard shows live Nifty sentiment, PCR, and options chain. No login required. Page loads in < 2s on 4G.

> **🚀 This is the soft launch point (PRD Sprint 2, Day 10).**

---

## Phase 3 — User Features: Watchlist, Alerts & Data Persistence

**Goal:** Registered users can save watchlists, set alerts, and start receiving notifications. MongoDB snapshot pipeline is running.  
**Duration:** 8–10 days  
**Output:** Stage 2 of PRD complete. First paying users possible after Phase 4.

### P3.1 — MongoDB OI Snapshot Pipeline (M4)

- [ ] `OiSnapshot` Mongoose schema + compound indexes + 90-day TTL index
- [ ] `DataIngestionWorker` (BullMQ): every 5 min during market hours, write full snapshot from Redis to MongoDB
- [ ] Verify snapshot is written correctly; validate recovery from Redis cache miss using MongoDB

### P3.2 — Watchlist (M5)

- [ ] `WatchlistModule` backend: `GET /watchlist`, `POST /watchlist`, `DELETE /watchlist/:id`
- [ ] Plan limit enforcement (5 / 15 / 30 / 50)
- [ ] Live OI enrichment: when serving watchlist, hydrate each item from Redis `ok:live:{INDEX}:chain`
- [ ] `(dashboard)/watchlist/page.tsx` with live data display
- [ ] `⭐` button on `OptionsChainTable` rows (adds/removes from watchlist)
- [ ] "X/5 free slots used" counter with upgrade nudge

### P3.3 — Notifications Foundation (M7)

- [ ] `NotificationWorker` (BullMQ `notifications` queue)
- [ ] In-app channel: write to `notifications` table; frontend polls `GET /notifications` (10s interval)
- [ ] Notification bell component + dropdown in dashboard nav

### P3.4 — Alerts (M6)

- [ ] `AlertsModule` backend: `GET /alerts`, `POST /alerts`, `PATCH /alerts/:id`, `DELETE /alerts/:id`, `GET /alerts/history`
- [ ] Plan limit enforcement (3 / 10 / 25 / unlimited)
- [ ] `AlertEvaluatorWorker`: dequeue from `alert-eval`, check condition, dedup with Redis 5-min TTL, write `AlertHistory`, enqueue to `notifications`
- [ ] Condition checkers: `OI_SPIKE`, `PCR_CROSS`, `MAX_PAIN_SHIFT`, `WATCHLIST`
- [ ] Scheduler: after each chain fetch, enqueue alert-eval jobs for active alerts
- [ ] `(dashboard)/alerts/page.tsx` — CRUD UI + trigger history
- [ ] Browser push notification: VAPID key setup, `web-push` backend, service worker on frontend

### P3.5 — Email Notifications (M7)

- [ ] Resend SDK configured; verified sending domain
- [ ] Magic link email template (already used in P1.2 — verify it works in prod)
- [ ] Alert triggered email template
- [ ] End-of-day alert digest email (cron at 16:00 IST)

**✅ Gate:** A logged-in user can add 3 Nifty strikes to watchlist, set a PCR-cross alert at 1.2, and receive an in-app notification when it fires during market hours.

---

## Phase 4 — Monetization: Payments & Feature Gating

**Goal:** The product can charge money. Free vs paid features are enforced everywhere.  
**Duration:** 5–6 days  
**Output:** First paying subscriber possible. Pricing page live.

### P4.1 — Razorpay Setup (M8)

- [ ] Create Razorpay plans in dashboard for all 6 combinations (3 tiers × 2 billing cycles); record plan IDs in env vars
- [ ] `RazorpayService` wrapper (SDK init)
- [ ] `WebhookService`: HMAC-SHA256 verification, `WebhookEvent` idempotency check
- [ ] `SubscriptionService.createSubscription()`: create Razorpay subscription, persist `CREATED` record
- [ ] Webhook handlers for all 6 events (update `subscriptions` + `users.plan` atomically in Prisma transaction)
- [ ] `POST /subscription/webhook` — raw body parsing (bypass JSON middleware for signature verification)
- [ ] `GET /subscription`, `POST /subscription/create`, `POST /subscription/cancel`, `POST /subscription/pause`, `POST /subscription/resume`

### P4.2 — Feature Gating Enforcement (M2)

- [ ] Apply `@RequiresPlan()` guard to all gated endpoints: `pcr/history`, `heatmap`, `multi-expiry chain`, AI endpoints (quota-based, not plan-blocked)
- [ ] Watchlist and alert limit checks in service layer (not just guard)
- [ ] Historical date range limiting in `GET /market/pcr/:index/history` and OI history by plan

### P4.3 — Pricing & Upgrade Frontend (M8)

- [ ] `pricing/page.tsx` — tier comparison table, monthly/yearly toggle, CTAs
- [ ] Razorpay Checkout modal integration (load `rzp1.js`, open with `subscriptionId`)
- [ ] Post-payment success redirect → plan updated via webhook → UI reflects new plan
- [ ] `PaywallGate` component: soft-gate (blurred preview + overlay) and hard-gate variants
- [ ] `UpgradeCTA` inline nudge component for usage-limit messages
- [ ] Upgrade nudge at watchlist limit, alert limit, AI query limit

### P4.4 — Payment Emails (M7)

- [ ] Subscription activated email
- [ ] Payment failure email (with retry CTA)
- [ ] Subscription halted email (recovery flow)
- [ ] Cancellation confirmation email

**✅ Gate:** A free user hits the watchlist limit, sees an upgrade nudge, completes Razorpay checkout, and their plan updates to Starter with a 15-item limit within 60 seconds (webhook latency).

---

## Phase 5 — Charts & Historical Data Visualization

**Goal:** Paid users can see OI trends over time. The product has visible depth beyond the free tier.  
**Duration:** 4–5 days  
**Output:** OI trend charts, PCR history, and OI heatmap fully functional.

### P5.1 — Historical Data API (M4)

- [ ] `GET /market/pcr/:index/history` — query `oi_snapshots` grouped by day, return daily PCR; free=today, starter=7d, pro=30d, elite=90d
- [ ] `GET /market/oi-history` — per-strike OI time-series from `oi_snapshots`
- [ ] `GET /market/heatmap/:index` — transform `oi_snapshots` into strike×time matrix for Call and Put OI

### P5.2 — Chart Components (M4 frontend)

- [ ] Install `recharts` (or `@tremor/react` for simpler charts)
- [ ] `PCRHistoryChart` — time-series line chart, 5-day + 20-day MA overlays, expiry day annotations
- [ ] `OITrendChart` — dual-axis (OI left, price right), hoverable data points, timeframe selector (1D / 5D / 1M)
- [ ] `OIHeatmap` — strike × time 2D grid with color intensity scale; use canvas renderer for performance (100+ cells)
- [ ] Wrap all chart pages with `PaywallGate` (soft gate with blurred 1-day preview for free users)

### P5.3 — Multi-Expiry Analysis (M3/M4)

- [ ] `GET /market/chain/:index/:expiry` — gated endpoint returning chain for any expiry
- [ ] Frontend expiry selector in chain page
- [ ] Rollover % calculation (OI shifting from current → next expiry) in `MarketService`

**✅ Gate:** A Pro user can open the heatmap, see the last 30 days of OI history, and switch expiries on the chain view.

---

## Phase 6 — AI Integration

**Goal:** Users can ask natural language questions about market data and get grounded, accurate answers.  
**Duration:** 6–7 days  
**Output:** AI chat live for all plans (quota enforced). Daily brief for Pro/Elite.

### P6.1 — AI Backend Infrastructure (M9)

- [ ] OpenAI SDK client (`gpt-4o-mini` default)
- [ ] `ContextBuilderService`: assembles `DashboardData` from Redis into compact JSON for prompt
- [ ] `PromptBuilderService`: 3 templates (chat, strategy, daily brief) with variable injection
- [ ] `QuotaService`: Redis counter `ok:ai:quota:{userId}:{date}`, midnight IST TTL; plan limits enforced
- [ ] Common query cache: SHA-256 hash of `{index}:{3-min-window}:{normalized-query}` → 3-min Redis TTL

### P6.2 — AI Chat Endpoint (M9)

- [ ] `POST /ai/chat` — SSE streaming response via `res.flushHeaders()` + `openai.chat.completions.create({ stream: true })`
- [ ] Conversation history: load last 3 messages from `ai_conversations` MongoDB, append to prompt
- [ ] Persist conversation to MongoDB after each exchange
- [ ] Quota deduction + `creditsRemaining` included in `data: {"type":"done"}` SSE message

### P6.3 — Strategy Suggester & Daily Brief (M9)

- [ ] `POST /ai/strategy-suggest` — uses strategy prompt template, gated to Pro+
- [ ] `GET /ai/daily-brief/:index` — reads pre-generated brief from `daily_summaries.aiSummary`; gated to Pro+
- [ ] `DailyBriefWorker` (BullMQ): triggered at 15:35 IST cron; generates once per index, stores in MongoDB
- [ ] `GET /ai/usage` — returns credits used today + plan limit

### P6.4 — AI Frontend (M9)

- [ ] `(dashboard)/ai/page.tsx`
- [ ] `ChatInterface` — message list, input box, send button
- [ ] `ChatMessage` — user bubble vs AI bubble, markdown rendering, source citations
- [ ] SSE token streaming via `EventSource` API → tokens append in real-time
- [ ] Credit counter display ("4/5 queries used today")
- [ ] Upgrade nudge when limit hit
- [ ] Daily brief card on dashboard (Pro/Elite only, soft-gated otherwise)

### P6.5 — BYO OpenAI Key (M9)

- [ ] `settings/page.tsx` — API key input for Elite plan
- [ ] `PATCH /user/preferences` stores encrypted key via `EncryptionService`
- [ ] `AiService.getOpenAIClient()` checks for BYO key before using platform key

**✅ Gate:** A free user can ask 5 questions and gets a quota-exceeded message. A Pro user can ask 100 questions. Daily brief appears at 15:35 for Pro users. Elite user can add their own OpenAI key and get unlimited queries.

---

## Phase 7 — Polish, Analytics & Observability

**Goal:** The product is instrumented, resilient, and ready for public growth marketing.  
**Duration:** 3–4 days  
**Output:** Full analytics pipeline live. All error states handled gracefully.

### P7.1 — Analytics Instrumentation (M10)

- [ ] PostHog provider in `app/layout.tsx`
- [ ] `trackEvent()` wrapper around PostHog `capture()`
- [ ] Instrument all events from PRD Section 12.2: page views, conversion funnel events, engagement events, system events
- [ ] Set up funnels in PostHog: Visitor→Registered, Free→Paid, AI engagement

### P7.2 — Telegram Bot (M7)

- [ ] Grammy bot setup; `/start` links Telegram account to OptionKart account via deep link
- [ ] Alert delivery via Telegram (enqueue channel `telegram` in `NotificationWorker`)
- [ ] Commands: `/pcr`, `/signal nifty`, `/watchlist`
- [ ] Gated to Pro + Elite plans

### P7.3 — Smart Money Indicators (M3)

- [ ] MFI calculation in `packages/utils`
- [ ] Unusual OI activity scanner (>2 std dev): new endpoint `GET /market/unusual-activity/:index`
- [ ] Support/resistance zones: `GET /market/support-resistance/:index` (already stubbed in P2.2 — implement logic)
- [ ] Frontend: new dashboard widgets (India VIX real-time, Smart Money gauge)

### P7.4 — Error Handling & Resilience

- [ ] Global Upstox error handler: on fetch failure, serve last cached data with `isStale: true` + age
- [ ] Circuit breaker pattern for Upstox API (stop retrying after N consecutive failures)
- [ ] Public holiday list loaded on startup; scheduler skips jobs on holidays
- [ ] `503 Service Unavailable` with `Retry-After` header when Redis is down
- [ ] Frontend: error boundary on each dashboard widget (one widget failing doesn't crash the page)

### P7.5 — Performance Hardening

- [ ] Response compression (`compression` middleware on NestJS)
- [ ] PostgreSQL connection pooling via Neon's built-in PgBouncer (use pooled connection string endpoint in `DATABASE_URL`)
- [ ] Next.js bundle analysis; code-split chart libraries (load `recharts` only on chart pages)
- [ ] Image optimization for landing page (Next.js `<Image>`)
- [ ] Lighthouse CI check in GitHub Actions: score > 90

**✅ Gate:** Lighthouse CI passes. Sentry captures and groups errors. PostHog funnel shows at least 3 distinct conversion events firing. Upstox outage is handled gracefully (stale data shown, no 500s).

---

## Phase 8 — Platform Features _(Stage 5 — Post-PMF)_

**Goal:** Build network-effect features once paying user base is established (>500 subscribers).  
**Timeline:** Months 7–12

> These are scoped but deliberately **not on the critical path**. Do not start until Phases 0–7 are stable and generating revenue.

### P8.1 — Backtesting Engine

- [ ] Historical OI replay from `oi_snapshots`
- [ ] Strategy simulation (Iron Condor, Bull Put Spread, etc.) with configurable entry/exit rules
- [ ] Output: win rate, avg P&L, max drawdown, Sharpe ratio
- [ ] `GET /backtest` endpoint + results stored in MongoDB
- [ ] Frontend: `backtest/page.tsx` with results visualization

### P8.2 — Community Features

- [ ] Trade ideas feed (user posts + chart attachments)
- [ ] Discussion threads per index/strategy
- [ ] AI content moderation before publish
- [ ] Upvote/downvote surfacing

### P8.3 — Public API

- [ ] Separate API key authentication (not JWT)
- [ ] Rate limiting by API plan tier (100 / 5,000 / 50,000 req/day)
- [ ] API docs (OpenAPI/Swagger via `@nestjs/swagger`)
- [ ] Developer portal / key management dashboard

### P8.4 — Multi-Index & Stock Options

- [ ] Expand instrument list: Nifty FinService, Nifty Midcap Select
- [ ] F&O stock options (top 50)
- [ ] Dynamic instrument config (no hardcoded symbols)

---

# 4. Critical Path Summary

## 4.1 Fastest Path to Testable MVP

```
P0 (2 days) → P1 (4 days) → P2 (6 days)
                                │
                                └─► 🚀 LAUNCH (Day 12)
                                    Public dashboard live, no login required
```

## 4.2 Fastest Path to First Revenue

```
P0 → P1 → P2 → P3 (10 days) → P4 (6 days)
                                    │
                                    └─► 💰 MONETIZATION READY (Day ~28)
                                        Stripe-equivalent fully functional
```

## 4.3 Full Phase Timeline

| Phase                 | Key Output                         | Cumulative Days | PRD Stage         |
| --------------------- | ---------------------------------- | --------------- | ----------------- |
| **P0** Infrastructure | Repo, CI, local dev                | 2               | —                 |
| **P1** Auth + DB      | Login works, all tables exist      | 6               | Stage 2 (partial) |
| **P2** Market Data    | 🚀 Live dashboard, soft launch     | 12              | **Stage 1 MVP**   |
| **P3** User Features  | Watchlist + alerts + notifications | 22              | Stage 2           |
| **P4** Payments       | 💰 First subscriber                | 28              | Stage 2           |
| **P5** Charts         | OI history, heatmap, PCR charts    | 33              | Stage 2/3         |
| **P6** AI             | Chat, strategy, daily brief        | 40              | Stage 4           |
| **P7** Polish         | Analytics, Telegram, resilience    | 44              | Stage 3           |
| **P8** Platform       | Backtesting, community, API        | Month 7–12      | Stage 5           |

## 4.4 Parallel Work Opportunities

After Phase 2 launches, the following tracks can run in parallel (on a 2-person team):

| Track A (Backend-heavy)        | Track B (Frontend-heavy)        |
| ------------------------------ | ------------------------------- |
| P3.1 MongoDB snapshot pipeline | P3.2 Watchlist frontend         |
| P3.4 Alert evaluation engine   | P3.3 Notifications UI           |
| P4.1 Razorpay backend          | P5.2 Chart components           |
| P6.1–6.3 AI backend            | P4.3 Pricing page + PaywallGate |

## 4.5 Module Build Order (Strict Sequence)

```
M0 → M1 → M2 → M3 → M11
                └── M4 → M5
                        └── M7 → M6
                                └── M8
                                └── M9
                                └── M10
                                └── M12 (future)
```

---

_Update this document as phases complete. Mark phases done with ✅ and record actual completion dates to calibrate future estimates._
