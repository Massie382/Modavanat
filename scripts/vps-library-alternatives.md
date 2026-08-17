# VPS Library Reach — Full-Stack Next.js Dependency Map

**Generated:** 2026-08-17
**Project:** Modavanat (Next.js 16 + React 19 + TypeScript + Tailwind v4)
**VPS constraint:** cannot reach `binaries.prisma.sh` (Prisma's binary CDN). All other egress unverified.

This document is the companion reference for `vps-connectivity-check.sh`. It lists every library the project might need for full-stack development, the external host each one reaches at install time (if any), and a "just as good" alternative when the primary is unreachable.

---

## TL;DR — Recommended Stack for this VPS

| Concern | Primary (in project) | Recommended swap | Why |
|---|---|---|---|
| ORM | `prisma` + `@prisma/client` | **`drizzle-orm` + `drizzle-kit`** | Pure npm, no binary CDN. Same TS DX, smaller bundle. |
| Postgres driver | (bundled via Prisma) | **`postgres`** (postgres.js) | Pure JS, modern, no native deps. `pg` also fine. |
| Auth | `next-auth` v4 | keep, or upgrade to `next-auth@5` (Auth.js) with `@auth/drizzle-adapter` | Pure npm. |
| Password hashing | n/a | **`bcryptjs`** | Pure JS — avoids `bcrypt`'s GitHub prebuild fetch. Slower but fine for low-traffic sites. |
| Image processing | `sharp` ⚠ | keep, but install build toolchain OR pre-build on another machine | `sharp` fetches libvips from GitHub Releases. If GitHub works on the VPS, `sharp` installs fine. |
| Everything else | as listed in `package.json` | unchanged | All pure npm. |

**One-line Ubuntu setup for native module fallbacks:**
```bash
sudo apt-get install -y build-essential python3 make g++ pkg-config
```

---

## 1. The Prisma Problem

### What fails

```
prisma install → fetches engines from https://binaries.prisma.sh
                → DNS failure / timeout on this VPS
                → `prisma generate` hangs or errors
```

Prisma's query engine, schema engine, and introspection engine are Rust binaries hosted at `https://binaries.prisma.sh/all_commits/<commit-hash>/<binary-target>/<engine-file>`. The host is a CDN fronting an S3 bucket. Without reachability, neither `prisma generate` (CLI) nor `@prisma/client` instantiation (runtime) will work.

### Prisma's official workarounds (do NOT recommend)

- `PRISMA_ENGINES_MIRROR` — point at a self-hosted mirror. Requires you to mirror every engine version you use.
- `PRISMA_QUERY_ENGINE_BINARY` — point at a pre-staged local binary. Fragile across Prisma upgrades.
- `PRISMA_CLI_BINARY_TARGETS` — pre-download for a different target. Doesn't solve the underlying network issue.

These workarounds exist for air-gapped enterprise deployments. For a single VPS, **switching to Drizzle is dramatically simpler.**

### Why Prisma v7 won't save you (yet)

Prisma v7 (in progress through 2026) is moving away from the Rust-engine model toward a "Rust-free" client. But as of the v6 line (currently stable, in your `package.json`), you still hit `binaries.prisma.sh`. Wait for v7 GA + community validation before relying on it.

---

## 2. Prisma Alternatives — Detailed Comparison

### ★ Drizzle ORM (recommended)

- **npm:** `drizzle-orm` + `drizzle-kit`
- **Latest:** `drizzle-orm@0.45.2` (Aug 2026)
- **External binary downloads:** **none**. Official README: *"No bells and whistles, no Rust binaries, no serverless adapters, everything just works out of the box."*
- **Drivers:** you pick one — `postgres` (postgres.js), `pg` (node-postgres), `mysql2`, `@neondatabase/serverless`, `@libsql/client`, `better-sqlite3`, `node:sqlite` (Node 22+). All pure JS except `better-sqlite3` (see §4).
- **Migration story from Prisma:**
  1. `npm uninstall prisma @prisma/client`
  2. `npm i drizzle-orm drizzle-kit postgres`
  3. Rewrite `prisma/schema.prisma` as `drizzle/schema.ts` (Drizzle has a [schema conversion guide](https://orm.drizzle.team/docs/migrate-from-prisma)).
  4. Replace `prisma.user.findMany()` calls with `db.select().from(users)`.
  5. Replace `@auth/prisma-adapter` with `@auth/drizzle-adapter` (drop-in for Auth.js v5).
- **Bundle size:** ~30 KB minified vs Prisma's ~1.5 MB query engine.
- **Type safety:** full end-to-end TypeScript inference, like Prisma.
- **Edge runtime:** works on Cloudflare Workers, Vercel Edge, Deno.

**Verdict:** drop-in replacement. The only thing you lose is `prisma studio` — but `drizzle-kit studio` is the equivalent.

### Kysely

- **npm:** `kysely` + `kysely-ctl`
- **External binaries:** none.
- **Style:** SQL query builder (not a full ORM). You write SQL-shaped TS code; Kysely infers types.
- **When to pick over Drizzle:** you want raw SQL control, no schema-mapping layer, and minimal magic.
- **When to pick Drizzle over Kysely:** you want Prisma-like `db.user.findMany()` ergonomics.

### Other alternatives (less common)

| Library | External binaries | Notes |
|---|---|---|
| **TypeORM** | none (the ORM itself) | Mature, decorator-heavy. Often used with NestJS. |
| **Sequelize** | none (the ORM itself) | Long-standing, very mature, less modern TS DX. |
| **Knex** | none | Pure SQL query builder, often the underlying layer for other ORMs. |
| **MikroORM 7** | none | Mar 2026 release — dropped to **zero core deps**, decoupled from Knex. Identity Map + Unit of Work patterns. |
| **ZenStack V3** | none | Sep 2025 rewrite — now sits on Kysely. **Prisma-client-compatible API** + built-in access-control layer. Easiest migration path if you want minimal code changes. |

---

## 3. Database Drivers

Every ORM needs a driver underneath. Pick a pure-JS one to avoid native module headaches.

| Driver | Pure JS? | Native module? | Notes |
|---|---|---|---|
| `pg` (node-postgres) | ✅ Default | optional `pg-native` (you can skip) | The historical default. Mature. |
| `postgres` (postgres.js) | ✅ | none | Modern, smaller, faster on benchmarks. Recommended for Drizzle. |
| `mysql2` | ✅ | none | Pure JS. The standard MySQL driver. |
| `mariadb` | ✅ | none | Pure JS MariaDB driver. |
| `tedious` | ✅ | none | SQL Server, pure JS. |
| `mongodb` | ✅ | none | Official MongoDB driver. |
| `redis` (node-redis) | ✅ | none | Official Redis client. |
| `ioredis` | ✅ | none | Widely used Redis client (used by BullMQ). |
| `@libsql/client` | ✅ (Wasm) | none | Turso/libsql. SQLite-compatible, ships Wasm via npm. |
| `@neondatabase/serverless` | ✅ | none | Neon Postgres over HTTP (no persistent connection needed). |
| `better-sqlite3` | ⚠ | **yes — prebuild from GitHub** | Fast, synchronous SQLite. Falls back to source build with `build-essential`. |
| `sqlite3` (legacy) | ⚠ | **yes — prebuild via node-pre-gyp** | Older, slower than `better-sqlite3`. Avoid for new projects. |
| `node:sqlite` | ✅ | none | **Built into Node 22+.** Zero install. Experimental but stable enough. |

---

## 4. Native Modules — The GitHub Prebuild Question

These packages compile native C/C++/Rust code. At install time, they try to download a prebuilt binary from GitHub Releases. If that fails, they fall back to building from source via `node-gyp`.

| Package | Prebuild source | GitHub reachable? | Fallback | Build deps on Ubuntu |
|---|---|---|---|---|
| `bcrypt` | `github.com/kelektiv/node.bcrypt.js/releases` | test | source build via node-gyp | `build-essential python3 make g++` |
| `argon2` | `github.com/ranisalt/node-argon2/releases` | test | source build via node-gyp | `build-essential python3 make g++` |
| `better-sqlite3` | `github.com/WiseLibs/better-sqlite3/releases` | test | source build via node-gyp | `build-essential python3 make g++` |
| `canvas` | `github.com/Automattic/node-canvas/releases` | test | source build (heavy) | `build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpng-dev pkg-config python3-setuptools` |
| `sharp` ⚠ (in your project) | `github.com/lovell/sharp-libvips/releases` | test | build against system libvips | libvips build chain (substantial) |
| `node-sass` (deprecated) | GitHub Releases | test | source build | `build-essential python3 make g++` |

### Pure-JS alternatives that avoid the whole problem

| Native module | Pure-JS alternative | Tradeoff |
|---|---|---|
| `bcrypt` | **`bcryptjs`** | ~3× slower. Fine for low-traffic auth. |
| `argon2` | `bcryptjs` (different algo) | Or `@node-rs/argon2` (still hits GitHub for prebuilds, but has Wasm fallback in some versions). |
| `better-sqlite3` | **`node:sqlite`** (Node 22+) or **`@libsql/client`** (Wasm) | Zero external fetch. |
| `canvas` | **`@napi-rs/canvas`** (Rust + napi-rs, prebuilds on GitHub but better coverage) or `skia-canvas` | Same fundamental problem. Consider server-side rendering with `satori` + `resvg` instead. |
| `sharp` | none — `sharp` is the standard. | Install build-essential if GitHub is unreachable. Or pre-build on a dev machine and copy `node_modules`. |

### The build-toolchain one-liner

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 make g++ pkg-config
```

This makes every native module fall back to source compilation cleanly. It's a one-time setup.

---

## 5. Authentication

| Package | External binaries | Notes |
|---|---|---|
| `next-auth` v4 (in project) | none | Stable, widely used. Pure npm. |
| `next-auth` v5 / Auth.js | none | The future of next-auth. Adapters reorganized: `@auth/drizzle-adapter`, `@auth/kysely-adapter`, etc. |
| **`better-auth`** | none | ★ 2025/2026 rising star. Framework-agnostic, runs on any TS runtime. Better DX than next-auth for custom auth flows. ⚠ Check for the 2025 account-takeover CVE if you enable API keys — upgrade to patched version. |
| `lucia` | none | **Deprecated March 2025.** Do not start new projects on Lucia. |
| `jose` | none | JWT/JWS/JWE. Pure JS. Use this for custom JWT auth. |
| `jsonwebtoken` | none | Older JWT lib, pure JS. |
| `passport` / `passport-local` | none | Express-style auth middleware. Mature. |

---

## 6. Email

| Package | External binaries | Runtime API host |
|---|---|---|
| `nodemailer` | none | your SMTP server |
| `resend` | none | `api.resend.com` |
| `@sendgrid/mail` | none | `api.sendgrid.com` |
| `postmark` | none (zero runtime deps) | `api.postmarkapp.com` |
| `mailgun.js` | none | `api.mailgun.net` |
| `@aws-sdk/client-ses` | none | AWS SES endpoint |

All SDKs are pure npm — no install-time external fetches. The runtime API hosts only matter when the app actually sends email.

---

## 7. File Uploads & Storage

| Package | External binaries |
|---|---|
| `multer` | none |
| `formidable` | none |
| `busboy` | none |
| `uploadthing` / `@uploadthing/react` | none |
| `@aws-sdk/client-s3` | none |
| `@supabase/storage-js` | none |

---

## 8. Payments

| Package | External binaries | Runtime API host |
|---|---|---|
| `stripe` / `@stripe/stripe-js` / `@stripe/react-stripe-js` | none | `api.stripe.com` |
| `@lemonsqueezy/lemonsqueezy.js` | none | `api.lemonsqueezy.com` |
| `paddle-sdk` | none | Paddle API |
| `paypal-rest-sdk` | none | PayPal API (legacy — consider `@paypal/paypal-server-sdk`) |

---

## 9. Search

| Package | External binaries | Notes |
|---|---|---|
| `meilisearch` (SDK) | none | Self-hosted Meilisearch instance — no external API. |
| `typesense` (SDK) | none | Self-hosted Typesense instance. |
| `algoliasearch` | none | Managed Algolia. Runtime host: `*.algolia.net`. |
| `fuse.js` | none | Client-side fuzzy search. Pure JS. |
| `minisearch` | none | Client-side full-text. Pure JS. |
| `flexsearch` | none | Client-side full-text. Pure JS. |
| `@orama/orama` | none | Modern in-memory full-text + vector search. Pure JS/Wasm. |

---

## 10. Rate Limiting & Caching

| Package | External binaries | Notes |
|---|---|---|
| `lru-cache` | none | In-memory LRU. Pure JS. |
| `@upstash/ratelimit` | none | Serverless rate limit on Upstash Redis. Runtime host: `*.upstash.io`. |
| `@upstash/redis` | none | HTTP-based Redis client for Upstash. |
| `rate-limiter-flexible` | none | Supports Redis, Memcached, MongoDB, in-memory. |
| `express-rate-limit` | none | Express middleware. |
| `keyv` / `@keyv/redis` | none | Simple KV store with adapters. |
| `node-cache` | none | In-memory cache. |

---

## 11. Background Jobs & Queues

| Package | External binaries | Notes |
|---|---|---|
| `bullmq` | none | Pure TS. Needs a Redis server at runtime. |
| `bull` (legacy) | none | Older Bull. Same Redis requirement. |
| `inngest` | none | Managed platform. Runtime calls Inngest's API. |
| `@trigger.dev/sdk` | none | Managed platform. Runtime calls Trigger.dev's API. |
| `agenda` | none | MongoDB-backed. |
| `node-cron` | none | In-process cron. No persistence. |
| `bree` | none | Node.js job scheduler, uses worker threads. |
| `temporal` | none | Self-hosted Temporal SDK. |

---

## 12. WebSockets & Real-time

| Package | External binaries | Notes |
|---|---|---|
| `socket.io` / `socket.io-client` | none | The standard WebSocket library. |
| `ws` | none | Raw WebSocket (RFC 6455). What Socket.IO uses underneath. |
| `@fastify/websocket` | none | Fastify plugin. |
| `pusher` / `pusher-js` | none | Managed Pusher. Runtime: `api-pusher.com`. |
| `ably` | none | Managed Ably. Runtime: `rest.ably.io`. |
| `centrifuge` | none | Centrifugo client. |

---

## 13. Security

| Package | External binaries |
|---|---|
| `helmet` | none |
| `cors` | none |
| `dompurify` | none |
| `sanitize-html` | none |
| `xss` | none |
| `csrf` / `csurf` (deprecated) | none |
| `express-mongo-sanitize` | none |
| `hpp` | none |
| `express-validator` | none |

---

## 14. Logging

| Package | External binaries | Notes |
|---|---|---|
| **`pino`** | none | ★ Fastest structured logger for Node. |
| `pino-pretty` | none | Pino prettifier for dev. |
| `winston` | none | Popular, slightly slower than Pino. |
| `morgan` | none | Express HTTP request logger. |
| `debug` | none | Tiny debug utility. |
| `consola` | none | Nuxt stack logger. |
| `signale` | none | Pretty console logger. |

---

## 15. Testing

| Package | External binaries | Notes |
|---|---|---|
| **`vitest`** | none | ★ Vite-native, fast, Jest-compatible API. |
| `@vitest/coverage-v8` | none | V8 coverage. |
| `@vitest/ui` | none | Vitest UI. |
| `jest` | none | Older, slower, but very widely supported. |
| `ts-jest` | none | TypeScript transformer for Jest. |
| `playwright` / `@playwright/test` | ⚠ | Downloads browser binaries at first run from `playwright.azureedge.net`. Not needed at install time. |
| `msw` | none | Mock Service Worker. |
| `nock` | none | HTTP mocking. |
| `sinon` | none | Spies/stubs/mocks. |
| `happy-dom` | none | Faster alternative to jsdom. |
| `jsdom` | none | DOM implementation for tests. |

---

## 16. Monitoring & Error Tracking

| Package | External binaries | Runtime host |
|---|---|---|
| `@sentry/nextjs` / `@sentry/node` / `@sentry/react` | none | `sentry.io`, `*.ingest.sentry.io` |
| `@axiom-js/axiom` | none | `api.axiom.co` |
| `@highlight-run/next` | none | `pub.highlight.io` |
| `@logtail/node` | none | Better Stack / Logtail API |
| `posthog-node` / `posthog-js` | none | `app.posthog.com` (or self-hosted) |
| `@vercel/analytics` | none | Vercel analytics |
| `plausible-tracker` | none | Your Plausible instance |

---

## 17. UI / Components (currently in project)

All of these are pure npm packages — no install-time external fetches:

- `next`, `react`, `react-dom`
- `tailwindcss`, `@tailwindcss/postcss`, `tailwind-merge`, `tailwindcss-animate`, `tw-animate-css`
- `lucide-react`, `class-variance-authority`, `clsx`, `cmdk`, `vaul`
- All `@radix-ui/*` packages (dialog, dropdown, accordion, etc.)
- `framer-motion`, `recharts`, `react-markdown`, `react-syntax-highlighter`
- `embla-carousel-react`, `react-day-picker`, `react-resizable-panels`, `input-otp`
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `@mdxeditor/editor`, `@reactuses/core`

---

## 18. State & Data Fetching (currently in project)

| Package | External binaries |
|---|---|
| `zustand` (in project) | none |
| `@tanstack/react-query` (in project) | none |
| `@tanstack/react-table` (in project) | none |
| `swr` | none |
| `jotai` | none |
| `valtio` | none |
| `mobx` | none |
| `redux` / `@reduxjs/toolkit` / `react-redux` | none |
| `xstate` | none |

---

## 19. Forms (currently in project)

| Package | External binaries |
|---|---|
| `react-hook-form` (in project) | none |
| `@hookform/resolvers` (in project) | none |
| `formik` | none |
| `final-form` | none |

---

## 20. AI / LLM SDKs

| Package | External binaries | Runtime host |
|---|---|---|
| `z-ai-web-dev-sdk` (in project) | none | Z.ai API |
| `openai` | none | `api.openai.com` |
| `anthropic` / `@anthropic-ai/sdk` | none | `api.anthropic.com` |
| `ai` (Vercel AI SDK) | none | depends on provider |
| `@ai-sdk/openai` / `@ai-sdk/anthropic` | none | provider APIs |
| `langchain` / `@langchain/core` | none | depends on integrations |
| `ollama` | none | `localhost:11434` (self-hosted) |

---

## 21. Backend-as-a-Service / DB Providers

| Package | External binaries | Runtime host |
|---|---|---|
| `@supabase/supabase-js` | none | `*.supabase.co` |
| `@supabase/ssr` | none | `*.supabase.co` |
| `@neondatabase/serverless` | none | Neon endpoint |
| `@planetscale/database` | none | PlanetScale endpoint |
| `@vercel/postgres` / `@vercel/kv` | none | Vercel endpoints |
| `@upstash/vector` | none | Upstash vector endpoint |
| `faunadb` | none | Fauna endpoint |

---

## External Host Cheat Sheet

The script tests all of these. Here's the master list for reference:

### Install-time hosts (matter for `npm install`)

| Host | Used by |
|---|---|
| `registry.npmjs.org` | every npm package |
| `github.com` / `codeload.github.com` | git-based deps, source tarballs |
| `objects.githubusercontent.com` | GitHub release asset downloads |
| `binaries.prisma.sh` | Prisma (the problem) |
| `github.com/<org>/<repo>/releases/download/...` | prebuilds for `bcrypt`, `argon2`, `better-sqlite3`, `canvas`, `sharp` |
| `playwright.azureedge.net` | Playwright browser binaries (first-run only, not install-time) |

### Runtime hosts (matter when the app serves requests)

| Host | Service |
|---|---|
| `api.stripe.com` | Stripe |
| `api.resend.com` | Resend |
| `api.sendgrid.com` | SendGrid |
| `api.postmarkapp.com` | Postmark |
| `api.mailgun.net` | Mailgun |
| `sentry.io`, `*.ingest.sentry.io` | Sentry |
| `app.posthog.com` | PostHog |
| `pub.highlight.io` | Highlight.io |
| `api.axiom.co` | Axiom |
| `api.upstash.com`, `*.upstash.io` | Upstash |
| `*.algolia.net` | Algolia |
| `uploadthing.com` | UploadThing |
| `api.supabase.com`, `*.supabase.co` | Supabase |
| `api.openai.com` | OpenAI |
| `api.anthropic.com` | Anthropic |
| `api-pusher.com` | Pusher |
| `rest.ably.io` | Ably |

---

## Migration Path: Prisma → Drizzle

If `vps-connectivity-check.sh` confirms `binaries.prisma.sh` is unreachable, follow this sequence:

### 1. Uninstall Prisma

```bash
npm uninstall prisma @prisma/client @prisma/engines
```

### 2. Install Drizzle + a pure-JS Postgres driver

```bash
npm i drizzle-orm
npm i -D drizzle-kit
npm i postgres    # postgres.js — pure JS, modern
# OR
npm i pg           # node-postgres — pure JS, mature
```

### 3. Convert the schema

Prisma's `schema.prisma`:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

Drizzle's `schema.ts`:
```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const users = pgTable("users", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  email:     text("email").notNull().unique(),
  name:      text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Drizzle has an official [Prisma → Drizzle migration guide](https://orm.drizzle.team/docs/migrate-from-prisma).

### 4. Replace Prisma client calls

```ts
// Before (Prisma)
const users = await prisma.user.findMany({ where: { email: { contains: "x" } } });

// After (Drizzle)
import { eq, ilike } from "drizzle-orm";
const result = await db.select().from(users).where(ilike(users.email, "%x%"));
```

### 5. Replace Auth.js adapter

```bash
npm uninstall @auth/prisma-adapter
npm i @auth/drizzle-adapter
```

Update `auth.ts`:
```ts
// Before
import { PrismaAdapter } from "@auth/prisma-adapter";
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // ...
});

// After
import { DrizzleAdapter } from "@auth/drizzle-adapter";
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  // ...
});
```

### 6. Replace `db:push` / `db:migrate` scripts

```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 7. Test

```bash
npm run db:push    # apply schema to your Postgres
npm run dev        # start the app
```

That's it. The rest of your app code (React components, API routes, auth flows) should work unchanged.

---

## When to run the connectivity check

Run `vps-connectivity-check.sh`:

1. **Before committing to a stack** — confirms Drizzle, your chosen driver, and your chosen auth/email/payments SDKs are all reachable.
2. **After VPS network changes** — firewall rules change, ISP routing changes, etc.
3. **Before deploying a new dependency** — add a `check_npm` line for the new package and re-run.

The script is read-only. Running it 1000 times will not install, modify, or break anything.
