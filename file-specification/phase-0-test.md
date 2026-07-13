# Phase 0 — Test Plan & Verification Guide

**Phase:** P0.3 (Backend Bootstrap) · P0.4 (Frontend Bootstrap) · P0.5 (CI/CD)  
**Prerequisite:** All 22 files from `phase-0-implementation-guide.md` have been created.  
**Run everything from the monorepo root** (`d:\jobs\idea n research\ok\`) unless stated otherwise.

---

## Quick-Start: Run All Checks in Order

```bash
# 1 — Install packages (covers any new deps you added)
pnpm install

# 2 — Type-check everything
pnpm turbo run type-check

# 3 — Start Docker services  (Linux containers must be active in Docker Desktop)
docker compose up -d

# 4 — Generate Prisma client
pnpm --filter @optionkart/api exec prisma generate

# 5 — Run the initial DB migration
pnpm --filter @optionkart/api exec prisma migrate dev --name init

# 6 — Start the API
pnpm --filter @optionkart/api start:dev

# 7 — (New terminal) Start the web app
pnpm --filter @optionkart/web dev
```

If steps 1–7 complete without errors, continue to the individual checks below.

---

## Section 1 — Infrastructure (Docker Services)

### 1.1 All three containers are running

```bash
docker compose ps
```

**Expected output:** Three rows, all with `Status = Up (healthy)`.

| Container             | Port  | Health  |
| --------------------- | ----- | ------- |
| optionkart-postgres-1 | 5432  | healthy |
| optionkart-mongo-1    | 27017 | healthy |
| optionkart-redis-1    | 6379  | healthy |

### 1.2 Connect to each service manually

**PostgreSQL:**

```bash
docker compose exec postgres psql -U optionkart -d optionkart -c "SELECT version();"
```

Expected: Returns a PostgreSQL version string.

**MongoDB:**

```bash
docker compose exec mongo mongosh -u optionkart -p optionkart_dev --authenticationDatabase admin --eval "db.adminCommand({ ping: 1 })"                  // this doesn't work

docker compose exec mongodb mongosh -u optionkart -p optionkart_dev --authenticationDatabase admin --eval "db.adminCommand({ ping: 1 })"            // this work
```

Expected: `{ ok: 1 }`.

**Redis:**

```bash
docker compose exec redis redis-cli -a optionkart_dev PING
```

Expected: `PONG`.

---

## Section 2 — Backend Bootstrap (P0.3)

### 2.1 API starts cleanly

Start the API and watch the console:

```bash
pnpm --filter @optionkart/api start:dev
```

**Expected log lines (in order):**

```
[NestFactory] Starting Nest application...
[Bootstrap] PostgreSQL connected
[Bootstrap] Redis connected      ← from RedisService logger
[MongooseModule] MongoDB connected
[Bootstrap] API running on http://localhost:3001/v1
```

**Failure modes and fixes:**

| Error                                                 | Cause                                        | Fix                                                     |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| `Missing required environment variable: DATABASE_URL` | `.env` not present or Zod validation failing | Create `apps/api/.env` with all required vars           |
| `ECONNREFUSED 127.0.0.1:5432`                         | Postgres container not running               | `docker compose up -d postgres`                         |
| `ECONNREFUSED 127.0.0.1:6379`                         | Redis container not running                  | `docker compose up -d redis`                            |
| `MongoServerError: Authentication failed`             | Wrong MongoDB credentials                    | Verify `MONGODB_URI` matches docker-compose credentials |

---

### 2.2 Health endpoint — happy path

```bash
curl -s http://localhost:3001/v1/health | npx -y json
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "services": {
      "postgres": "up",
      "redis": "up",
      "mongodb": "up"
    },
    "timestamp": "2026-05-27T10:00:00.000Z",
    "uptime": 12.4
  },
  "timestamp": "2026-05-27T10:00:00.000Z"
}
```

Verify all of:

- [ ] HTTP status code is `200`
- [ ] `success` is `true`
- [ ] `data.status` is `"ok"`
- [ ] All three services show `"up"`
- [ ] The outer `timestamp` field is present (added by `ResponseInterceptor`)

**Check the HTTP status code explicitly:**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/v1/health
```

Expected: `200`

---

### 2.3 Health endpoint — degraded path (simulate a failure)

Stop the Redis container while the API is running:

```bash
docker compose stop redis
```

Then call the health endpoint again:

```bash
curl -s http://localhost:3001/v1/health | npx -y json
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "status": "degraded",
    "services": {
      "postgres": "up",
      "redis": "down",
      "mongodb": "up"
    },
    ...
  },
  ...
}
```

Verify:

- [ ] HTTP status is still `200` (not 503)
- [ ] `data.status` is `"degraded"` (not `"ok"`)
- [ ] `data.services.redis` is `"down"`
- [ ] The endpoint did **not** crash — it returned a response

Restart Redis afterward:

```bash
docker compose start redis
```

---

### 2.4 Global error envelope — 404 on unknown route

```bash
curl -s http://localhost:3001/v1/does-not-exist | npx -y json
```

**Expected:**

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Cannot GET /v1/does-not-exist",
    "path": "/v1/does-not-exist",
    "timestamp": "2026-05-27T10:00:00.000Z"
  }
}
```

Verify:

- [ ] HTTP status is `404`
- [ ] `success` is `false`
- [ ] `error.path` matches the requested URL
- [ ] `error.timestamp` is a valid ISO 8601 string

---

### 2.5 Global error envelope — 400 on validation failure

Send a POST to a non-existent route with a body (the `HttpExceptionFilter` must format the 404 correctly, not expose a raw Express error):

```bash
curl -s -X POST http://localhost:3001/v1/does-not-exist \
  -H "Content-Type: application/json" \
  -d '{"foo":"bar"}' | npx -y json
```

**Expected:** Same 404 envelope as above (POST to unknown route). The filter must handle POST too.

---

### 2.6 Global prefix is applied

Verify that routes WITHOUT the `/v1` prefix are not reachable:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health
```

Expected: `404` (the route exists at `/v1/health`, not `/health`)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/v1/health
```

Expected: `200`

---

### 2.7 ResponseInterceptor wraps successful responses

The `/v1/health` response already demonstrates this. Additionally verify that the outer envelope timestamp is a different (slightly later) value than the inner `data.timestamp` — if both are produced independently with `new Date().toISOString()`, they may differ by milliseconds. This confirms the interceptor runs AFTER the controller returns.

---

### 2.8 Env schema validation — missing variable crash test

Temporarily rename the `.env` file and restart the API:

```bash
# In apps/api/ — rename .env so it cannot be found
mv apps/api/.env apps/api/.env.bak
pnpm --filter @optionkart/api start:dev
```

**Expected:** The process should exit immediately with an error like:

```
Error: ZodError: [
  { "code": "invalid_type", "path": ["DATABASE_URL"], "message": "Required" },
  ...
]
```

Restore the file:

```bash
mv apps/api/.env.bak apps/api/.env
```

---

### 2.9 Prisma client generated and schema applied

```bash
# Check migration was applied
pnpm --filter @optionkart/api exec prisma migrate status
```

Expected: `Database schema is up to date!`

```bash
# Check generated client exists
ls apps/api/node_modules/.prisma/client/
```

Expected: Directory contains `index.js`, `index.d.ts`, and schema files.

---

### 2.10 CORS header verification

```bash
curl -s -I -H "Origin: http://localhost:3000" http://localhost:3001/v1/health
```

**Expected headers:**

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

If `FRONTEND_URL` is not set in `.env`, the origin falls back to `http://localhost:3000` (from `main.ts` default).

---

### 2.11 Security headers (Helmet)

```bash
curl -s -I http://localhost:3001/v1/health
```

**Expected headers present:**

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 0
Cross-Origin-Opener-Policy: same-origin
```

If any of these are missing, `helmet()` is not wired up correctly in `main.ts`.

---

## Section 3 — Frontend Bootstrap (P0.4)

### 3.1 Dev server starts

```bash
pnpm --filter @optionkart/web dev
```

Expected console output: `ready - started server on 0.0.0.0:3000` (or Next.js 15 equivalent).  
No TypeScript errors in the terminal.

---

### 3.2 Dark theme is applied

Open `http://localhost:3000` in a browser.

**Visual checks:**

- [ ] Background is near-black (`#0d0f14`) — NOT white
- [ ] Text is light (`#e8ecf4`)
- [ ] No flash of white background on load

**DevTools check:**

1. Open DevTools → Elements → `<html>` element
2. Verify `--background: #0d0f14` is defined on `:root` in the Styles panel
3. Verify `background-color` on `<body>` resolves to `rgb(13, 15, 20)` (the #0d0f14 equivalent)

---

### 3.3 Inter font is loaded (not Geist)

In DevTools → Network → filter by "font":

- [ ] Fonts loaded should reference `Inter` (from Google Fonts CDN)
- [ ] No requests for `GeistVF` or `GeistMonoVF`

In Elements panel — `<html>` element:

- [ ] Has a class containing `--font-sans` variable assignment
- [ ] `<body>` applies `font-family: var(--font-sans), system-ui, sans-serif`

---

### 3.4 Metadata is correct

In browser tab: title should be **"OptionKart — NSE Options Analytics"**.

View page source (`Ctrl+U`):

```html
<meta name="description" content="Real-time Nifty &amp; BankNifty options chain analysis..." />
<title>OptionKart — NSE Options Analytics</title>
```

---

### 3.5 `api-client.ts` type-checks without errors

```bash
pnpm turbo run type-check --filter=@optionkart/web
```

Expected: `0 errors`.

---

### 3.6 `@optionkart/types` imports work in both apps

```bash
pnpm turbo run type-check
```

Expected: `0 errors` across all packages (`api`, `web`, `types`, `utils`).

---

### 3.7 Axios base URL is picked up from env

Check `apps/web/.env.local` contains:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

In a browser with the web dev server running, open DevTools → Network. Trigger any API call (if none exist yet at this phase, add a temporary test):

Alternatively, verify at the source level that `api-client.ts` reads from `process.env.NEXT_PUBLIC_API_URL` and that the fallback is `''` (empty string, not `undefined` which would crash Axios).

---

## Section 4 — Type Safety & Build

### 4.1 Full type-check across all workspaces

```bash
pnpm turbo run type-check
```

**Expected:** All packages exit with code 0. Zero TypeScript errors.

---

### 4.2 Production build succeeds

```bash
pnpm turbo run build
```

**Expected outputs:**

- `apps/api/dist/` — NestJS compiled JS
- `apps/web/.next/` — Next.js production build
- `packages/types/dist/` — compiled types
- `packages/utils/dist/` — compiled utils

Zero TypeScript errors during build.

---

### 4.3 ESLint passes

```bash
pnpm turbo run lint
```

Expected: No errors. Warnings are acceptable but should be reviewed.

---

## Section 5 — Deployment Config Files

### 5.1 `railway.json` is valid JSON

```bash
node -e "require('./apps/api/railway.json'); console.log('valid')"
```

Expected: `valid`

### 5.2 `vercel.json` is valid JSON

```bash
node -e "require('./apps/web/vercel.json'); console.log('valid')"
```

Expected: `valid`

### 5.3 `.dockerignore` is present

```bash
Test-Path apps/api/.dockerignore
```

Expected: `True`

### 5.4 `Dockerfile` builds (optional — requires Docker)

```bash
docker build -f apps/api/Dockerfile -t optionkart-api-test .
```

Expected: Build completes with no errors. The production stage should be present.  
Clean up: `docker rmi optionkart-api-test`

---

## Section 6 — CI/CD (P0.5)

### 6.1 GitHub Actions workflow file exists and is valid YAML

```bash
Test-Path .github/workflows/ci.yml
```

Expected: `True`

Validate YAML syntax (requires Python):

```bash
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml').read()); print('valid YAML')"
```

### 6.2 CI runs green on push

1. Commit all Phase 0 files:
   ```bash
   git add .
   git commit -m "feat: Phase 0 infrastructure bootstrap"
   git push origin main
   ```
2. Open the GitHub repository → **Actions** tab
3. Verify the `CI` workflow is triggered
4. Both `quality` and `build` jobs must complete with a green ✅

**Expected job output for `quality`:**

```
Run pnpm turbo run type-check lint test --parallel
  @optionkart/types:type-check: 0 errors
  @optionkart/utils:type-check: 0 errors
  @optionkart/api:type-check: 0 errors
  @optionkart/web:type-check: 0 errors
  ...lint: 0 errors
  ...test: PASS
```

---

## Section 7 — Completion Gate

All checks below must pass before moving to **Phase 1 (Auth + DB Schema)**.

| #   | Check                                              | How to Verify                      | Status |
| --- | -------------------------------------------------- | ---------------------------------- | ------ |
| 1   | Docker: all 3 containers healthy                   | `docker compose ps`                | ⬜     |
| 2   | API boots without errors                           | `start:dev` terminal output        | ⬜     |
| 3   | All env vars validated by Zod                      | No startup error with valid `.env` | ⬜     |
| 4   | `/v1/health` returns `{ status: "ok" }`            | curl + JSON check                  | ⬜     |
| 5   | Degraded state returns `{ status: "degraded" }`    | Stop Redis, re-check               | ⬜     |
| 6   | 404 on unknown route has error envelope            | curl to `/v1/fake`                 | ⬜     |
| 7   | Routes without `/v1` prefix return 404             | curl to `/health`                  | ⬜     |
| 8   | Helmet security headers present                    | curl `-I`                          | ⬜     |
| 9   | CORS allows `FRONTEND_URL`                         | curl with `Origin` header          | ⬜     |
| 10  | Prisma migration applied                           | `prisma migrate status`            | ⬜     |
| 11  | Frontend loads with dark background `#0d0f14`      | Browser visual check               | ⬜     |
| 12  | Inter font loaded (not Geist)                      | DevTools Network                   | ⬜     |
| 13  | Page title is "OptionKart — NSE Options Analytics" | Browser tab                        | ⬜     |
| 14  | Full type-check passes (0 errors)                  | `pnpm turbo run type-check`        | ⬜     |
| 15  | Production build succeeds                          | `pnpm turbo run build`             | ⬜     |
| 16  | CI pipeline green on GitHub Actions                | Push to `main`                     | ⬜     |

---

## Appendix A — Useful Debug Commands

```bash
# Watch API logs in real time
pnpm --filter @optionkart/api start:dev

# Check which packages are in the pnpm workspace
pnpm list --recursive --depth 0

# Verify Prisma can reach the database
pnpm --filter @optionkart/api exec prisma db pull

# View all Prisma migrations applied
pnpm --filter @optionkart/api exec prisma migrate status

# Reset the local database (drops all tables + re-runs migrations)
pnpm --filter @optionkart/api exec prisma migrate reset

# Check Redis is accepting commands
docker compose exec redis redis-cli -a optionkart_dev INFO server | Select-String "redis_version"

# Run only API tests
pnpm --filter @optionkart/api test

# Run only web type-check
pnpm turbo run type-check --filter=@optionkart/web
```

---

## Appendix B — Expected File Tree After Phase 0

```
apps/
  api/
    prisma/
      schema.prisma                     ← File 5
    src/
      config/
        env.schema.ts                   ← File 1
      common/
        filters/
          http-exception.filter.ts      ← File 2
        interceptors/
          response.interceptor.ts       ← File 3
        decorators/
          public.decorator.ts           ← File 4
      prisma/
        prisma.service.ts               ← File 6
        prisma.module.ts                ← File 7
      redis/
        redis.service.ts                ← File 8
        redis.module.ts                 ← File 9
      health/
        health.controller.ts            ← File 10
        health.module.ts                ← File 11
      app.module.ts                     ← File 12 (updated)
      main.ts                           ← File 13 (updated)
    Dockerfile                          ← File 19
    .dockerignore                       ← File 20
    railway.json                        ← File 21
    .env                                ← (already present, not in the 22 files)
  web/
    app/
      globals.css                       ← File 14 (updated)
      layout.tsx                        ← File 15 (updated)
    lib/
      api-client.ts                     ← File 16
      utils.ts                          ← File 17
    vercel.json                         ← File 22
    .env.local                          ← (already present)
.github/
  workflows/
    ci.yml                              ← File 18
```
