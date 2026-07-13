# OptionKart — Agent Context File

**Source documents:** `prd.md`, `tsd.md`, `module-map-n-build-order.md`, `file-specification/phase-0-implementation-guide.md`, `file-specification/phase-0-test.md`

---

## Project Overview

OptionKart is a web-based options trading analytics platform for Indian retail traders. Transforms raw F&O data from NSE (via Upstox API) into actionable signals and visual insights. Dark-first, mobile-first design.

**Vision:** Make every retail trader trade options with the confidence of an institutional desk.

---

## Tech Stack (Canonical)

| Layer             | Technology                      | Version                          |
| ----------------- | ------------------------------- | -------------------------------- |
| Frontend          | Next.js (App Router)            | 16.x                             |
| FE language       | TypeScript                      | 5.x                              |
| Backend framework | NestJS                          | 11.x                             |
| BE language       | TypeScript                      | 5.x                              |
| ORM (Postgres)    | Prisma                          | 7.x (prisma-client-js generator) |
| ODM (MongoDB)     | Mongoose                        | 8.x                              |
| Cache / Queue     | Redis (ioredis)                 | 5.x                              |
| Queue library     | BullMQ                          | 5.x                              |
| Primary DB        | PostgreSQL                      | 16.x                             |
| Document DB       | MongoDB                         | 7.x                              |
| HTTP client       | Axios                           | 1.x                              |
| Data fetching     | TanStack Query                  | 5.x                              |
| Validation        | Zod (FE) + class-validator (BE) | 3.x                              |
| Auth              | Jose (JWT)                      | 5.x (RS256)                      |
| Email             | Resend                          | latest                           |
| AI                | openai SDK                      | 4.x (GPT-4o-mini)                |
| Payments          | razorpay SDK                    | 2.x                              |
| Testing (BE)      | Jest + Supertest                | latest                           |
| Testing (FE)      | Vitest + Testing Library        | latest                           |

### Third-Party Services

| Service             | Purpose        | MVP Plan               |
| ------------------- | -------------- | ---------------------- |
| Vercel              | FE hosting     | Hobby → Pro            |
| Railway             | BE hosting     | Starter                |
| Neon                | PostgreSQL     | Free → Launch ($19/mo) |
| MongoDB Atlas       | Document store | M0 Free → M10          |
| Upstash Redis       | Cache + BullMQ | Free → Pay-as-go       |
| Upstox API          | Market data    | Free (v2)              |
| OpenAI              | AI inference   | Pay-as-go              |
| Razorpay            | Payments       | Production keys        |
| Resend              | Email          | Free → Paid            |
| Sentry              | Error tracking | Free                   |
| Plausible / PostHog | Analytics      | Free                   |

---

## Repository Structure

```
optionkart/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router pages + layouts
│   │   │   ├── (dashboard)/    # Dashboard route group (with nav)
│   │   │   ├── (auth)/         # Auth route group (minimal layout)
│   │   │   ├── pricing/
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── dashboard/      # SentimentCard, PCRGauge, OIBarChart, TopMovers
│   │   │   ├── chain/          # OptionsChainTable
│   │   │   ├── charts/         # OITrendChart, PCRHistoryChart, OIHeatmap
│   │   │   ├── ai/             # ChatInterface, ChatMessage
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   └── shared/         # PaywallGate, PlanBadge, LoadingSkeleton
│   │   ├── hooks/              # useDashboard, useOptionsChain, useUser
│   │   └── lib/                # api-client.ts, auth.ts, utils.ts
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── config/         # env.schema.ts (Zod)
│       │   ├── modules/
│       │   │   ├── auth/       # Magic link, Google OAuth, JWT
│       │   │   ├── market/     # Dashboard, chain, Upstox integration
│       │   │   ├── user/       # Profile, preferences
│       │   │   ├── watchlist/  # Strikes watchlist CRUD
│       │   │   ├── alerts/     # Alert CRUD + evaluator
│       │   │   ├── subscription/ # Razorpay payments
│       │   │   └── ai/         # Chat, strategy, daily brief
│       │   ├── workers/        # BullMQ processors
│       │   ├── schedulers/     # @nestjs/schedule cron jobs
│       │   ├── common/
│       │   │   ├── decorators/ # @Public()
│       │   │   ├── filters/    # HttpExceptionFilter
│       │   │   ├── interceptors/ # ResponseInterceptor
│       │   │   ├── guards/     # JwtAuthGuard, PlanGateGuard
│       │   │   └── pipes/      # ZodValidationPipe
│       │   ├── prisma/         # PrismaService, PrismaModule
│       │   └── mongoose/       # Mongoose schemas
│       ├── prisma/
│       │   └── schema.prisma
│       ├── prisma.config.ts    # Prisma 7 CLI config (datasource URL)
│       ├── Dockerfile
│       ├── .dockerignore
│       └── railway.json
├── packages/
│   ├── types/                  # Shared TS interfaces/enums
│   │   └── src/index.ts        # User, Plan, DashboardData, ApiResponse<T>
│   └── utils/                  # Pure financial calculations
│       └── src/                # calculatePCR, calculateMaxPain, calculateSentiment
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
├── turbo.json
└── docker-compose.yml
```

---

## Module Map & Build Order

### Module Dependency Graph

```
M0  Shared Infra     ← everything depends on this
M1  Auth             → M0
M2  User & Plan      → M0, M1
M3  Market Data      → M0  (no auth — public endpoints)
M4  Data History     → M0, M3, M2
M5  Watchlist        → M0, M1, M2, M3
M6  Alerts           → M0, M1, M2, M3, M7
M7  Notifications    → M0, M1, M2
M8  Subscription     → M0, M1, M2, M7
M9  AI               → M0, M1, M2, M3, M4
M10 Analytics        → M0
M11 SEO & Marketing  → M0, M3
M12 Platform (fut.)  → everything above
```

### Strict Build Order

```
M0 → M1 → M2 → M3 → M11
                └── M4 → M5
                        └── M7 → M6
                                └── M8
                                └── M9
                                └── M10
                                └── M12 (future)
```

### Phase Plan

| Phase             | Key Output                       | Duration |
| ----------------- | -------------------------------- | -------- |
| P0 Infrastructure | Repo, CI, local dev (COMPLETE)   | 2 days   |
| P1 Auth + DB      | Login, all tables, JWT           | 4 days   |
| P2 Market Data    | 🚀 Live dashboard (soft launch)  | 6 days   |
| P3 User Features  | Watchlist, alerts, notifications | 10 days  |
| P4 Monetization   | 💰 First subscriber              | 6 days   |
| P5 Charts         | OI history, heatmap, PCR         | 5 days   |
| P6 AI             | Chat, strategy, daily brief      | 7 days   |
| P7 Polish         | Analytics, Telegram, resilience  | 4 days   |
| P8 Platform       | Backtesting, community, API      | Mo 7-12  |

### Hard Blockers

| Blocked Module   | Hard Requirement                      |
| ---------------- | ------------------------------------- |
| M2 User & Plan   | M1 Auth (users seeded by auth flow)   |
| M5 Watchlist     | M1 + M2 (auth guard + limit check)    |
| M6 Alerts        | M7 Notifications (delivery target)    |
| M8 Subscriptions | M2 User (plan field exists)           |
| M9 AI            | M3 Market Data (live cache populated) |
| M4 Data History  | M3 Market Data (pipeline source)      |

---

## Key Architectural Decisions

### Response Envelope

All API responses wrapped by `ResponseInterceptor`:

```json
// Success
{ "success": true, "data": {...}, "timestamp": "ISO8601" }
// Error (via HttpExceptionFilter)
{ "success": false, "error": { "code": 404, "message": "...", "path": "/v1/...", "timestamp": "ISO8601" } }
```

### Global Prefix

All routes are under `/v1` (`app.setGlobalPrefix('v1')`).

### Auth Tokens

- Access token: JWT (RS256), 15 min TTL, stored in memory (JS variable)
- Refresh token: JWT (RS256), 7 day TTL, HttpOnly Secure SameSite=Strict cookie
- Magic link token: SHA-256 hash of UUID, 15 min TTL in PostgreSQL

### Feature Gating

```typescript
@UseGuards(JwtAuthGuard, PlanGateGuard)
@RequiresPlan('starter', 'pro', 'elite')
```

### Prisma 7 Notes

- Uses `prisma-client-js` generator (not `prisma-client`)
- `prisma.config.ts` at `apps/api/prisma.config.ts` for CLI datasource URL
- PrismaClient constructor requires `adapter` (e.g., `@prisma/adapter-pg`) — no `datasourceUrl` option
- Migration: `pnpm --filter @optionkart/api exec prisma migrate dev --name <name>`

### Market Data Pipeline

- Upstox REST API polled every 3 min during market hours (9:15-15:30 IST, Mon-Fri)
- Redis cache: `ok:live:{INDEX}:chain` (TTL 90s), `ok:live:{INDEX}:dashboard` (TTL 90s), `ok:live:{INDEX}:spot` (TTL 30s)
- MongoDB snapshots written every 5 min
- Cache miss fallback: last MongoDB snapshot

### Server-Side Calculations (in `packages/utils`)

- `calculatePCR(chain)` — totalPutOI / totalCallOI
- `calculateMaxPain(chain)` — strike with minimum total $ pain
- `calculateSentiment(pcr, callOIChange, putOIChange)` → { signal: BULLISH|NEUTRAL|BEARISH, score: 0-100 }
- `isMarketOpen(date)` — IST market hours + holiday check

---

## API Endpoints Summary

| Endpoint                                | Auth          | Plan Gate   | Purpose                |
| --------------------------------------- | ------------- | ----------- | ---------------------- |
| `GET /v1/health`                        | Public        | —           | Health check           |
| `POST /auth/magic-link`                 | Public        | —           | Send magic link        |
| `POST /auth/verify-magic-link`          | Public        | —           | Exchange token for JWT |
| `POST /auth/google`                     | Public        | —           | Google OAuth           |
| `POST /auth/refresh`                    | Cookie        | —           | Rotate tokens          |
| `POST /auth/logout`                     | Any           | —           | Clear session          |
| `GET /user/profile`                     | JWT           | —           | Current user           |
| `PATCH /user/profile`                   | JWT           | —           | Update profile         |
| `GET /user/preferences`                 | JWT           | —           | User preferences       |
| `PUT /user/preferences`                 | JWT           | —           | Update preferences     |
| `GET /market/dashboard/:index`          | Public        | —           | Dashboard data         |
| `GET /market/chain/:index`              | Public        | —           | Options chain          |
| `GET /market/spot/:index`               | Public        | —           | Spot price             |
| `GET /market/pcr/:index`                | Public        | —           | Current PCR            |
| `GET /market/max-pain/:index`           | Public        | —           | Max Pain               |
| `GET /market/support-resistance/:index` | Public        | —           | OI support/resistance  |
| `GET /market/pcr/:index/history`        | JWT           | Starter+    | PCR history            |
| `GET /market/heatmap/:index`            | JWT           | Starter+    | OI heatmap             |
| `GET /market/oi-history/:index`         | JWT           | Starter+    | OI time-series         |
| `GET /market/unusual-activity/:index`   | JWT           | Starter+    | Unusual OI scanner     |
| `GET /watchlist`                        | JWT           | —           | My watchlist           |
| `POST /watchlist`                       | JWT           | —           | Add watchlist item     |
| `DELETE /watchlist/:id`                 | JWT           | —           | Remove item            |
| `GET /alerts`                           | JWT           | —           | My alerts              |
| `POST /alerts`                          | JWT           | —           | Create alert           |
| `PATCH /alerts/:id`                     | JWT           | —           | Update alert           |
| `DELETE /alerts/:id`                    | JWT           | —           | Delete alert           |
| `GET /alerts/history`                   | JWT           | —           | Trigger history        |
| `POST /subscription/create`             | JWT           | —           | Create Razorpay sub    |
| `POST /subscription/cancel`             | JWT           | —           | Cancel sub             |
| `POST /subscription/webhook`            | IP-restricted | —           | Razorpay webhook       |
| `POST /ai/chat`                         | JWT           | All (quota) | AI chat (SSE)          |
| `POST /ai/strategy-suggest`             | JWT           | Pro+        | Strategy suggestion    |
| `GET /ai/daily-brief/:index`            | JWT           | Pro+        | Daily market brief     |
| `GET /ai/usage`                         | JWT           | —           | AI quota usage         |

---

## Database Architecture

### PostgreSQL (Prisma) — Users, Subscriptions, Alerts, Watchlists

9 models: `User`, `MagicLinkToken`, `Subscription`, `Payment`, `WatchlistItem`, `Alert`, `AlertHistory`, `UserPreferences`, `WebhookEvent`

### MongoDB (Mongoose) — Market Data, AI Logs

3 collections: `oi_snapshots`, `ai_conversations`, `daily_summaries`

---

## Caching Strategy (Redis)

Key pattern: `ok:{domain}:{entity}:{id}`

| Key Pattern                         | TTL          |
| ----------------------------------- | ------------ |
| `ok:live:{INDEX}:chain`             | 90s          |
| `ok:live:{INDEX}:dashboard`         | 90s          |
| `ok:live:{INDEX}:spot`              | 30s          |
| `ok:session:{userId}`               | 24h          |
| `ok:ratelimit:{id}:{ep}:{win}`      | Window-based |
| `ok:alert:last:{alertId}`           | 5 min        |
| `ok:ai:cache:{queryHash}`           | 180s         |
| `ok:ai:quota:{userId}:{YYYY-MM-DD}` | Midnight IST |
| `ok:upstox:access_token`            | 23h          |
| `ok:magiclink:rate:{email}`         | 10 min       |

---

## Plan Limits

| Feature           | FREE       | STARTER | PRO     | ELITE         |
| ----------------- | ---------- | ------- | ------- | ------------- |
| Price             | ₹0         | ₹199/mo | ₹499/mo | ₹999/mo       |
| Watchlist items   | 5          | 15      | 30      | 50            |
| Active alerts     | 3          | 10      | 25      | Unlimited     |
| AI queries/day    | 5          | 30      | 100     | 300           |
| Historical data   | Today only | 7 days  | 30 days | 90 days + CSV |
| Telegram delivery | —          | —       | ✅      | ✅            |
| BYO OpenAI key    | —          | —       | —       | ✅            |

---

## Environment Variables

### Backend (`apps/api/.env`)

```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
DATABASE_DIRECT_URL=postgresql://...
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
FRONTEND_URL=http://localhost:3000
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
OPENAI_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
UPSTOX_CLIENT_ID=
UPSTOX_CLIENT_SECRET=
ENCRYPTION_KEY=
```

### Frontend (`apps/web/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

---

## Development Commands

```bash
# Install all workspace deps
pnpm install

# Start Docker services
docker compose up -d

# Prisma: generate client + run migration
pnpm --filter @optionkart/api exec prisma generate
pnpm --filter @optionkart/api exec prisma migrate dev --name init

# Start API (dev mode with watch)
pnpm --filter @optionkart/api start:dev

# Start frontend
pnpm --filter @optionkart/web dev

# Type-check all packages
pnpm turbo run type-check

# Build all packages
pnpm turbo run build

# Lint all packages
pnpm turbo run lint

# Run tests
pnpm turbo run test
```

---

## Coding Conventions

- **No comments in code** unless absolutely necessary for complex logic
- **Strict TypeScript** — enable strict mode; no `any` without explicit reason
- **NestJS modular architecture** — one module per domain (auth, market, user, watchlist, alerts, subscription, ai)
- **Pure functions in `packages/utils`** — 100% test coverage required
- **Shared types in `packages/types`** — includes `ApiResponse<T>` envelope
- **All API routes under `/v1` prefix**
- **ResponseInterceptor** wraps all success responses; **HttpExceptionFilter** wraps all errors
- **Feature gating** via `@RequiresPlan()` + `PlanGateGuard`
- **Public routes** marked with `@Public()` decorator (skips JWT auth guard)
- **Prisma 7** uses `prisma-client-js` generator with `@prisma/adapter-pg` for database connection
- **Zod** for env schema validation; **class-validator** for DTO validation
- **Dark-first CSS** — use CSS variables from `globals.css` (`--background: #0d0f14`, `--foreground: #e8ecf4`, etc.)
- **TanStack Query** for all client-side data fetching with `api-client.ts` as transport
- **Silent refresh** on 401 via Axios response interceptor
