# Phase 0 — Infrastructure & Config: File-Level Implementation Guide

**Prepared by:** Senior Lead Engineer  
**For:** Junior Developer  
**Phase:** P0.3 (Backend Bootstrap) · P0.4 (Frontend Bootstrap) · P0.5 (CI/CD)  
**Status of P0.1 + P0.2:** ✅ Already completed

---

## How to Use This Document

- Files are listed in strict creation order. Do not skip ahead — later files import earlier ones.
- "Inputs" = what the function/method receives. "Outputs" = what it returns.
- Run `pnpm install` from the repo root after each `package.json` change.
- All paths are relative to the monorepo root (`d:\jobs\idea n research\ok\`).

---

## Pre-Work: Install Backend Dependencies

Before writing any code for P0.3, add the required packages to `apps/api/package.json`.

**Add to `dependencies`:**

```
@nestjs/config        ^4.x    — ConfigModule (env loading)
@nestjs/mongoose      ^11.x   — MongooseModule
@nestjs/schedule      ^5.x    — Cron jobs (needed in P2, wired in P0)
@prisma/client        ^7.x    — Generated Prisma client
mongoose              ^8.x    — MongoDB ODM
ioredis               ^5.x    — Redis client
zod                   ^3.x    — Env schema validation
helmet                ^8.x    — HTTP security headers
compression           ^1.x    — Gzip responses
```

**Add to `devDependencies`:**

```
prisma                ^7.x    — CLI for migrations
@types/compression    ^1.x    — TypeScript types
@types/ioredis        ^5.x    — TypeScript types (may be bundled in ioredis v5)
```

**Run:**

```bash
pnpm install          # from repo root — installs across all workspaces
```

---

## Pre-Work: Install Frontend Dependencies

**Add to `apps/web` `dependencies`:**

```
axios                 ^1.x    — HTTP client (transport layer + auth interceptors)
@tanstack/react-query ^5.x    — Data fetching, caching, mutations, query invalidation
```

**Run:**

```bash
pnpm install
```

---

# P0.3 — Backend Bootstrap

---

## File 1 of 22

**File Path:** `apps/api/src/config/env.schema.ts`

**Primary Purpose:** Defines and exports the Zod schema that validates all environment variables when the NestJS app boots. If any required variable is missing or malformed, the app crashes with a clear error before accepting any requests.

**Dependencies & Imports:**

- `zod` — `z` object for schema construction

**Step-by-Step Logic:**

1. Import `z` from `zod`.
2. Create a const `envSchema` using `z.object({...})` with every env variable the backend needs. Use the following Zod types and rules:
   - `NODE_ENV`: `z.enum(['development', 'production', 'test']).default('development')`
   - `PORT`: `z.coerce.number().int().min(1).max(65535).default(3001)` — `coerce` because env vars are always strings
   - `DATABASE_URL`: `z.string().min(1)` — must be non-empty
   - `DATABASE_DIRECT_URL`: `z.string().min(1)`
   - `MONGODB_URI`: `z.string().min(1)`
   - `REDIS_URL`: `z.string().min(1)`
   - `FRONTEND_URL`: `z.string().url().default('http://localhost:3000')`
   - `JWT_PRIVATE_KEY`: `z.string().min(1)` — RS256 private key (Base64 encoded, added in P1)
   - `JWT_PUBLIC_KEY`: `z.string().min(1)` — RS256 public key (Base64 encoded, added in P1)
   - For P0 only, mark JWT keys as optional: `z.string().optional()` — they are needed in P1 but not P0
   - `GOOGLE_CLIENT_ID`: `z.string().optional()`
   - `GOOGLE_CLIENT_SECRET`: `z.string().optional()`
   - `RESEND_API_KEY`: `z.string().optional()`
   - `OPENAI_API_KEY`: `z.string().optional()`
   - `RAZORPAY_KEY_ID`: `z.string().optional()`
   - `RAZORPAY_KEY_SECRET`: `z.string().optional()`
   - `UPSTOX_CLIENT_ID`: `z.string().optional()`
   - `UPSTOX_CLIENT_SECRET`: `z.string().optional()`
   - `ENCRYPTION_KEY`: `z.string().optional()` — 64-char hex string (AES-256)
3. Export `envSchema` as a named export.
4. Export `type Env = z.infer<typeof envSchema>` — this is the TypeScript type the rest of the app uses when calling `configService.get()`.
5. Export a `validate` function: it takes `config: Record<string, unknown>`, calls `envSchema.safeParse(config)`. If `!result.success`, throw a `new Error` containing `result.error.toString()`. If successful, return `result.data`.

**Inputs & Outputs:**

- `validate(config)`: receives the raw process.env object. Returns the parsed, typed env config or throws.
- `Env` type: can be used elsewhere as `configService.get<Env['DATABASE_URL']>('DATABASE_URL')`.

**Error Handling & Edge Cases:**

- If `DATABASE_URL` is missing, the error message from Zod will clearly say which field failed. This crashes the process intentionally — a server without a DB connection string must never start.
- If `PORT` is provided as a string `"3001"`, `z.coerce.number()` handles the conversion automatically.

---

## File 2 of 22

**File Path:** `apps/api/src/common/filters/http-exception.filter.ts`

**Primary Purpose:** Global NestJS exception filter that catches every `HttpException` and formats it into a consistent JSON error envelope so all API error responses have the same shape.

**Dependencies & Imports:**

- `@nestjs/common` — `ExceptionFilter`, `Catch`, `ArgumentsHost`, `HttpException`, `HttpStatus`
- Node `http` module is not needed; use NestJS abstractions only.

**Step-by-Step Logic:**

1. Create a class `HttpExceptionFilter` that implements `ExceptionFilter`.
2. Decorate it with `@Catch(HttpException)` — this tells NestJS to route only `HttpException` instances here.
3. Implement the `catch(exception: HttpException, host: ArgumentsHost)` method:
   a. Switch to HTTP context: `const ctx = host.switchToHttp()`.
   b. Get the response object: `const response = ctx.getResponse()`.
   c. Get the request object: `const request = ctx.getRequest()`.
   d. Get the HTTP status code: `const status = exception.getStatus()`.
   e. Get the exception response body: `const exceptionResponse = exception.getResponse()`.
   f. Extract the message: if `exceptionResponse` is an object with a `message` field (NestJS ValidationPipe produces this), use it. Otherwise, use the exception's `message` string.
   g. Build the error envelope object:
   ```
   {
     success: false,
     error: {
       code: status,
       message: (the extracted message from step f),
       path: request.url,
       timestamp: new Date().toISOString()
     }
   }
   ```
   h. Call `response.status(status).json(envelope)`.

**Inputs & Outputs:**

- Input: Any thrown `HttpException` plus the `ArgumentsHost` context.
- Output: JSON response body `{ success: false, error: { code, message, path, timestamp } }`.

**Error Handling & Edge Cases:**

- NestJS `ValidationPipe` throws `BadRequestException` where `getResponse()` returns `{ message: string[], error: 'Bad Request', statusCode: 400 }`. Make sure to handle array messages — join them with '; ' or return the array as-is.
- If for some reason `status` is undefined, fall back to `HttpStatus.INTERNAL_SERVER_ERROR` (500).

---

## File 3 of 22

**File Path:** `apps/api/src/common/interceptors/response.interceptor.ts`

**Primary Purpose:** Global NestJS interceptor that wraps every successful controller response in a consistent success envelope so all API success responses have the same shape.

**Dependencies & Imports:**

- `@nestjs/common` — `Injectable`, `NestInterceptor`, `ExecutionContext`, `CallHandler`
- `rxjs` — `Observable`, `map` operator
- `@optionkart/types` — `ApiResponse` interface (from `packages/types`)

**Step-by-Step Logic:**

1. Create a generic class `ResponseInterceptor<T>` that implements `NestInterceptor<T, ApiResponse<T>>`.
2. Decorate with `@Injectable()`.
3. Implement the `intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>>` method:
   a. Call `next.handle()` to get the response stream.
   b. Pipe it through the RxJS `map` operator.
   c. Inside `map`, take the raw response data and transform it into:
   ```
   {
     success: true,
     data: (the raw response),
     timestamp: new Date().toISOString()
   }
   ```
   d. Return the mapped observable.

**Inputs & Outputs:**

- Input: The raw return value from any controller method (any type `T`).
- Output: `{ success: true, data: T, timestamp: string }`.

**Error Handling & Edge Cases:**

- This interceptor must NOT catch errors — that is the filter's job. Only the `pipe(map(...))` pattern touches successful responses.
- If a controller returns `null` or `undefined` (e.g., a 204 No Content response), `data` will be `null`. This is acceptable.

---

## File 4 of 22

**File Path:** `apps/api/src/common/decorators/public.decorator.ts`

**Primary Purpose:** A metadata-setting decorator `@Public()` that marks a route as publicly accessible, allowing the global JWT auth guard (added in P1) to skip authentication for that route.

**Dependencies & Imports:**

- `@nestjs/common` — `SetMetadata`

**Step-by-Step Logic:**

1. Define a constant `IS_PUBLIC_KEY = 'isPublic'` and export it.
2. Create and export a const `Public = () => SetMetadata(IS_PUBLIC_KEY, true)`.
   - This is an arrow function that returns the result of `SetMetadata` — it creates a decorator factory.
3. That is the entire file. No class, no logic.

**Inputs & Outputs:**

- Used as `@Public()` on a controller class or method.
- In P1, the `JwtAuthGuard` will call `reflector.getAllAndOverride(IS_PUBLIC_KEY, [...])` to check if a route is public before requiring a token.

**Error Handling & Edge Cases:**

- None. This is purely declarative metadata.

---

## File 5 of 22

**File Path:** `apps/api/prisma/schema.prisma`

**Primary Purpose:** The Prisma schema file that defines the database connection and client generator. For P0.3 it contains only the datasource and generator blocks — the full model definitions come in P1.1.

**Dependencies & Imports:**

- Not a TypeScript file. Uses Prisma Schema Language (PSL).

**Step-by-Step Logic:**

1. Write the `generator client` block:
   ```
   generator client {
     provider = "prisma-client-js"
   }
   ```
2. Write the `datasource db` block:
   ```
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DATABASE_DIRECT_URL")
   }
   ```

   - `url` → used by the Prisma connection pooler (Neon's pooled URL in production)
   - `directUrl` → used by Prisma Migrate (direct non-pooled URL, required by Neon)
3. Do NOT add any models yet. They will be added in P1.1 all at once.

**Inputs & Outputs:**

- No runtime inputs/outputs. `prisma migrate dev` reads this file and creates/updates tables.
- After writing this file, run: `cd apps/api && pnpm exec prisma generate` to generate the Prisma client types into `node_modules/.prisma/client/`.

**Error Handling & Edge Cases:**

- If `DATABASE_URL` is not set, `prisma generate` will still succeed (it reads env at runtime, not generate-time). But `prisma migrate dev` will fail — ensure docker-compose is running first.

---

## File 6 of 22

**File Path:** `apps/api/src/prisma/prisma.service.ts`

**Primary Purpose:** A singleton NestJS service that wraps the Prisma Client, manages the database connection lifecycle (connect on startup, disconnect on shutdown), and is injected wherever database access is needed.

**Dependencies & Imports:**

- `@nestjs/common` — `Injectable`, `OnModuleInit`, `OnModuleDestroy`, `Logger`
- `@prisma/client` — `PrismaClient`

**Step-by-Step Logic:**

1. Create class `PrismaService` that `extends PrismaClient` and `implements OnModuleInit, OnModuleDestroy`.
2. Add a private `readonly logger = new Logger(PrismaService.name)`.
3. In the constructor, call `super()` with Prisma client options:
   - Set `log` to `['warn', 'error']` in production and `['query', 'info', 'warn', 'error']` in development. Read `process.env.NODE_ENV` to decide.
4. Implement `async onModuleInit()`:
   - Call `await this.$connect()`.
   - Log `'PostgreSQL connected'` at the info level.
5. Implement `async onModuleDestroy()`:
   - Call `await this.$disconnect()`.
   - Log `'PostgreSQL disconnected'`.

**Inputs & Outputs:**

- No direct inputs. Once injected, provides access to all Prisma model methods via `this.user`, `this.subscription`, etc. (models added in P1.1).
- For P0.3 health check, expose a `ping()` method: run `this.$queryRaw\`SELECT 1\``and return`true`on success,`false` on error (catch the error and return false).

**Error Handling & Edge Cases:**

- If the database is unreachable on startup, `$connect()` will throw — let this propagate so the app fails fast on startup rather than running in a broken state.
- Wrap the `ping()` method in a try/catch — it is used by the health endpoint and must never throw.

---

## File 7 of 22

**File Path:** `apps/api/src/prisma/prisma.module.ts`

**Primary Purpose:** NestJS module that registers `PrismaService` as a global provider so any other module can inject it without needing to import `PrismaModule` explicitly.

**Dependencies & Imports:**

- `@nestjs/common` — `Global`, `Module`
- `./prisma.service` — `PrismaService`

**Step-by-Step Logic:**

1. Create `PrismaModule` class decorated with both `@Global()` and `@Module({...})`.
2. In the `@Module` decorator:
   - `providers: [PrismaService]`
   - `exports: [PrismaService]`
   - No `imports` needed.
3. That is the entire file.

**Inputs & Outputs:**

- No runtime inputs/outputs. After importing `PrismaModule` in `AppModule`, every other module can inject `PrismaService` directly.

**Error Handling & Edge Cases:**

- None. The `@Global()` decorator means other modules do not need to import this module — they just inject the service. Ensure `PrismaModule` is imported in `AppModule` exactly once.

---

## File 8 of 22

**File Path:** `apps/api/src/redis/redis.service.ts`

**Primary Purpose:** A singleton NestJS service that creates and manages an ioredis `Redis` connection. Exposes the raw Redis client for use by any service that needs to read/write cache, publish/subscribe, or manage BullMQ queues.

**Dependencies & Imports:**

- `@nestjs/common` — `Injectable`, `OnModuleInit`, `OnModuleDestroy`, `Logger`
- `@nestjs/config` — `ConfigService`
- `ioredis` — `Redis` (default import)

**Step-by-Step Logic:**

1. Create class `RedisService` with `@Injectable()`.
2. Declare a private `client: Redis` property (not initialized in declaration).
3. Declare a private `readonly logger = new Logger(RedisService.name)`.
4. Inject `ConfigService` via constructor.
5. Implement `onModuleInit()`:
   a. Read `REDIS_URL` from `configService.getOrThrow<string>('REDIS_URL')`.
   b. Instantiate: `this.client = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: false })`.
   - `maxRetriesPerRequest: null` is required for BullMQ compatibility.
     c. Register an error handler on the client: `this.client.on('error', (err) => this.logger.error('Redis error', err))`.
     d. Register a connect handler: `this.client.on('connect', () => this.logger.log('Redis connected'))`.
     e. Await `this.client.ping()` to confirm connection. If it throws, let it propagate (fail fast).
6. Implement `async onModuleDestroy()`:
   a. Call `await this.client.quit()`.
   b. Log `'Redis disconnected'`.
7. Expose a `getClient(): Redis` method that returns `this.client`.
8. Expose a `ping(): Promise<boolean>` method: try `await this.client.ping()`, return `true` on `'PONG'`, return `false` on error (catch).

**Inputs & Outputs:**

- `getClient()` → returns the raw `Redis` instance for use in other services.
- `ping()` → `Promise<boolean>` — used by health check.

**Error Handling & Edge Cases:**

- The `error` event handler on the ioredis client prevents unhandled error crashes — always register it.
- If `REDIS_URL` contains a password (e.g., `redis://:password@host:6379`), ioredis parses it from the URL automatically. No extra config needed.
- Do NOT expose `getClient()` to HTTP controllers. Only inject `RedisService` into other services.

---

## File 9 of 22

**File Path:** `apps/api/src/redis/redis.module.ts`

**Primary Purpose:** NestJS module that registers `RedisService` as a global provider so any other module can inject it without importing `RedisModule` explicitly.

**Dependencies & Imports:**

- `@nestjs/common` — `Global`, `Module`
- `./redis.service` — `RedisService`

**Step-by-Step Logic:**

1. Create `RedisModule` decorated with `@Global()` and `@Module({...})`.
2. `providers: [RedisService]`, `exports: [RedisService]`.
3. No imports needed.

**Inputs & Outputs:** None.

**Error Handling & Edge Cases:**

- Same as `PrismaModule` — import in `AppModule` exactly once.

---

## File 10 of 22

**File Path:** `apps/api/src/health/health.controller.ts`

**Primary Purpose:** Exposes a single `GET /health` endpoint that checks the status of all three database connections (Postgres, MongoDB, Redis) and returns a structured health report. Used by Railway for health checks and by UptimeRobot for monitoring.

**Dependencies & Imports:**

- `@nestjs/common` — `Controller`, `Get`, `HttpCode`, `HttpStatus`
- `../prisma/prisma.service` — `PrismaService`
- `../redis/redis.service` — `RedisService`
- `@nestjs/mongoose` — `InjectConnection`
- `mongoose` — `Connection`
- `../common/decorators/public.decorator` — `Public`

**Step-by-Step Logic:**

1. Create `HealthController` decorated with `@Controller('health')`.
2. Inject `PrismaService`, `RedisService`, and the Mongoose `Connection` (via `@InjectConnection()`).
3. Create method `getHealth()` decorated with `@Get()`, `@Public()`, and `@HttpCode(HttpStatus.OK)`.
4. Inside `getHealth()`:
   a. Run three connection checks **in parallel** using `Promise.allSettled([...])`:
   - `prismaService.ping()` → boolean
   - `redisService.ping()` → boolean
   - Check mongoose: `mongooseConnection.readyState === 1` → boolean (readyState 1 = connected, no async needed)
     b. Build a services object:
   ```
   {
     postgres: (prisma ping result ? 'up' : 'down'),
     redis: (redis ping result ? 'up' : 'down'),
     mongodb: (mongoose readyState result ? 'up' : 'down')
   }
   ```
   c. Determine overall status: if ALL three are `'up'`, set `status = 'ok'`. Otherwise set `status = 'degraded'`.
   d. Return:
   ```
   {
     status,
     services,
     timestamp: new Date().toISOString(),
     uptime: process.uptime()  // seconds since Node process started
   }
   ```
5. Note: Do NOT apply `@UseGuards(JwtAuthGuard)` here — the `@Public()` decorator on this method signals to the global guard (added in P1) to skip auth.

**Inputs & Outputs:**

- Input: None (no request body or params needed).
- Output:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "services": { "postgres": "up", "redis": "up", "mongodb": "up" },
      "timestamp": "2026-05-26T10:00:00.000Z",
      "uptime": 42.3
    },
    "timestamp": "2026-05-26T10:00:00.000Z"
  }
  ```
  Note: The outer `success`/`timestamp` wrapper is added automatically by `ResponseInterceptor`.

**Error Handling & Edge Cases:**

- The controller must never throw. Wrapping each ping in `Promise.allSettled` ensures one failing check does not crash the health endpoint.
- If `status` is `'degraded'`, still return HTTP 200 (not 503) — Railway health checks only care about a non-error response. (If you want Railway to restart on degraded, return 503, but 200 is safer for P0.)

---

## File 11 of 22

**File Path:** `apps/api/src/health/health.module.ts`

**Primary Purpose:** NestJS module that registers `HealthController`. Since `PrismaModule` and `RedisModule` are global, they do not need to be imported here.

**Dependencies & Imports:**

- `@nestjs/common` — `Module`
- `./health.controller` — `HealthController`

**Step-by-Step Logic:**

1. Create `HealthModule` decorated with `@Module({ controllers: [HealthController] })`.
2. No providers, no imports.

**Inputs & Outputs:** None.

**Error Handling & Edge Cases:**

- None. Ensure Mongoose `Connection` is injectable by having `MongooseModule.forRootAsync(...)` registered in `AppModule` before this module loads.

---

## File 12 of 22

**File Path:** `apps/api/src/app.module.ts`

**Primary Purpose:** The root NestJS module. Wires together all infrastructure modules: config loading, database connections, and the health endpoint.

**Dependencies & Imports:**

- `@nestjs/common` — `Module`
- `@nestjs/config` — `ConfigModule`
- `@nestjs/mongoose` — `MongooseModule`
- `../config/env.schema` — `validate` function
- `../prisma/prisma.module` — `PrismaModule`
- `../redis/redis.module` — `RedisModule`
- `../health/health.module` — `HealthModule`

**Step-by-Step Logic:**

1. Create `AppModule` decorated with `@Module({...})`.
2. In the `imports` array, add in this order:
   a. `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', validate })`:
   - `isGlobal: true` — makes `ConfigService` injectable everywhere without re-importing
   - `validate` — points to the Zod validate function from `env.schema.ts`
     b. `PrismaModule` — registers the global Postgres client
     c. `RedisModule` — registers the global Redis client
     d. `MongooseModule.forRootAsync({ useFactory: (config: ConfigService) => ({ uri: config.getOrThrow('MONGODB_URI') }), inject: [ConfigService] })`:
   - Use `forRootAsync` so the URI is read from `ConfigService` (which has already validated it via Zod)
     e. `HealthModule`
3. Remove `AppController` and `AppService` from `controllers` and `providers` — delete those files or leave them; they are unused going forward.

**Inputs & Outputs:**

- No runtime inputs/outputs. NestJS reads this module tree at startup.

**Error Handling & Edge Cases:**

- `ConfigModule` must be the FIRST import in the array — everything else uses `ConfigService`.
- If `MongooseModule.forRootAsync` is called before `ConfigModule`, `ConfigService` injection will fail. Order matters.
- When deleting `AppController`/`AppService`, also delete their files to avoid dead code. The scaffolded `app.controller.spec.ts` can also be deleted or left as a passing no-op.

---

## File 13 of 22

**File Path:** `apps/api/src/main.ts`

**Primary Purpose:** The NestJS application entry point. Creates the app, attaches all global middleware/pipes/filters/interceptors, sets the global route prefix, and starts listening.

**Dependencies & Imports:**

- `@nestjs/core` — `NestFactory`
- `@nestjs/common` — `ValidationPipe`, `Logger`
- `./app.module` — `AppModule`
- `./common/filters/http-exception.filter` — `HttpExceptionFilter`
- `./common/interceptors/response.interceptor` — `ResponseInterceptor`
- `helmet` — default import
- `compression` — default import

**Step-by-Step Logic:**

1. Create a `bootstrap` async function.
2. Create the NestJS app: `const app = await NestFactory.create(AppModule)`.
3. Create a logger: `const logger = new Logger('Bootstrap')`.
4. **Security headers:** `app.use(helmet())`.
5. **Compression:** `app.use(compression())`.
6. **CORS:** `app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true })`.
   - `credentials: true` is required for cookies (used by refresh token in P1).
7. **Global prefix:** `app.setGlobalPrefix('v1')` — all routes become `/v1/...` (e.g., `/v1/health`).
8. **Global pipes:**
   ```
   app.useGlobalPipes(new ValidationPipe({
     whitelist: true,              // strip unknown properties from DTOs
     forbidNonWhitelisted: true,   // throw 400 if unknown properties sent
     transform: true,              // auto-transform payloads to DTO instances
     transformOptions: { enableImplicitConversion: true }  // e.g., string → number
   }))
   ```
9. **Global filters:** `app.useGlobalFilters(new HttpExceptionFilter())`.
10. **Global interceptors:** `app.useGlobalInterceptors(new ResponseInterceptor())`.
11. **Shutdown hooks:** `app.enableShutdownHooks()` — needed by `PrismaService.onModuleDestroy`.
12. Read port from `process.env.PORT` or default to `3001`.
13. `await app.listen(port)`.
14. Log: `logger.log(\`API running on http://localhost:${port}/v1\`)`.
15. Call `bootstrap()`.

**Inputs & Outputs:**

- No inputs. On success: Node process is running and listening on the specified port.

**Error Handling & Edge Cases:**

- If any module fails to initialize (e.g., Postgres unreachable), `NestFactory.create()` will throw and the process exits — this is the intended behavior.
- Do NOT wrap `bootstrap()` in a try/catch — let startup errors surface as unhandled rejections so the process exits with code 1 and Railway/Docker restart policies trigger.

---

# P0.4 — Frontend Bootstrap

---

## File 14 of 22

**File Path:** `apps/web/app/globals.css`

**Primary Purpose:** Global CSS that establishes the OptionKart dark-first color palette using CSS custom properties (variables), imports Tailwind v4, and sets base typography and background for the entire app.

**Dependencies & Imports:**

- `@import "tailwindcss"` — Tailwind v4 (already present in scaffold)

**Step-by-Step Logic:**

1. Keep the existing `@import "tailwindcss"` line at the top.
2. Replace the `:root` block with OptionKart's dark color palette:

   ```css
   :root {
     /* Base */
     --background: #0d0f14; /* near-black, darker than pure black */
     --surface: #161b26; /* card / panel background */
     --surface-hover: #1e2535; /* card hover state */
     --border: #2a3347; /* subtle border color */

     /* Text */
     --foreground: #e8ecf4; /* primary text */
     --muted: #6b7a99; /* secondary/muted text */

     /* Brand */
     --brand: #3b82f6; /* OptionKart blue (Tailwind blue-500) */
     --brand-hover: #2563eb;

     /* Signal colors */
     --bullish: #22c55e; /* green-500 */
     --bearish: #ef4444; /* red-500 */
     --neutral: #eab308; /* yellow-500 */
   }
   ```

3. Remove the `@media (prefers-color-scheme: dark)` block — OptionKart is dark-first, no light mode in P0.
4. Update the `body` rule to use the new variables:
   ```css
   body {
     background-color: var(--background);
     color: var(--foreground);
     font-family: var(--font-sans), system-ui, sans-serif;
   }
   ```
5. Add a utility class for glass-morphism cards (used throughout the dashboard):
   ```css
   .card {
     background-color: var(--surface);
     border: 1px solid var(--border);
     border-radius: 0.75rem;
   }
   ```

**Inputs & Outputs:**

- No inputs/outputs. Applied globally via the root `layout.tsx` import.

**Error Handling & Edge Cases:**

- Tailwind v4 uses `@import "tailwindcss"` not `@tailwind base; @tailwind components; @tailwind utilities;`. Do not change the import syntax.

---

## File 15 of 22

**File Path:** `apps/web/app/layout.tsx`

**Primary Purpose:** The Next.js root layout. Sets the HTML shell, metadata (title/description for OptionKart), loads fonts, and wraps all pages in the shared layout structure.

**Dependencies & Imports:**

- `next` — `Metadata` type
- `next/font/google` — `Inter` (replace Geist with Inter for readability at small sizes)
- `./globals.css`

**Step-by-Step Logic:**

1. Remove `Geist` and `Geist_Mono` font imports. Import `Inter` from `next/font/google` with `subsets: ['latin']` and `variable: '--font-sans'`.
2. Update the `metadata` export:
   ```
   title: { default: 'OptionKart — NSE Options Analytics', template: '%s | OptionKart' }
   description: 'Real-time Nifty & BankNifty options chain analysis, PCR, Max Pain, and AI-powered insights for Indian retail traders.'
   ```
3. In the `RootLayout` component:
   - Add `suppressHydrationWarning` on the `<html>` element — this prevents React hydration warnings when the dark-mode class is added client-side in future.
   - Apply the font variable class to `<html>`: `className={inter.variable}`.
   - Set `<html lang="en">`.
   - The `<body>` should have class `min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`.

**Inputs & Outputs:**

- Input: `{ children: React.ReactNode }`.
- Output: Full HTML document shell wrapping all pages.

**Error Handling & Edge Cases:**

- `suppressHydrationWarning` on `<html>` is safe and standard. Do not add it to `<body>` or other elements without reason.

---

## File 16 of 22

**File Path:** `apps/web/lib/api-client.ts`

**Primary Purpose:** The single Axios instance used by all frontend API calls. Handles base URL configuration, attaches the JWT access token to every request, intercepts 401 responses to perform a silent token refresh, and retries the original request. TanStack Query hooks call the exported typed wrappers (`apiGet`, `apiPost`, etc.) as their `queryFn`/`mutationFn` — this file is the HTTP transport layer only, not the caching layer.

**Note on folder location:** Create a `lib/` directory directly inside `apps/web/` (sibling to `app/`). The path is `apps/web/lib/api-client.ts`. This aligns with the "no `src/`" structure currently on disk.

**Dependencies & Imports:**

- `axios` — default import plus `AxiosRequestConfig`, `AxiosError`, `InternalAxiosRequestConfig` types

**Step-by-Step Logic:**

**Section A — In-memory token store:**

1. Declare a module-level variable: `let _accessToken: string | null = null`.
2. Export `function setAccessToken(token: string | null): void` — sets `_accessToken`.
3. Export `function getAccessToken(): string | null` — returns `_accessToken`.
4. Export `function clearAccessToken(): void` — sets `_accessToken = null`.

**Section B — Axios instance:** 5. Create an Axios instance: `const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true, timeout: 15000 })`.

- `withCredentials: true` — sends the HttpOnly refresh token cookie on every request.
- `timeout: 15000` — 15-second timeout prevents hung requests.

**Section C — Request interceptor:** 6. Add a request interceptor using `api.interceptors.request.use(...)`:

- In the fulfilled handler: if `_accessToken` is not null, add it to the request headers: `config.headers.Authorization = \`Bearer ${\_accessToken}\``.
- Return the config.

**Section D — Response interceptor (silent refresh):** 7. Add a response interceptor using `api.interceptors.response.use(successHandler, errorHandler)`. 8. The success handler simply returns the response as-is. 9. The error handler receives an `AxiosError`:
a. Check if the error status is 401 AND the request has not been retried yet (add a custom `_retry` flag to the request config to prevent infinite loops).
b. If yes, mark `_retry = true` on the original config.
c. Try to call `await api.post('/auth/refresh')` — the server reads the HttpOnly cookie and issues a new access token in the response body.
d. If successful: call `setAccessToken(newToken)` with the token from the response, then retry the original request: `return api(originalConfig)`.
e. If the refresh call fails: call `clearAccessToken()` and re-throw the error (the calling code or the auth layer handles the redirect to login).
f. If the error is NOT a 401, re-throw it as-is.

**Section E — Typed convenience wrappers:** 10. Export typed functions that unwrap the Axios response `.data` field:
`     apiGet<T>(url, config?) → Promise<T>    — calls api.get, returns response.data
    apiPost<T>(url, body?, config?) → Promise<T>
    apiPatch<T>(url, body?, config?) → Promise<T>
    apiDelete<T>(url, config?) → Promise<T>
    ` 11. Export the raw `api` instance as the default export for edge cases where the typed wrappers are insufficient.

**Inputs & Outputs:**

- `apiGet<DashboardData>('/market/dashboard/nifty')` → `Promise<DashboardData>`
- All wrappers return the `data` field of the `ApiResponse<T>` envelope (i.e., they strip the `success`/`timestamp` wrapper).

**Error Handling & Edge Cases:**

- The `_retry` flag on the request config is essential — without it, a failed refresh would cause an infinite 401 loop.
- `process.env.NEXT_PUBLIC_API_URL` will be `undefined` during SSR if the variable is not set. The `|| ''` fallback prevents Axios from throwing on construction.
- Never log the `Authorization` header or token value in the interceptors — security risk.

---

## File 17 of 22

**File Path:** `apps/web/lib/utils.ts`

**Primary Purpose:** General-purpose utility functions shared across the frontend. Contains helpers for class name merging (Tailwind), formatting numbers in Indian locale, and formatting IST timestamps.

**Dependencies & Imports:**

- No external dependencies for P0. (In later phases: `clsx` + `tailwind-merge` for class name merging — add to `apps/web/package.json` when needed.)

**Step-by-Step Logic:**

1. Export `function formatIndianNumber(n: number): string`:
   - Use `new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)`.
   - Returns: `"1,23,456.78"` (Indian number format with lakhs/crores grouping).
2. Export `function formatCrore(n: number): string`:
   - Divide `n` by `1_00_00_000` (1 crore) if >= 1 crore, else divide by `1_00_000` (1 lakh).
   - Return string like `"12.5 Cr"` or `"4.2 L"`.
3. Export `function formatISTTime(date: Date | string): string`:
   - Use `new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(date))`.
   - Returns: `"14:32:05"`.
4. Export `function formatISTDateTime(date: Date | string): string`:
   - Same as above but include `day`, `month`, `year`.

**Inputs & Outputs:**

- All functions take a primitive (number or date string) and return a formatted string.

**Error Handling & Edge Cases:**

- `formatIndianNumber(NaN)` — `Intl.NumberFormat` returns `'NaN'`. Callers should guard against NaN before calling.
- `formatISTTime(null)` — `new Date(null)` returns epoch. Add a null check and return `'—'` if input is falsy.

---

# P0.5 — CI/CD & Deployment Config

---

## File 18 of 22

**File Path:** `.github/workflows/ci.yml`

**Primary Purpose:** GitHub Actions CI pipeline that runs on every push to `main` and every pull request. Runs lint, type-check, and unit tests across all workspace packages using Turborepo.

**Dependencies & Imports:**

- No code dependencies. Uses GitHub Actions syntax (YAML).

**Step-by-Step Logic:**

1. Set `name: CI`.
2. Set triggers:
   ```yaml
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   ```
3. Define a single job `quality` (lint + type-check + test can run as one Turbo task):
   a. `runs-on: ubuntu-latest`
   b. Steps:
   1. `actions/checkout@v4` — check out the repo.
   2. `pnpm/action-setup@v4` with `version: 11.3.0` — install pnpm.
   3. `actions/setup-node@v4` with `node-version: 22` and `cache: 'pnpm'` — install Node and cache pnpm store.
   4. `pnpm install --frozen-lockfile` — install deps. `--frozen-lockfile` ensures CI never silently updates the lockfile.
   5. `pnpm turbo run type-check lint test --parallel` — run all quality checks via Turbo. Turbo handles parallelism across packages automatically.
4. Add a second job `build` that depends on `quality` (`needs: quality`):
   a. Steps: checkout, setup pnpm, setup node, `pnpm install --frozen-lockfile`, `pnpm turbo run build`.
   b. This verifies the production build succeeds, not just type-check.

**Inputs & Outputs:**

- No code inputs/outputs. CI passes = green checkmark on the PR. CI fails = red X and PR is blocked.

**Error Handling & Edge Cases:**

- `--frozen-lockfile` will fail if `pnpm-lock.yaml` is out of date. Always run `pnpm install` locally before pushing.
- The `test` task in `turbo.json` must be defined. Verify it exists in `turbo.json` — add it if not: `"test": { "cache": false }`.

---

## File 19 of 22

**File Path:** `apps/api/Dockerfile`

**Primary Purpose:** Multi-stage Docker build file for the NestJS API. Used by Railway for production deployments. Stage 1 builds the TypeScript app; Stage 2 produces a lean runtime image.

**Dependencies & Imports:**

- No code dependencies. Dockerfile syntax.

**Step-by-Step Logic:**

**Stage 1 — Builder:**

1. `FROM node:22-alpine AS builder` — use Alpine for smaller size.
2. `RUN npm install -g pnpm@11.3.0` — install pnpm in the image.
3. `WORKDIR /app`
4. Copy only workspace manifest files first (for layer caching):
   ```
   COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
   COPY apps/api/package.json ./apps/api/
   COPY packages/types/package.json ./packages/types/
   COPY packages/utils/package.json ./packages/utils/
   ```
5. `RUN pnpm install --frozen-lockfile` — install all deps.
6. Copy all source files: `COPY . .`
7. Generate Prisma client: `RUN pnpm --filter @optionkart/api exec prisma generate`.
8. Build shared packages first: `RUN pnpm --filter @optionkart/types build` and `RUN pnpm --filter @optionkart/utils build`.
9. Build the API: `RUN pnpm --filter @optionkart/api build`.

**Stage 2 — Production:** 10. `FROM node:22-alpine AS production` 11. `RUN npm install -g pnpm@11.3.0` 12. `WORKDIR /app` 13. Copy workspace manifests and install production deps only:
`     COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
    COPY --from=builder /app/apps/api/package.json ./apps/api/
    COPY --from=builder /app/packages/types/package.json ./packages/types/
    COPY --from=builder /app/packages/utils/package.json ./packages/utils/
    RUN pnpm install --frozen-lockfile --prod
    ` 14. Copy built artifacts from the builder stage:
`     COPY --from=builder /app/apps/api/dist ./apps/api/dist
    COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
    COPY --from=builder /app/packages/types/dist ./packages/types/dist
    COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
    ` 15. Copy the generated Prisma client:
`     COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
    ` 16. Create a non-root user for security: `RUN addgroup -S appgroup && adduser -S appuser -G appgroup` then `USER appuser`. 17. `EXPOSE 3001` 18. `CMD ["node", "apps/api/dist/main"]`

**Inputs & Outputs:**

- Input: The monorepo source tree.
- Output: A Docker image that runs the NestJS API.

**Error Handling & Edge Cases:**

- The Prisma client generates code into `node_modules/.prisma/client` — this must be copied to the production stage or the runtime will crash with "Prisma client not generated".
- Never copy `.env` into the Docker image. All secrets are injected as Railway environment variables at runtime.

---

## File 20 of 22

**File Path:** `apps/api/.dockerignore`

**Primary Purpose:** Prevents large/sensitive directories from being sent to the Docker build context, making builds faster and more secure.

**Dependencies & Imports:** None.

**Step-by-Step Logic:**
List these entries, one per line:

```
node_modules
dist
.env
.env.*
!.env.example
coverage
*.tsbuildinfo
.git
.turbo
test
**/*.spec.ts
**/*.test.ts
README.md
```

---

## File 21 of 22

**File Path:** `apps/api/railway.json`

**Primary Purpose:** Railway deployment configuration. Tells Railway which Dockerfile to use, what health check path to poll, and the restart policy.

**Dependencies & Imports:** None. JSON syntax.

**Step-by-Step Logic:**
Create a JSON object:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/api/Dockerfile",
    "watchPatterns": ["apps/api/**", "packages/**"]
  },
  "deploy": {
    "healthcheckPath": "/v1/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Note:** `watchPatterns` tells Railway to rebuild only when API or shared package files change, not when `apps/web` files change.

---

## File 22 of 22

**File Path:** `apps/web/vercel.json`

**Primary Purpose:** Vercel deployment configuration for the Next.js frontend. Specifies the root directory, build command, and framework.

**Dependencies & Imports:** None. JSON syntax.

**Step-by-Step Logic:**

```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@optionkart/web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile"
}
```

**Note:** The `buildCommand` runs Turbo from the monorepo root so `packages/types` and `packages/utils` are built first. Vercel needs to be configured with **Root Directory = `.`** (repo root), not `apps/web/`, so it can access the full monorepo.

---

# Post-Implementation Verification

After all 22 files are created, run these commands from the repo root in order:

```bash
# 1. Install any newly added packages
pnpm install

# 2. Generate Prisma client (requires apps/api/prisma/schema.prisma to exist)
pnpm --filter @optionkart/api exec prisma generate

# 3. Start local services (if Docker Desktop is running with Linux containers)
docker compose up -d

# 4. Run database migration (creates the empty schema)
pnpm --filter @optionkart/api exec prisma migrate dev --name init

# 5. Start the API in dev mode — should print "API running on http://localhost:3001/v1"
pnpm --filter @optionkart/api start:dev

# 6. In a separate terminal, test the health endpoint
curl http://localhost:3001/v1/health
# Expected: { "success": true, "data": { "status": "ok", "services": {...} } }

# 7. Start the web app
pnpm --filter @optionkart/web dev
# Open http://localhost:3000 — should show dark background (not white)

# 8. Full type-check across all packages
pnpm turbo run type-check

# 9. Push to GitHub — CI workflow should run green
```

---

# P0.3 Completion Gate ✅

All of the following must be true before moving to P1:

| Check                                              | Command / Verification                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| API starts without errors                          | `start:dev` logs show all 3 DBs connected                                 |
| `/v1/health` returns 200                           | `curl http://localhost:3001/v1/health`                                    |
| Unknown routes return 404 in error envelope        | `curl http://localhost:3001/v1/fake` → `{ success: false, error: {...} }` |
| Sending invalid body returns 400 in error envelope | `curl -X POST http://localhost:3001/v1/health -d '{"x":1}'`               |
| Frontend loads dark background                     | Open `http://localhost:3000` — background must be `#0d0f14`               |
| `api-client.ts` imports without TS errors          | `pnpm turbo run type-check --filter=@optionkart/web` passes               |
| CI pipeline green                                  | Push a commit and check GitHub Actions tab                                |
