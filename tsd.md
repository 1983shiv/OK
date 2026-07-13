# OptionKart — Technical Specification Document (TSD)

**Version:** 1.1  
**Last Updated:** May 27, 2026  
**Status:** Draft  
**Author:** Engineering  
**Derived From:** PRD v2.0  
**Confidentiality:** Internal — Engineering

---

## Table of Contents

1. [Document Purpose & Scope](#1-document-purpose--scope)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Backend Architecture (NestJS)](#4-backend-architecture-nestjs)
5. [Frontend Architecture (Next.js)](#5-frontend-architecture-nextjs)
6. [Database Schemas](#6-database-schemas)
7. [API Specification](#7-api-specification)
8. [Data Pipeline & Cron Jobs](#8-data-pipeline--cron-jobs)
9. [Authentication & Session Management](#9-authentication--session-management)
10. [Caching Strategy (Redis)](#10-caching-strategy-redis)
11. [AI Integration](#11-ai-integration)
12. [Payment Integration (Razorpay)](#12-payment-integration-razorpay)
13. [Alert System](#13-alert-system)
14. [Security Implementation](#14-security-implementation)
15. [Environment Variables](#15-environment-variables)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Local Development Setup](#17-local-development-setup)
18. [Testing Strategy](#18-testing-strategy)

---

# 1. Document Purpose & Scope

This TSD translates the OptionKart PRD into concrete engineering specifications. It is the authoritative reference for every implementation decision and is intended for use by developers building the system.

**In scope:** Backend API, data pipeline, frontend application, database design, third-party integrations.  
**Out of scope:** UI visual design (handled in Figma), marketing copy, legal review.

---

# 2. Technology Stack

## 2.1 Canonical Versions

| Layer                 | Technology               | Version                         | Notes                                  |
| --------------------- | ------------------------ | ------------------------------- | -------------------------------------- |
| **Frontend**          | Next.js                  | 15.x (App Router)               | Deployed on Vercel                     |
| **Frontend lang**     | TypeScript               | 5.x                             | Strict mode enabled                    |
| **Backend runtime**   | Node.js                  | 22.x LTS                        |                                        |
| **Backend framework** | NestJS                   | 11.x                            | TypeScript-native                      |
| **Backend lang**      | TypeScript               | 5.x                             | Strict mode enabled                    |
| **ORM (Postgres)**    | Prisma                   | 7.x                             | Schema-first, migrations               |
| **ODM (MongoDB)**     | Mongoose                 | 8.x                             | Schema validation                      |
| **Cache / Queue**     | Redis                    | 7.x                             | Via Upstash (cloud)                    |
| **Queue library**     | BullMQ                   | 5.x                             | Redis-backed                           |
| **Primary DB**        | PostgreSQL               | 16.x                            | Via Neon                               |
| **Document DB**       | MongoDB                  | 7.x                             | Via Atlas                              |
| **HTTP client**       | Axios                    | 1.x                             | Upstox API calls + frontend transport  |
| **Data fetching**     | TanStack Query           | 5.x                             | Queries, mutations, cache invalidation |
| **Validation**        | Zod                      | 3.x (FE) + class-validator (BE) |                                        |
| **Auth**              | Jose (JWT)               | 5.x                             | RS256 tokens                           |
| **Email**             | Resend                   | Latest                          | Transactional email                    |
| **AI**                | openai (SDK)             | 4.x                             | GPT-4o-mini                            |
| **Payments**          | razorpay (SDK)           | 2.x                             | Subscriptions API                      |
| **Testing (BE)**      | Jest + Supertest         | Latest                          |                                        |
| **Testing (FE)**      | Vitest + Testing Library | Latest                          |                                        |

## 2.2 Third-Party Services

| Service             | Purpose                                 | Plan (MVP)             |
| ------------------- | --------------------------------------- | ---------------------- |
| Vercel              | Frontend hosting + Edge                 | Hobby → Pro            |
| Railway             | Backend hosting                         | Starter                |
| Neon                | PostgreSQL + built-in connection pooler | Free → Launch ($19/mo) |
| MongoDB Atlas       | Document store                          | M0 Free → M10          |
| Upstash Redis       | Cache + BullMQ queues                   | Free → Pay-as-go       |
| Upstox API          | Market data source                      | Free (v2)              |
| OpenAI              | AI inference                            | Pay-as-go              |
| Razorpay            | Payments                                | Production keys        |
| Resend              | Email delivery                          | Free → Paid            |
| Sentry              | Error tracking                          | Free                   |
| Plausible / PostHog | Analytics                               | Free                   |

---

# 3. Repository Structure

## 3.1 Monorepo Layout

```
optionkart/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # NestJS backend
├── packages/
│   ├── types/                  # Shared TypeScript types/interfaces
│   └── utils/                  # Shared utility functions (calculations)
├── .env.example
├── package.json                # Workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
└── turbo.json                  # Turborepo config
```

## 3.2 Backend Directory Structure (`apps/api/`)

```
apps/api/
├── src/
│   ├── main.ts                         # App entry point
│   ├── app.module.ts                   # Root module
│   ├── config/
│   │   ├── configuration.ts            # Config schema (Joi validated)
│   │   └── database.config.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── optional-jwt.guard.ts
│   │   │   └── dto/
│   │   │       ├── magic-link.dto.ts
│   │   │       └── verify-token.dto.ts
│   │   ├── market/
│   │   │   ├── market.module.ts
│   │   │   ├── market.controller.ts
│   │   │   ├── market.service.ts
│   │   │   ├── upstox.service.ts       # Upstox API client
│   │   │   └── dto/
│   │   │       └── market-query.dto.ts
│   │   ├── user/
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── dto/
│   │   ├── watchlist/
│   │   │   ├── watchlist.module.ts
│   │   │   ├── watchlist.controller.ts
│   │   │   ├── watchlist.service.ts
│   │   │   └── dto/
│   │   ├── alerts/
│   │   │   ├── alerts.module.ts
│   │   │   ├── alerts.controller.ts
│   │   │   ├── alerts.service.ts
│   │   │   ├── alert-evaluator.service.ts
│   │   │   └── dto/
│   │   ├── subscription/
│   │   │   ├── subscription.module.ts
│   │   │   ├── subscription.controller.ts
│   │   │   ├── subscription.service.ts
│   │   │   ├── webhook.service.ts
│   │   │   └── dto/
│   │   └── ai/
│   │       ├── ai.module.ts
│   │       ├── ai.controller.ts
│   │       ├── ai.service.ts
│   │       ├── prompt-builder.service.ts
│   │       └── dto/
│   ├── workers/
│   │   ├── workers.module.ts
│   │   ├── data-ingestion.worker.ts    # BullMQ processor
│   │   ├── alert-evaluator.worker.ts
│   │   └── daily-summary.worker.ts
│   ├── schedulers/
│   │   └── market-data.scheduler.ts   # @nestjs/schedule cron jobs
│   ├── common/
│   │   ├── decorators/
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts  # Wraps all responses in envelope
│   │   ├── guards/
│   │   │   └── plan-gate.guard.ts       # Feature-gating by plan
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   └── middleware/
│   │       └── rate-limit.middleware.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── mongoose/
│       ├── mongoose.module.ts
│       └── schemas/
│           ├── oi-snapshot.schema.ts
│           ├── ai-conversation.schema.ts
│           └── daily-summary.schema.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
├── .env
└── package.json
```

## 3.3 Frontend Directory Structure (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Dashboard shell w/ nav
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            # Market Sentiment Dashboard
│   │   │   ├── chain/
│   │   │   │   └── page.tsx            # Options chain table
│   │   │   ├── heatmap/
│   │   │   │   └── page.tsx            # OI Heatmap
│   │   │   ├── watchlist/
│   │   │   │   └── page.tsx
│   │   │   ├── alerts/
│   │   │   │   └── page.tsx
│   │   │   └── ai/
│   │   │       └── page.tsx            # AI Chat
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── verify/
│   │   │       └── page.tsx            # Magic link verification
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── api/                        # Next.js Route Handlers
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── SentimentCard.tsx
│   │   │   ├── PCRGauge.tsx
│   │   │   ├── OIBarChart.tsx
│   │   │   ├── TopMovers.tsx
│   │   │   └── MarketStatusBadge.tsx
│   │   ├── chain/
│   │   │   └── OptionsChainTable.tsx
│   │   ├── charts/
│   │   │   ├── OITrendChart.tsx
│   │   │   ├── PCRHistoryChart.tsx
│   │   │   └── OIHeatmap.tsx
│   │   ├── ai/
│   │   │   ├── ChatInterface.tsx
│   │   │   └── ChatMessage.tsx
│   │   ├── ui/                         # shadcn/ui primitives
│   │   └── shared/
│   │       ├── PaywallGate.tsx
│   │       ├── PlanBadge.tsx
│   │       └── LoadingSkeleton.tsx
│   ├── hooks/
│   │   ├── useDashboard.ts             # TanStack Query hook for dashboard data
│   │   ├── useOptionsChain.ts
│   │   └── useUser.ts
│   ├── lib/
│   │   ├── api-client.ts               # Typed API client (fetcher)
│   │   ├── auth.ts                     # Auth helpers
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
├── next.config.ts
└── package.json
```

---

# 4. Backend Architecture (NestJS)

## 4.1 Application Bootstrap (`main.ts`)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

## 4.2 Module Dependency Map

```
AppModule
 ├── ConfigModule (global)
 ├── PrismaModule (global)
 ├── MongooseModule (global)
 ├── RedisModule (global, ioredis)
 ├── BullModule (global, Redis config)
 ├── ScheduleModule
 ├── AuthModule
 │    └── JwtModule, PassportModule
 ├── MarketModule
 │    └── UpstoxService, CacheService
 ├── UserModule
 ├── WatchlistModule
 ├── AlertsModule
 │    └── BullQueue(alert-evaluation)
 ├── SubscriptionModule
 │    └── RazorpayService
 ├── AiModule
 │    └── OpenAI client
 └── WorkersModule
      └── BullMQ processors
```

## 4.3 Response Envelope Interceptor

All responses are wrapped in a consistent envelope:

```typescript
// response.interceptor.ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
```

Error responses (from `HttpExceptionFilter`):

```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_REQUIRED",
    "message": "This feature requires a Pro subscription",
    "upgrade_url": "/pricing"
  }
}
```

## 4.4 Feature Gating Guard

```typescript
// plan-gate.guard.ts
export const RequiresPlan = (...plans: Plan[]) =>
  SetMetadata('required_plans', plans);

@Injectable()
export class PlanGateGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlans = this.reflector.get<Plan[]>('required_plans', context.getHandler());
    if (!requiredPlans) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredPlans.includes(user.plan)) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_REQUIRED',
        message: `This feature requires one of: ${requiredPlans.join(', ')}`,
        upgrade_url: '/pricing',
      });
    }
    return true;
  }
}

// Usage on controller method:
@Get('heatmap/:index')
@UseGuards(JwtAuthGuard, PlanGateGuard)
@RequiresPlan('starter', 'pro', 'elite')
getHeatmap(@Param('index') index: string) { ... }
```

## 4.5 Market Computations (`packages/utils/`)

Core financial calculations live in the shared `utils` package so they can be tested in isolation:

```typescript
// packages/utils/src/market-calculations.ts

export function calculatePCR(chain: OptionChainEntry[]): number {
  const totalPutOI = chain.reduce((sum, s) => sum + s.pe.oi, 0);
  const totalCallOI = chain.reduce((sum, s) => sum + s.ce.oi, 0);
  return totalCallOI === 0 ? 0 : totalPutOI / totalCallOI;
}

export function calculateMaxPain(chain: OptionChainEntry[]): number {
  // For each strike, calculate total $ pain for all option buyers
  const strikes = chain.map((s) => s.strike);
  let minPain = Infinity;
  let maxPainStrike = strikes[0];

  for (const expiryStrike of strikes) {
    let totalPain = 0;
    for (const entry of chain) {
      // Call buyers lose if expiry < their strike
      if (expiryStrike < entry.strike) {
        totalPain += (entry.strike - expiryStrike) * entry.ce.oi;
      }
      // Put buyers lose if expiry > their strike
      if (expiryStrike > entry.strike) {
        totalPain += (expiryStrike - entry.strike) * entry.pe.oi;
      }
    }
    if (totalPain < minPain) {
      minPain = totalPain;
      maxPainStrike = expiryStrike;
    }
  }
  return maxPainStrike;
}

export function calculateSentiment(
  pcr: number,
  callOIChange: number,
  putOIChange: number,
): { signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH'; score: number } {
  let score = 50; // neutral baseline
  // PCR component (weight: 40%)
  if (pcr > 1.3) score += 20;
  else if (pcr > 1.0) score += 10;
  else if (pcr < 0.7) score -= 20;
  else if (pcr < 1.0) score -= 10;
  // OI change component (weight: 60%)
  if (putOIChange > callOIChange * 1.2) score += 10;
  else if (callOIChange > putOIChange * 1.2) score -= 10;

  const signal = score >= 60 ? 'BULLISH' : score <= 40 ? 'BEARISH' : 'NEUTRAL';
  return { signal, score: Math.min(100, Math.max(0, score)) };
}
```

---

# 5. Frontend Architecture (Next.js)

## 5.1 Routing & Layout

The App Router uses two route groups:

- `(dashboard)` — requires the top navigation bar shell
- `(auth)` — minimal layout for login/verify pages

Route group layouts do not add URL segments:

- `/dashboard` → renders `(dashboard)/dashboard/page.tsx`
- `/login` → renders `(auth)/login/page.tsx`

## 5.2 Data Fetching Strategy

| Data type                           | Strategy                                    | Library                                                | Rationale                                        |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Dashboard (public, live)            | Client-side with auto-refresh               | TanStack Query (`useQuery`, `refetchInterval: 60_000`) | Stale-while-revalidate; background refetch       |
| Options chain                       | Client-side                                 | TanStack Query (`useQuery`)                            | Same pattern as dashboard                        |
| User profile / preferences          | Server Component fetch + TanStack Query     | Both                                                   | SSR for initial render, client cache for updates |
| Mutations (watchlist, alerts, etc.) | Client-side                                 | TanStack Query (`useMutation` + `invalidateQueries`)   | Optimistic updates + auto-invalidation           |
| AI chat responses                   | Server-Sent Events (SSE)                    | Native `EventSource`                                   | Streaming tokens                                 |
| Static/config data (plans)          | Next.js `fetch` with `cache: 'force-cache'` | Built-in                                               | Cached at build/edge                             |

**TanStack Query global config:**

```typescript
// app/layout.tsx  (client component wrapper)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s before data is considered stale
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Wrap children in <QueryClientProvider client={queryClient}>
```

**Default hook pattern:**

```typescript
// All query hooks use the Axios api-client as the fetcher:
const { data, isLoading, error } = useQuery({
  queryKey: ['dashboard', index],
  queryFn: () => apiGet<DashboardData>(`/market/dashboard/${index}`),
  refetchInterval: 60_000,
});
```

## 5.3 API Client (`lib/api-client.ts`)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/v1',
  withCredentials: true, // send httpOnly cookie
  timeout: 10_000,
});

// Attach access token from memory (not localStorage — XSS protection)
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await apiClient.post('/auth/refresh');
      setAccessToken(data.data.access_token);
      return apiClient(error.config);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

## 5.4 Paywall Gate Component

```typescript
// components/shared/PaywallGate.tsx
interface PaywallGateProps {
  requiredPlans: Plan[];
  softGate?: boolean;      // true = show blurred preview; false = show nothing
  children: React.ReactNode;
  previewContent?: React.ReactNode;
}

export function PaywallGate({ requiredPlans, softGate, children, previewContent }: PaywallGateProps) {
  const { user } = useUser();
  const hasAccess = user && requiredPlans.includes(user.plan);

  if (hasAccess) return <>{children}</>;

  if (softGate && previewContent) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-60">
          {previewContent}
        </div>
        <UpgradeOverlay requiredPlans={requiredPlans} />
      </div>
    );
  }

  return <UpgradeCTA requiredPlans={requiredPlans} />;
}
```

---

# 6. Database Schemas

## 6.1 PostgreSQL — Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AuthProvider {
  MAGIC_LINK
  GOOGLE
}

enum Plan {
  FREE
  STARTER
  PRO
  ELITE
}

enum SubscriptionStatus {
  CREATED
  AUTHENTICATED
  ACTIVE
  PAUSED
  HALTED
  CANCELLED
  COMPLETED
  EXPIRED
}

enum AlertType {
  OI_SPIKE
  PCR_CROSS
  MAX_PAIN_SHIFT
  WATCHLIST
}

enum OptionType {
  CE
  PE
}

model User {
  id                   String             @id @default(uuid())
  email                String             @unique
  name                 String?
  avatarUrl            String?
  authProvider         AuthProvider
  googleId             String?            @unique
  plan                 Plan               @default(FREE)
  aiCreditsRemaining   Int                @default(5)
  aiCreditsResetAt     DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  lastLoginAt          DateTime?

  subscriptions        Subscription[]
  payments             Payment[]
  watchlistItems       WatchlistItem[]
  alerts               Alert[]
  alertHistory         AlertHistory[]
  preferences          UserPreferences?
  magicLinkTokens      MagicLinkToken[]

  @@map("users")
}

model MagicLinkToken {
  id        String   @id @default(uuid())
  userId    String?
  email     String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([token])
  @@index([email])
  @@map("magic_link_tokens")
}

model Subscription {
  id                      String             @id @default(uuid())
  userId                  String
  razorpaySubscriptionId  String             @unique
  razorpayPlanId          String
  planName                Plan
  status                  SubscriptionStatus
  currentPeriodStart      DateTime?
  currentPeriodEnd        DateTime?
  billingCycle            String             // 'monthly' | 'yearly'
  amountPaise             Int
  currency                String             @default("INR")
  paymentMethod           String?
  failureCount            Int                @default(0)
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt

  user                    User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments                Payment[]

  @@map("subscriptions")
}

model Payment {
  id                    String   @id @default(uuid())
  userId                String
  subscriptionId        String?
  razorpayPaymentId     String   @unique
  razorpayOrderId       String?
  amountPaise           Int
  currency              String   @default("INR")
  status                String   // 'authorized' | 'captured' | 'failed' | 'refunded'
  method                String?
  errorCode             String?
  errorDescription      String?
  refundId              String?
  refundAmountPaise     Int?
  invoiceId             String?
  createdAt             DateTime @default(now())

  user                  User         @relation(fields: [userId], references: [id])
  subscription          Subscription? @relation(fields: [subscriptionId], references: [id])

  @@map("payments")
}

model WatchlistItem {
  id             String     @id @default(uuid())
  userId         String
  instrumentKey  String
  symbol         String
  strikePrice    Decimal    @db.Decimal(10, 2)
  optionType     OptionType
  expiryDate     DateTime   @db.Date
  addedAt        DateTime   @default(now())

  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, instrumentKey])
  @@map("watchlist_items")
}

model Alert {
  id                 String     @id @default(uuid())
  userId             String
  alertType          AlertType
  symbol             String
  strikePrice        Decimal?   @db.Decimal(10, 2)
  optionType         OptionType?
  conditionOperator  String     // 'gt' | 'lt' | 'cross_above' | 'cross_below'
  conditionValue     Decimal    @db.Decimal(10, 4)
  isActive           Boolean    @default(true)
  lastTriggeredAt    DateTime?
  triggerCount       Int        @default(0)
  deliveryChannels   String[]
  createdAt          DateTime   @default(now())

  user               User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  history            AlertHistory[]

  @@map("alerts")
}

model AlertHistory {
  id               String   @id @default(uuid())
  alertId          String
  userId           String
  triggeredAt      DateTime @default(now())
  triggerData      Json
  notificationSent Boolean  @default(false)
  channelsNotified String[]

  alert            Alert    @relation(fields: [alertId], references: [id])
  user             User     @relation(fields: [userId], references: [id])

  @@map("alert_history")
}

model UserPreferences {
  userId                  String   @id
  theme                   String   @default("dark")
  defaultIndex            String   @default("NIFTY")
  dashboardLayout         Json?
  notificationEmail       Boolean  @default(true)
  notificationPush        Boolean  @default(true)
  notificationTelegram    Boolean  @default(false)
  telegramChatId          String?
  timezone                String   @default("Asia/Kolkata")
  byoOpenaiKey            String?  // AES-256 encrypted

  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

model WebhookEvent {
  id           String   @id @default(uuid())
  eventId      String   @unique  // Razorpay event_id — for idempotency
  eventType    String
  payload      Json
  processedAt  DateTime?
  error        String?
  createdAt    DateTime @default(now())

  @@map("webhook_events")
}
```

## 6.2 MongoDB — Mongoose Schemas

### OI Snapshot (`oi-snapshot.schema.ts`)

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'oi_snapshots', timestamps: false })
export class OiSnapshot extends Document {
  @Prop({ required: true, index: true }) symbol: string; // 'NIFTY' | 'BANKNIFTY'
  @Prop({ required: true }) expiry: string; // 'YYYY-MM-DD'
  @Prop({ required: true, index: true }) snapshotTime: Date;
  @Prop({ required: true }) spotPrice: number;

  @Prop({
    type: [
      {
        strike: Number,
        ce: { oi: Number, oiChange: Number, volume: Number, ltp: Number, iv: Number },
        pe: { oi: Number, oiChange: Number, volume: Number, ltp: Number, iv: Number },
      },
    ],
  })
  strikes: StrikeData[];

  @Prop({
    type: {
      pcr: Number,
      maxPain: Number,
      totalCallOi: Number,
      totalPutOi: Number,
      sentiment: String,
      sentimentScore: Number,
    },
  })
  computed: ComputedMetrics;
}

export const OiSnapshotSchema = SchemaFactory.createForClass(OiSnapshot);

// Compound indexes
OiSnapshotSchema.index({ symbol: 1, snapshotTime: -1 });
OiSnapshotSchema.index({ symbol: 1, expiry: 1, snapshotTime: -1 });
// TTL: auto-delete after 90 days
OiSnapshotSchema.index({ snapshotTime: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
```

### AI Conversation (`ai-conversation.schema.ts`)

```typescript
@Schema({ collection: 'ai_conversations' })
export class AiConversation extends Document {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true }) sessionId: string;
  @Prop({ type: [MessageSchema] }) messages: Message[];
  @Prop({ default: 0 }) totalTokens: number;
  @Prop({ required: true }) createdAt: Date;
  @Prop({ required: true }) expiresAt: Date; // TTL field
}

// TTL index: expires per-conversation expiry date
AiConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Daily Summary (`daily-summary.schema.ts`)

```typescript
@Schema({ collection: 'daily_summaries' })
export class DailySummary extends Document {
  @Prop({ required: true }) symbol: string;
  @Prop({ required: true }) date: string; // 'YYYY-MM-DD'
  @Prop() openPcr: number;
  @Prop() closePcr: number;
  @Prop() highPcr: number;
  @Prop() lowPcr: number;
  @Prop() maxPainOpen: number;
  @Prop() maxPainClose: number;
  @Prop() spotOpen: number;
  @Prop() spotClose: number;
  @Prop() spotHigh: number;
  @Prop() spotLow: number;
  @Prop() totalCallOiChange: number;
  @Prop() totalPutOiChange: number;
  @Prop({ type: [Object] }) unusualActivities: UnusualActivity[];
  @Prop() aiSummary: string;
}

DailySummarySchema.index({ symbol: 1, date: -1 }, { unique: true });
```

---

# 7. API Specification

## 7.1 Base URL & Conventions

- **Base URL:** `https://api.optionkart.com/v1`
- **Auth header:** `Authorization: Bearer <access_token>`
- **Content-Type:** `application/json`
- All timestamps in ISO 8601 UTC

## 7.2 Authentication Endpoints

### `POST /auth/magic-link`

Sends a magic link email.

**Request:**

```json
{ "email": "user@example.com" }
```

**Response `200`:**

```json
{ "success": true, "data": { "message": "Magic link sent" } }
```

**Rate limit:** 3 requests per email per 10 minutes.

---

### `POST /auth/verify-magic-link`

Exchanges a magic link token for JWTs.

**Request:**

```json
{ "token": "abc123..." }
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "user": { "id": "uuid", "email": "...", "plan": "free" }
  }
}
```

Sets `refresh_token` as `HttpOnly; Secure; SameSite=Strict` cookie.

---

### `POST /auth/google`

Handles Google OAuth callback.

**Request:** `{ "code": "google_auth_code" }`  
**Response:** Same as `verify-magic-link`.

---

### `POST /auth/refresh`

Silently rotates tokens using the refresh cookie.

**Request:** No body (reads `refresh_token` cookie).  
**Response:** `{ "data": { "access_token": "<new_jwt>" } }`

---

### `POST /auth/logout`

**Request:** No body.  
**Response `200`**, clears refresh cookie.

---

## 7.3 Market Data Endpoints

### `GET /market/dashboard/:index`

Returns all data needed for the main dashboard. **Public — no auth required.**

**Params:** `index` = `NIFTY` | `BANKNIFTY`

**Response `200`:**

```json
{
  "data": {
    "index": "NIFTY",
    "spotPrice": 24580.5,
    "priceChange": 110.25,
    "priceChangePct": 0.45,
    "sentiment": "BULLISH",
    "sentimentScore": 72,
    "pcr": 1.23,
    "maxPain": 24500,
    "atmStrike": 24600,
    "totalCallOi": 12500000,
    "totalPutOi": 15400000,
    "topCallBuildup": [{ "strike": 24700, "oiChange": 520000, "optionType": "CE" }],
    "topPutBuildup": [{ "strike": 24400, "oiChange": 480000, "optionType": "PE" }],
    "isMarketOpen": true,
    "lastUpdated": "2026-04-19T09:20:00Z",
    "dataSource": "Upstox v2",
    "isCached": true,
    "cacheAgeSeconds": 45
  }
}
```

---

### `GET /market/chain/:index`

Returns simplified options chain. **Public.**

**Query params:** `expiry` (optional, defaults to current expiry)

**Response `200`:**

```json
{
  "data": {
    "expiry": "2026-04-24",
    "atmStrike": 24600,
    "chain": [
      {
        "strike": 24500,
        "ce": { "oi": 1520000, "oiChange": 210000, "ltp": 185.5, "iv": 14.2, "volume": 45000 },
        "pe": { "oi": 1890000, "oiChange": -50000, "ltp": 102.3, "iv": 15.1, "volume": 32000 }
      }
    ]
  }
}
```

---

### `GET /market/pcr/:index/history`

**Auth required.** Returns PCR history.

**Query:** `from=YYYY-MM-DD&to=YYYY-MM-DD`  
**Plan gate:** `starter`, `pro`, `elite` (free users get today only)

---

### `GET /market/heatmap/:index`

**Auth required.** Returns OI heatmap data.  
**Plan gate:** `starter`, `pro`, `elite`

**Response `200`:**

```json
{
  "data": {
    "strikes": [24400, 24500, 24600, 24700, 24800],
    "intervals": ["09:15", "09:30", "09:45", "10:00"],
    "callMatrix": [[100000, 150000, 200000, 220000], ...],
    "putMatrix": [[80000, 120000, 180000, 200000], ...]
  }
}
```

---

## 7.4 AI Endpoints

### `POST /ai/chat`

Streams AI response using Server-Sent Events.

**Auth required.** Plan gate: all (quota enforced).

**Request:**

```json
{ "query": "What is Nifty sentiment today?", "sessionId": "uuid" }
```

**Response:** `Content-Type: text/event-stream`

```
data: {"type":"token","content":"Based on"}
data: {"type":"token","content":" today's data..."}
data: {"type":"done","tokensUsed":340,"creditsRemaining":4}
```

**Error (quota exhausted):**

```json
{
  "success": false,
  "error": { "code": "AI_QUOTA_EXCEEDED", "message": "...", "upgrade_url": "/pricing" }
}
```

---

### `GET /ai/daily-brief/:index`

Returns pre-generated daily brief. **Auth required, Pro/Elite.**

---

## 7.5 Subscription Endpoints

### `POST /subscription/create`

Creates a Razorpay subscription.

**Request:**

```json
{ "planId": "starter_monthly", "billingCycle": "monthly" }
```

**Response:**

```json
{
  "data": {
    "subscriptionId": "sub_XXXX",
    "razorpayKeyId": "rzp_live_XXXX",
    "prefill": { "email": "user@example.com", "name": "Rahul" }
  }
}
```

---

### `POST /subscription/webhook`

Razorpay webhook receiver. **No auth (IP-restricted at infra level).**

**Signature verification:** HMAC-SHA256 of raw request body against `RAZORPAY_WEBHOOK_SECRET`.

---

## 7.6 Rate Limiting

Implemented via Redis sliding window counter. Key pattern:
`ok:ratelimit:{userId_or_ip}:{route}:{windowStart}`

| Tier      | Requests/min | Burst (10s) |
| --------- | ------------ | ----------- |
| Anonymous | 30           | 10          |
| Free      | 60           | 20          |
| Starter   | 120          | 40          |
| Pro       | 300          | 100         |
| Elite     | 600          | 200         |

Response on limit exceeded:

```
HTTP 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1713517260
```

---

# 8. Data Pipeline & Cron Jobs

## 8.1 Cron Job Schedule (`market-data.scheduler.ts`)

All jobs run only during market hours: **09:15–15:30 IST, Mon–Fri** (excluding public holidays).

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MarketDataScheduler {

  // Every minute — spot price (lightweight)
  @Cron('* 9-15 * * 1-5', { timeZone: 'Asia/Kolkata' })
  async fetchSpotPrices() { ... }

  // Every 3 minutes — options chain + compute metrics
  @Cron('*/3 9-15 * * 1-5', { timeZone: 'Asia/Kolkata' })
  async fetchOptionsChain() { ... }

  // Every 5 minutes — write OI snapshot to MongoDB
  @Cron('*/5 9-15 * * 1-5', { timeZone: 'Asia/Kolkata' })
  async saveOiSnapshot() { ... }

  // Every 3 minutes — evaluate alerts against latest data
  @Cron('*/3 9-15 * * 1-5', { timeZone: 'Asia/Kolkata' })
  async evaluateAlerts() { ... }

  // 15:35 IST — generate end-of-day summary
  @Cron('35 15 * * 1-5', { timeZone: 'Asia/Kolkata' })
  async generateDailySummary() { ... }

  // 16:00 IST — clean up stale Redis keys
  @Cron('0 16 * * 1-5', { timeZone: 'Asia/Kolkata' })
  async cleanupCache() { ... }
}
```

## 8.2 Data Ingestion Service (`upstox.service.ts`)

```typescript
@Injectable()
export class UpstoxService {
  private readonly baseUrl = 'https://api.upstox.com/v2';

  async getOptionsChain(symbol: 'NIFTY' | 'BANKNIFTY', expiry: string): Promise<RawChain> {
    const instrumentKey = INSTRUMENT_KEYS[symbol];
    const response = await this.httpClient.get(`${this.baseUrl}/option/chain`, {
      params: { instrument_key: instrumentKey, expiry_date: expiry },
      headers: { Authorization: `Bearer ${await this.getAccessToken()}` },
    });
    return response.data.data;
  }

  async getSpotPrice(symbol: string): Promise<number> {
    const response = await this.httpClient.get(`${this.baseUrl}/market-quote/quotes`, {
      params: { instrument_key: INSTRUMENT_KEYS[symbol] },
      headers: { Authorization: `Bearer ${await this.getAccessToken()}` },
    });
    return response.data.data[INSTRUMENT_KEYS[symbol]].last_price;
  }

  // Upstox tokens expire daily — refresh using stored refresh token
  private async getAccessToken(): Promise<string> {
    const cached = await this.redis.get('ok:upstox:access_token');
    if (cached) return cached;
    // Refresh flow ...
  }
}
```

## 8.3 BullMQ Queues

| Queue name       | Processor              | Description                      |
| ---------------- | ---------------------- | -------------------------------- |
| `market-fetch`   | `DataIngestionWorker`  | Upstox API fetch jobs            |
| `alert-eval`     | `AlertEvaluatorWorker` | Per-alert evaluation on new data |
| `notifications`  | `NotificationWorker`   | Email / push / Telegram delivery |
| `ai-daily-brief` | `DailyBriefWorker`     | Batch AI brief generation        |

**Queue configuration:**

```typescript
BullModule.registerQueue(
  {
    name: 'market-fetch',
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  },
  { name: 'alert-eval', defaultJobOptions: { removeOnComplete: 50, attempts: 2 } },
  { name: 'notifications', defaultJobOptions: { removeOnComplete: 100, delay: 0 } },
);
```

## 8.4 Data Flow Diagram

```
Upstox REST API
     │
     │  (every 3 min via cron)
     ▼
UpstoxService.getOptionsChain()
     │
     ├──► Redis  ok:live:NIFTY:chain      (TTL 90s)
     │    Redis  ok:live:NIFTY:dashboard  (TTL 90s)
     │
     ├──► Enqueue: alert-eval jobs for all active NIFTY alerts
     │
     └──► (every 5th run) MongoDB oi_snapshots.insertOne(snapshot)

Client GET /market/dashboard/NIFTY
     │
     ├── Cache hit?  → Return Redis data + { isCached: true }
     └── Cache miss? → Fetch from MongoDB last snapshot + recompute
```

---

# 9. Authentication & Session Management

## 9.1 Token Architecture

| Token            | Type                  | Storage              | TTL    | Algorithm    |
| ---------------- | --------------------- | -------------------- | ------ | ------------ |
| Access token     | JWT                   | Memory (JS variable) | 15 min | RS256        |
| Refresh token    | JWT                   | HttpOnly cookie      | 7 days | RS256        |
| Magic link token | Opaque (hash of UUID) | PostgreSQL           | 15 min | SHA-256 hash |

**Why RS256?** Backend signs with private key; frontend and edge functions can verify with public key without needing the secret.

## 9.2 JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "plan": "pro",
  "iat": 1713517200,
  "exp": 1713518100
}
```

## 9.3 Magic Link Flow

```
1. POST /auth/magic-link { email }
     └─ Rate check (3/email/10min via Redis counter)
     └─ Upsert user record in PostgreSQL
     └─ Generate token = SHA-256(randomUUID())
     └─ Store in magic_link_tokens (expires 15 min)
     └─ Send email via Resend SDK

2. User clicks link → GET /verify?token=abc123 (Next.js page)
     └─ Page calls POST /auth/verify-magic-link { token }
     └─ Lookup token in DB (check not expired, not used)
     └─ Mark token as used (usedAt = now)
     └─ Generate access + refresh JWTs
     └─ Set refresh token as HttpOnly cookie
     └─ Return access token in response body
     └─ Frontend stores access token in memory, redirects
```

## 9.4 Google OAuth Flow

```
1. Frontend opens popup: GET /auth/google/redirect
     └─ Passport GoogleStrategy redirects to Google

2. Google redirects to: GET /auth/google/callback
     └─ Passport exchanges code for profile
     └─ Upsert user (match on googleId OR email)
     └─ Generate JWTs (same as magic link step 2)
```

## 9.5 Session Refresh Strategy

The frontend uses a silent refresh via the `ResponseInterceptor`:

- On any `401`, call `POST /auth/refresh` once (using the httpOnly cookie)
- On success, retry the original request with the new access token
- On failure (cookie expired), redirect to `/login`

---

# 10. Caching Strategy (Redis)

## 10.1 Key Naming Convention

```
ok:live:{INDEX}:chain          → Raw options chain (compressed JSON)
ok:live:{INDEX}:dashboard      → Computed dashboard metrics
ok:live:{INDEX}:spot           → Spot price only
ok:live:{INDEX}:pcr:history    → PCR history array (1-day)
ok:session:{userId}            → Session metadata
ok:ratelimit:{id}:{ep}:{win}   → Sliding window counter
ok:alert:last:{alertId}        → Last evaluation result (dedup)
ok:ai:cache:{queryHash}        → Common AI response cache (3-min TTL)
ok:upstox:access_token         → Upstox API token (refresh daily)
ok:magiclink:rate:{email}      → Magic link rate limit counter
```

## 10.2 TTL Table

| Key Pattern              | TTL          | Invalidation                     |
| ------------------------ | ------------ | -------------------------------- |
| `ok:live:*:chain`        | 90s          | Overwritten on each Upstox fetch |
| `ok:live:*:dashboard`    | 90s          | Overwritten on each compute run  |
| `ok:live:*:spot`         | 30s          | Overwritten each minute          |
| `ok:session:*`           | 24h          | On logout                        |
| `ok:ratelimit:*`         | Window-based | Slide with time                  |
| `ok:alert:last:*`        | 5 min        | After each evaluation            |
| `ok:ai:cache:*`          | 180s         | Same-query window                |
| `ok:upstox:access_token` | 23h          | Daily refresh                    |

## 10.3 Cache Miss Fallback

If Redis is unavailable or a key has expired between fetch cycles, the backend falls back to:

1. MongoDB — last `oi_snapshots` document for the symbol
2. Recalculate computed metrics from that snapshot
3. Return data with `{ isCached: false, dataAgeSeconds: N }` in meta

---

# 11. AI Integration

## 11.1 AI Module Architecture

```
AiController
  └── POST /ai/chat
       └── AiService.streamChat(userId, query, sessionId)
            ├── QuotaService.checkAndDeduct(userId)      # Redis counter
            ├── ContextBuilderService.build(index)       # Fetch from Redis
            ├── PromptBuilderService.buildChatPrompt(ctx, query, history)
            ├── ConversationRepo.getHistory(sessionId, limit=3)
            └── OpenAI.chat.completions.create({ stream: true })
                 └── Pipe SSE to response
```

## 11.2 Quota Management

Stored in Redis (fast read/write, resets at midnight IST):

```
Key: ok:ai:quota:{userId}:{YYYY-MM-DD}
Value: integer (queries used today)
TTL: Set to expire at midnight IST
```

```typescript
async checkAndDeduct(userId: string, plan: Plan): Promise<{ allowed: boolean; remaining: number }> {
  const limit = AI_DAILY_LIMITS[plan]; // { FREE: 5, STARTER: 30, PRO: 100, ELITE: 300 }
  const key = `ok:ai:quota:${userId}:${today()}`;
  const used = await this.redis.incr(key);
  if (used === 1) {
    await this.redis.expireat(key, midnightIST());
  }
  if (used > limit) {
    await this.redis.decr(key); // rollback
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: limit - used };
}
```

## 11.3 Context Builder

Assembles real-time market data as JSON context for the prompt:

```typescript
async build(index: string): Promise<MarketContext> {
  const dashboard = await this.redis.get(`ok:live:${index}:dashboard`);
  if (!dashboard) {
    // Fallback: fetch last snapshot from MongoDB
  }
  const data = JSON.parse(dashboard);
  return {
    index,
    timestamp: data.lastUpdated,
    spotPrice: data.spotPrice,
    priceChangePct: data.priceChangePct,
    pcr: data.pcr,
    maxPain: data.maxPain,
    totalCallOi: data.totalCallOi,
    totalPutOi: data.totalPutOi,
    sentiment: data.sentiment,
    topCallBuildup: data.topCallBuildup.slice(0, 3),
    topPutBuildup: data.topPutBuildup.slice(0, 3),
    unusualActivity: data.unusualActivity ?? [],
  };
}
```

## 11.4 Prompt Templates

### Chat Prompt

```
SYSTEM:
You are OptionKart AI, an options data analyst for Indian markets (NSE).
Rules:
- Respond ONLY based on the data provided. Never fabricate numbers.
- Keep responses concise (max 150 words). If the user asks for detail, expand.
- Use Hindi-English (Hinglish) if the user writes in Hindi.
- End with a relevant caveat or risk factor.
- NEVER recommend buying or selling any contract.

CURRENT MARKET DATA (as of {timestamp}):
{contextJson}

PREVIOUS CONVERSATION (last 3 messages):
{historyJson}

USER: {userQuery}
```

### Strategy Suggestion Prompt

```
SYSTEM:
You are an options strategy educator. Suggest 2-3 strategies based on data below.
- Explain WHY each fits the data.
- Include approximate profit/loss levels.
- Rate confidence: High / Medium / Low.
- Format as numbered list with clear headers.
- DISCLAIMER: These are educational examples, not trading advice.

{contextJson}
IV Percentile: {ivPercentile}
Days to Expiry: {dte}

Suggest strategies.
```

### Daily Brief Prompt

```
SYSTEM:
Generate a concise end-of-day market report for {index}.

Format exactly as:
## {index} Daily Brief — {date}
**Day's Verdict:** [one line]
**Key Numbers:** [5-6 bullets]
**What Happened:** [2-3 paragraphs]
**Watch Tomorrow:** [2-3 bullets]
**Confidence:** [High/Medium/Low]

DATA:
{fullDaySummaryJson}
```

## 11.5 Common Query Caching

Identical queries within the same 3-minute data window return the same response:

```typescript
const queryHash = createHash('sha256')
  .update(`${index}:${dataWindow}:${query.toLowerCase().trim()}`)
  .digest('hex');
const cacheKey = `ok:ai:cache:${queryHash}`;
const cached = await this.redis.get(cacheKey);
if (cached) return cached; // serve cached, no OpenAI call
```

## 11.6 BYO OpenAI Key (Elite Plan)

```typescript
async getOpenAIClient(userId: string, plan: Plan): Promise<OpenAI> {
  if (plan === 'ELITE') {
    const prefs = await this.prisma.userPreferences.findUnique({ where: { userId } });
    if (prefs?.byoOpenaiKey) {
      const apiKey = this.encryptionService.decrypt(prefs.byoOpenaiKey);
      return new OpenAI({ apiKey });
    }
  }
  return this.platformOpenAI; // shared platform client
}
```

The BYO key is encrypted with AES-256-GCM before storage and **never returned to the client**.

---

# 12. Payment Integration (Razorpay)

## 12.1 Subscription Creation Flow

```typescript
// subscription.service.ts
async createSubscription(userId: string, planId: string, billingCycle: 'monthly' | 'yearly') {
  const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const rzPlanId = RAZORPAY_PLAN_IDS[planId][billingCycle]; // e.g. 'plan_XXXX'

  const rzSubscription = await this.razorpay.subscriptions.create({
    plan_id: rzPlanId,
    customer_notify: 1,
    quantity: 1,
    total_count: billingCycle === 'monthly' ? 12 : 1,
    addons: [],
    notes: { userId, internalPlanName: planId },
  });

  // Persist subscription record immediately (status: CREATED)
  await this.prisma.subscription.create({
    data: {
      userId,
      razorpaySubscriptionId: rzSubscription.id,
      razorpayPlanId: rzPlanId,
      planName: planId.toUpperCase() as Plan,
      status: 'CREATED',
      billingCycle,
      amountPaise: PLAN_PRICES_PAISE[planId][billingCycle],
    },
  });

  return {
    subscriptionId: rzSubscription.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    prefill: { email: user.email, name: user.name ?? '' },
  };
}
```

## 12.2 Webhook Handler

```typescript
// webhook.service.ts
async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
  // 1. Verify HMAC-SHA256 signature
  const isValid = Razorpay.validateWebhookSignature(
    rawBody.toString(),
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET!,
  );
  if (!isValid) throw new UnauthorizedException('Invalid webhook signature');

  const event = JSON.parse(rawBody.toString());

  // 2. Idempotency check
  const exists = await this.prisma.webhookEvent.findUnique({ where: { eventId: event.event_id } });
  if (exists) return; // already processed

  // 3. Persist raw event
  await this.prisma.webhookEvent.create({
    data: { eventId: event.event_id, eventType: event.event, payload: event },
  });

  // 4. Route to handler
  switch (event.event) {
    case 'subscription.charged':    await this.onSubscriptionCharged(event.payload); break;
    case 'subscription.activated':  await this.onSubscriptionActivated(event.payload); break;
    case 'subscription.halted':     await this.onSubscriptionHalted(event.payload); break;
    case 'subscription.cancelled':  await this.onSubscriptionCancelled(event.payload); break;
    case 'payment.failed':          await this.onPaymentFailed(event.payload); break;
    case 'refund.created':          await this.onRefundCreated(event.payload); break;
  }

  // 5. Mark processed
  await this.prisma.webhookEvent.update({
    where: { eventId: event.event_id },
    data: { processedAt: new Date() },
  });
}
```

## 12.3 Razorpay Plan ID Mapping

```typescript
// config/razorpay-plans.ts
export const RAZORPAY_PLAN_IDS = {
  starter: {
    monthly: process.env.RZP_PLAN_STARTER_MONTHLY!,
    yearly: process.env.RZP_PLAN_STARTER_YEARLY!,
  },
  pro: { monthly: process.env.RZP_PLAN_PRO_MONTHLY!, yearly: process.env.RZP_PLAN_PRO_YEARLY! },
  elite: {
    monthly: process.env.RZP_PLAN_ELITE_MONTHLY!,
    yearly: process.env.RZP_PLAN_ELITE_YEARLY!,
  },
} as const;

export const PLAN_PRICES_PAISE = {
  starter: { monthly: 19900, yearly: 190800 }, // ₹199 / ₹1908
  pro: { monthly: 49900, yearly: 478800 }, // ₹499 / ₹4788
  elite: { monthly: 99900, yearly: 958800 }, // ₹999 / ₹9588
};
```

---

# 13. Alert System

## 13.1 Alert Evaluation Engine

Alert evaluation runs every 3 minutes via cron, enqueuing individual BullMQ jobs per alert to allow parallel processing:

```typescript
// alert-evaluator.service.ts
async evaluateAllAlerts(index: string, currentData: DashboardData): Promise<void> {
  const activeAlerts = await this.prisma.alert.findMany({
    where: { symbol: index, isActive: true },
  });

  // Enqueue individual jobs (parallel processing)
  await Promise.all(
    activeAlerts.map((alert) =>
      this.alertQueue.add('evaluate', { alert, currentData }, { jobId: `alert-${alert.id}` }),
    ),
  );
}
```

```typescript
// alert-evaluator.worker.ts
@Processor('alert-eval')
export class AlertEvaluatorWorker {
  @Process('evaluate')
  async evaluate(job: Job<{ alert: Alert; currentData: DashboardData }>) {
    const { alert, currentData } = job.data;

    const triggered = this.checkCondition(alert, currentData);
    if (!triggered) return;

    // Dedup: did this alert fire in the last 5 min?
    const dedupKey = `ok:alert:last:${alert.id}`;
    const alreadyFired = await this.redis.get(dedupKey);
    if (alreadyFired) return;

    await this.redis.set(dedupKey, '1', 'EX', 300); // 5-min dedup window

    // Persist trigger + enqueue notifications
    await this.prisma.alertHistory.create({
      data: { alertId: alert.id, userId: alert.userId, triggerData: currentData },
    });
    await this.notificationQueue.add('send', { alert, triggerData: currentData });
  }

  private checkCondition(alert: Alert, data: DashboardData): boolean {
    switch (alert.alertType) {
      case 'PCR_CROSS':
        return alert.conditionOperator === 'cross_above'
          ? data.pcr >= alert.conditionValue && data.prevPcr < alert.conditionValue
          : data.pcr <= alert.conditionValue && data.prevPcr > alert.conditionValue;
      case 'OI_SPIKE':
        // Check relevant strike OI change %
        ...
    }
  }
}
```

## 13.2 Notification Delivery

| Channel      | Implementation                                   | Library    |
| ------------ | ------------------------------------------------ | ---------- |
| In-app       | Store in DB; frontend polls `GET /notifications` | Prisma     |
| Browser push | Web Push API via VAPID keys                      | `web-push` |
| Email        | Transactional email via Resend                   | `resend`   |
| Telegram     | Telegram Bot API                                 | `grammy`   |

---

# 14. Security Implementation

## 14.1 Security Headers (helmet config)

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'nonce-{GENERATED_NONCE}'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.optionkart.com'],
        frameSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
);
```

## 14.2 Input Validation

All DTO classes use `class-validator`. Examples:

```typescript
export class CreateAlertDto {
  @IsEnum(['OI_SPIKE', 'PCR_CROSS', 'MAX_PAIN_SHIFT', 'WATCHLIST'])
  alertType: AlertType;

  @IsIn(['NIFTY', 'BANKNIFTY'])
  symbol: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  strikePrice?: number;

  @IsIn(['gt', 'lt', 'cross_above', 'cross_below'])
  conditionOperator: string;

  @IsNumber()
  conditionValue: number;

  @IsArray()
  @IsIn(['in_app', 'push', 'email', 'telegram'], { each: true })
  deliveryChannels: string[];
}
```

## 14.3 SQL Injection Prevention

All database access goes through Prisma — no raw SQL except for migrations. Where raw queries are unavoidable, use tagged template literals:

```typescript
// Never do this:
// prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`)

// Always do this:
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

## 14.4 API Key Encryption

BYO OpenAI keys use AES-256-GCM:

```typescript
// encryption.service.ts
@Injectable()
export class EncryptionService {
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(dataHex, 'hex')) + decipher.final('utf8');
  }
}
```

---

# 15. Environment Variables

## 15.1 Backend (`apps/api/.env`)

```dotenv
# Application
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://optionkart.com,https://www.optionkart.com

# PostgreSQL (Prisma)
DATABASE_URL=postgresql://user:password@host:5432/optionkart?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/optionkart

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/optionkart

# Redis (Upstash)
REDIS_URL=rediss://default:password@host:6380

# JWT
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Upstox
UPSTOX_CLIENT_ID=
UPSTOX_CLIENT_SECRET=
UPSTOX_REDIRECT_URI=https://api.optionkart.com/v1/auth/upstox/callback
UPSTOX_REFRESH_TOKEN=         # Long-lived token stored securely

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.optionkart.com/v1/auth/google/callback

# Razorpay
RAZORPAY_KEY_ID=rzp_live_XXXX
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RZP_PLAN_STARTER_MONTHLY=plan_XXXX
RZP_PLAN_STARTER_YEARLY=plan_XXXX
RZP_PLAN_PRO_MONTHLY=plan_XXXX
RZP_PLAN_PRO_YEARLY=plan_XXXX
RZP_PLAN_ELITE_MONTHLY=plan_XXXX
RZP_PLAN_ELITE_YEARLY=plan_XXXX

# Email (Resend)
RESEND_API_KEY=re_XXXX
EMAIL_FROM=noreply@optionkart.com

# OpenAI
OPENAI_API_KEY=sk-XXXX
OPENAI_MODEL=gpt-4o-mini

# Encryption
ENCRYPTION_KEY=64_char_hex_string    # 32 bytes for AES-256

# Telegram Bot
TELEGRAM_BOT_TOKEN=

# Sentry
SENTRY_DSN=
```

## 15.2 Frontend (`apps/web/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=https://api.optionkart.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXX
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN=

# Used server-side in Next.js route handlers only
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://optionkart.com
```

---

# 16. Deployment & Infrastructure

## 16.1 Architecture Overview

```
Internet
   │
   ├─ optionkart.com ────────────► Vercel (Next.js)
   │                                    │
   └─ api.optionkart.com ─────────► Railway (NestJS)
                                        │
                         ┌──────────────┼──────────────┐
                         ▼              ▼               ▼
                    Neon            MongoDB Atlas    Upstash Redis
                  (PostgreSQL)     (Document store)  (Cache+Queue)
```

## 16.2 Railway Configuration (`apps/api/`)

**Dockerfile:**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**Railway start command:** `node dist/main.js`  
**Health check endpoint:** `GET /v1/health` → `{ "status": "ok", "timestamp": "..." }`

## 16.3 Vercel Configuration (`apps/web/`)

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@optionkart_api_url"
  }
}
```

**ISR revalidation:** Dashboard pages use `revalidate = 60` (1-minute ISR) for SSR/edge caching.

## 16.4 Database Migrations

Migrations run as a Railway deploy hook (before server starts):

```json
// package.json (api)
{
  "scripts": {
    "migrate:deploy": "prisma migrate deploy",
    "start": "node dist/main.js"
  }
}
```

Railway start command: `pnpm migrate:deploy && pnpm start`

---

# 17. Local Development Setup

## 17.1 Prerequisites

- Node.js 22 LTS
- pnpm 9+
- Docker (for local Postgres + Redis)

## 17.2 Setup Steps

```bash
# 1. Clone and install
git clone https://github.com/yourorg/optionkart
cd optionkart
pnpm install

# 2. Start local services
docker-compose up -d   # starts postgres:16 + redis:7 + mongodb:7

# 3. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Fill in your Upstox dev credentials and Razorpay test keys

# 4. Run database migrations + seed
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed

# 5. Start development servers
cd ../..
pnpm dev    # runs both Next.js (port 3000) and NestJS (port 3001) via Turborepo
```

## 17.3 `docker-compose.yml`

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: optionkart
      POSTGRES_USER: optionkart
      POSTGRES_PASSWORD: devpassword
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --save 60 1

  mongodb:
    image: mongo:7
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db

volumes:
  postgres_data:
  mongo_data:
```

---

# 18. Testing Strategy

## 18.1 Test Pyramid

| Layer                    | Type               | Tool                | Coverage Target                   |
| ------------------------ | ------------------ | ------------------- | --------------------------------- |
| Utilities (calculations) | Unit               | Jest                | 100%                              |
| Service layer            | Unit (mocked deps) | Jest                | 80%+                              |
| API endpoints            | Integration        | Supertest + test DB | All happy paths + key error cases |
| Critical flows           | E2E                | Playwright          | Auth, checkout, dashboard load    |

## 18.2 Key Test Cases

**Market Calculations (unit):**

- `calculatePCR` with empty chain, all-put chain, all-call chain
- `calculateMaxPain` at different expiry strikes
- `calculateSentiment` boundary conditions (PCR = 1.0, PCR = 0.7, PCR = 1.3)

**Auth (integration):**

- Magic link: happy path, expired token, already-used token, rate limit enforcement
- JWT refresh: valid cookie, expired cookie, tampered cookie

**Payments (integration, mocked Razorpay):**

- Webhook idempotency (duplicate event_id)
- Invalid webhook signature → 400
- `subscription.charged` → user plan upgraded
- `subscription.halted` → user plan downgraded

**Feature gating (integration):**

- Free user accessing Pro endpoint → 403 with `SUBSCRIPTION_REQUIRED`
- Pro user accessing Elite-only endpoint → 403
- Elite user → 200

## 18.3 Test Data

Use a seeded test PostgreSQL database. Factory functions for common entities:

```typescript
// test/factories/user.factory.ts
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: randomUUID(),
  email: `test-${randomUUID()}@example.com`,
  plan: 'FREE',
  authProvider: 'MAGIC_LINK',
  ...overrides,
});
```

---

_This document should be updated as implementation decisions evolve. Any deviation from these specs must be documented in the Decision Log (PRD Section 18.3)._
