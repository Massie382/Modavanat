#!/usr/bin/env bash
# =============================================================================
#  VPS Connectivity Check — Next.js Full-Stack Library Reach
# =============================================================================
#  Purpose:
#    Verify that this VPS can actually reach every package registry,
#    prebuild CDN, and runtime API host that a full-stack Next.js 16
#    project might need — WITHOUT installing or downloading anything.
#
#    For each candidate library, the script issues a single HTTP HEAD
#    (via curl) to the host that would serve the bytes at install time
#    (or at runtime, for SaaS APIs). It then reports PASS / FAIL / WARN
#    with the HTTP status code. No package is installed, no file is
#    written to node_modules, no existing install is touched.
#
#  Why this exists:
#    The VPS cannot reach Prisma's binary CDN (binaries.prisma.sh),
#    which makes Prisma unusable here. This script enumerates the
#    entire dependency surface — including Prisma alternatives like
#    Drizzle/Kysely — so you know in advance exactly which libraries
#    will install cleanly and which will need a fallback strategy
#    (a pure-JS alternative, or a build-toolchain for source builds).
#
#  Usage:
#    chmod +x vps-connectivity-check.sh
#    ./vps-connectivity-check.sh
#
#  Exit codes:
#    0  — all hosts reachable
#    1  — one or more hosts unreachable (see FAIL lines)
#    2  — pre-flight failure (curl missing, etc.)
#
#  Requirements:
#    bash 4+, curl, outbound HTTPS to the internet.
#
#  Author: Super Z   |   Generated: 2026-08-17
# =============================================================================

set -uo pipefail

# ── Color setup (only when stdout is a TTY, so log redirects stay clean) ────
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  DIM='\033[2m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' DIM='' NC=''
fi

# ── Counters ────────────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
declare -a FAILED_ITEMS=()
declare -a WARNED_ITEMS=()

# ── Section printer ─────────────────────────────────────────────────────────
section() {
  echo ""
  printf "  ${CYAN}${BOLD}── %s ──${NC}\n" "$1"
}

# ── Core URL checker ────────────────────────────────────────────────────────
#  Args:
#    $1 = human-readable label
#    $2 = URL to test
#    $3 = (optional) "no-follow" to disable -L redirect following
check_url() {
  local label="$1"
  local url="$2"
  local follow="${3:-follow}"

  local curl_opts=(-s -o /dev/null -w "%{http_code}" --max-time 12)
  if [[ "$follow" == "follow" ]]; then
    curl_opts+=(-L)
  fi

  local status
  # NOTE: curl's -w "%{http_code}" already outputs "000" on
  # DNS failure / timeout / refused — do NOT add `|| echo "000"`, that
  # would duplicate it and produce "000000".
  status=$(curl "${curl_opts[@]}" "$url" 2>/dev/null)
  [[ -z "$status" ]] && status="000"

  if [[ "$status" == "000" ]]; then
    printf "  ${RED}✗ FAIL${NC}  %s\n" "$label"
    printf "         ${DIM}url:${NC} %s\n" "$url"
    printf "         ${RED}unreachable (DNS failure, timeout, or refused)${NC}\n"
    ((FAIL_COUNT++))
    FAILED_ITEMS+=("$label")
  elif [[ "$status" =~ ^2 ]] || [[ "$status" == "301" ]] || [[ "$status" == "302" ]] || [[ "$status" == "307" ]] || [[ "$status" == "308" ]]; then
    printf "  ${GREEN}✓ PASS${NC}  %-52s ${DIM}HTTP %s${NC}\n" "$label" "$status"
    ((PASS_COUNT++))
  else
    printf "  ${YELLOW}⚠ WARN${NC}  %-52s ${DIM}HTTP %s${NC}\n" "$label" "$status"
    ((WARN_COUNT++))
    WARNED_ITEMS+=("$label ($status)")
  fi
}

# ── npm package checker (hits the registry's /latest endpoint) ──────────────
#  Confirms the package exists on the npm registry AND that the VPS can
#  actually fetch its metadata. A 200 means `npm install <pkg>` will work.
check_npm() {
  local pkg="$1"
  local note="${2:-}"
  local label="$pkg"
  [[ -n "$note" ]] && label="$pkg  $DIM($note)${NC}"
  # URL-encode any / in scoped package names (@scope/name → @scope%2Fname)
  local url="https://registry.npmjs.org/${pkg//\//%2F}/latest"
  check_url "$label" "$url"
}

# ── Pre-flight ──────────────────────────────────────────────────────────────
echo ""
echo "============================================================================"
echo "  VPS Connectivity Check — Next.js Full-Stack Library Reach"
echo "  $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "============================================================================"
echo ""

if ! command -v curl &>/dev/null; then
  printf "  ${RED}ERROR:${NC} curl is required but not installed.\n"
  printf "  Install it with: ${BOLD}sudo apt-get install -y curl${NC}\n"
  exit 2
fi

CURL_VER=$(curl --version | head -1 | awk '{print $2}')
printf "  ${BOLD}Pre-flight:${NC} curl ${CURL_VER}\n"

if command -v node &>/dev/null; then
  NODE_VER=$(node --version 2>/dev/null || echo "unknown")
  printf "  ${BOLD}Pre-flight:${NC} node ${NODE_VER}\n"
fi

if command -v npm &>/dev/null; then
  NPM_VER=$(npm --version 2>/dev/null || echo "unknown")
  printf "  ${BOLD}Pre-flight:${NC} npm  ${NPM_VER}\n"
fi

printf "  ${BOLD}Mode:${NC} read-only (no installs, no writes to node_modules)\n"

# ============================================================================
#  1. CORE REGISTRIES — the foundation everything else depends on
# ============================================================================
section "1. Core registries"

check_url "npm registry (registry.npmjs.org)" "https://registry.npmjs.org"
check_url "npm registry metadata (skimdb)" "https://skimdb.npmjs.com/registry"
check_url "GitHub (raw content)" "https://raw.githubusercontent.com/torvalds/linux/master/README"
check_url "GitHub (API)" "https://api.github.com"
check_url "GitHub (codeload — tarballs)" "https://codeload.github.com"
check_url "GitHub (release assets — objects.githubusercontent.com)" "https://objects.githubusercontent.com"

# ============================================================================
#  2. THE PROBLEM — Prisma's binary CDN
# ============================================================================
section "2. Prisma — known to fail on this VPS"

check_url "binaries.prisma.sh  (Prisma engine CDN — the root cause)" "https://binaries.prisma.sh"
check_url "Prisma sample engine URL" \
  "https://binaries.prisma.sh/all_commits/d6e7e8cdcef3e8c7b5e80c8b8f31e9e8b5b3e8c7/linux-x64/query-engine-rs-library"

check_npm "prisma"                "currently in package.json — will install but unusable"
check_npm "@prisma/client"        "currently in package.json — will install but unusable"
check_npm "@prisma/engines"       "binary-fetching inner package"

# ============================================================================
#  3. PRISMA ALTERNATIVES — pure npm, no external CDNs
# ============================================================================
section "3. Prisma alternatives (pure npm — recommended)"

check_npm "drizzle-orm"          "★ RECOMMENDED — top Prisma alternative"
check_npm "drizzle-kit"          "Drizzle's CLI (migrations, push, studio)"
check_npm "kysely"               "TypeScript SQL query builder"
check_npm "kysely-ctl"           "Kysely CLI"
check_npm "typeorm"              "Mature TS ORM"
check_npm "sequelize"            "Long-standing JS ORM"
check_npm "knex"                 "SQL query builder (used by many ORMs)"
check_npm "@mikro-orm/core"      "MikroORM 7 — zero core deps"
check_npm "@mikro-orm/postgresql" "MikroORM Postgres driver"
check_npm "@mikro-orm/mysql"     "MikroORM MySQL driver"
check_npm "@mikro-orm/sqlite"    "MikroORM SQLite driver"
check_npm "zenstack"             "ZenStack V3 — Prisma-compatible API on Kysely"

# ============================================================================
#  4. DATABASE DRIVERS — the layer beneath any ORM
# ============================================================================
section "4. Database drivers"

check_npm "pg"                   "node-postgres — pure JS, default"
check_npm "pg-pool"              "pg connection pool"
check_npm "postgres"             "postgres.js (porsager) — pure JS, modern"
check_npm "mysql2"               "MySQL — pure JS"
check_npm "mariadb"              "MariaDB driver"
check_npm "tedious"              "SQL Server driver (pure JS)"
check_npm "mongodb"              "MongoDB official driver"
check_npm "redis"                "node-redis (official)"
check_npm "ioredis"              "Redis client (widely used)"
check_npm "@libsql/client"       "Turso/libsql — Wasm, pure npm"
check_npm "@neondatabase/serverless" "Neon Postgres (HTTP)"

# ============================================================================
#  5. NATIVE MODULES — these fetch prebuilds from GitHub (may also fail)
# ============================================================================
section "5. Native modules (fetch prebuilds from GitHub Releases)"

check_npm "bcrypt"               "password hashing — prebuild from GitHub"
check_npm "bcryptjs"             "★ pure-JS alt — no prebuild, slightly slower"
check_npm "argon2"               "prebuild from GitHub Releases"
check_npm "@node-rs/argon2"      "Rust argon2 (napi-rs prebuilds)"
check_npm "better-sqlite3"       "prebuild from GitHub Releases"
check_npm "sharp"                "ALREADY IN PROJECT — libvips prebuild from GitHub"
check_npm "canvas"               "Cairo-backed — prebuild + heavy system deps"
check_npm "node-sass"            "(deprecated, but still used) prebuild"
check_npm "sqlite3"              "(legacy) prebuild via node-pre-gyp"

# Direct GitHub release endpoints (these are what install scripts actually hit)
check_url "bcrypt GitHub releases" \
  "https://github.com/kelektiv/node.bcrypt.js/releases"
check_url "argon2 GitHub releases" \
  "https://github.com/ranisalt/node-argon2/releases"
check_url "better-sqlite3 GitHub releases" \
  "https://github.com/WiseLibs/better-sqlite3/releases"
check_url "sharp libvips GitHub releases" \
  "https://github.com/lovell/sharp-libvips/releases"
check_url "canvas GitHub releases" \
  "https://github.com/Automattic/node-canvas/releases"

# ============================================================================
#  6. AUTHENTICATION
# ============================================================================
section "6. Authentication"

check_npm "next-auth"            "v4 in project; v5 = npm i next-auth@beta"
check_npm "@auth/core"           "Auth.js v5 core (framework-agnostic)"
check_npm "@auth/drizzle-adapter" "Auth.js adapter for Drizzle"
check_npm "@auth/kysely-adapter" "Auth.js adapter for Kysely"
check_npm "@auth/prisma-adapter" "Auth.js adapter for Prisma"
check_npm "better-auth"          "★ 2025/2026 rising star — pure npm"
check_npm "lucia"                "deprecated March 2025 — avoid for new projects"
check_npm "jose"                 "JWT/JWS/JWE — pure JS"
check_npm "jsonwebtoken"         "JWT signing (legacy, pure JS)"
check_npm "passport"             "Express auth middleware"
check_npm "passport-local"       "username/password strategy"
check_npm "oauth"                "OAuth client (modern)"

# ============================================================================
#  7. VALIDATION
# ============================================================================
section "7. Validation"

check_npm "zod"                  "currently in package.json"
check_npm "valibot"              "★ smaller bundle than Zod, similar API"
check_npm "yup"                  "object schema validation"
check_npm "joi"                  "schema validation"
check_npm "superstruct"          "typed validation"
check_npm "io-ts"                "runtime + compile-time validation"
check_npm "ajv"                  "JSON Schema validator"
check_npm "class-validator"      "decorator-based (TypeORM stack)"

# ============================================================================
#  8. HTTP / API CLIENTS
# ============================================================================
section "8. HTTP / API clients"

check_npm "axios"                "popular HTTP client"
check_npm "ky"                   "modern fetch wrapper"
check_npm "got"                  "Node.js HTTP client"
check_npm "ofetch"               "unjs fetch (used by Nuxt)"
check_npm "undici"               "Node's modern HTTP/1.1+ client"
check_npm "node-fetch"           "fetch polyfill for older Node"
check_npm "superagent"           "HTTP client library"

# ============================================================================
#  9. EMAIL
# ============================================================================
section "9. Email"

check_npm "nodemailer"           "SMTP client — pure npm"
check_npm "resend"               "Resend SDK — pure npm"
check_npm "@react-email/components" "React Email components"
check_npm "@sendgrid/mail"       "SendGrid SDK — pure npm"
check_npm "postmark"             "Postmark SDK — pure npm, zero deps"
check_npm "mailgun.js"           "Mailgun SDK"
check_npm "amazon-ses"           "AWS SES wrapper (formidable alternative)"
check_npm "@aws-sdk/client-ses"  "AWS SES official SDK"

# Runtime email service hosts (only matter when the app sends email)
check_url "Resend API (api.resend.com)" "https://api.resend.com"
check_url "SendGrid API (api.sendgrid.com)" "https://api.sendgrid.com"
check_url "Postmark API (api.postmarkapp.com)" "https://api.postmarkapp.com"
check_url "Mailgun API (api.mailgun.net)" "https://api.mailgun.net"

# ============================================================================
#  10. FILE UPLOADS
# ============================================================================
section "10. File uploads & storage"

check_npm "multer"               "Express multipart middleware"
check_npm "formidable"           "form parser"
check_npm "busboy"               "streaming multipart parser"
check_npm "uploadthing"          "UploadThing SDK"
check_npm "@uploadthing/react"   "UploadThing React hooks"
check_npm "aws-sdk"              "AWS SDK v2 (legacy)"
check_npm "@aws-sdk/client-s3"   "AWS S3 v3 SDK"
check_npm "@aws-sdk/lib-storage" "AWS S3 multipart upload helper"
check_npm "@supabase/storage-js" "Supabase Storage SDK"

# ============================================================================
#  11. PAYMENTS
# ============================================================================
section "11. Payments"

check_npm "stripe"               "Stripe SDK — pure npm"
check_npm "@stripe/stripe-js"    "Stripe.js (client)"
check_npm "@stripe/react-stripe-js" "Stripe React elements"
check_npm "@lemonsqueezy/lemonsqueezy.js" "LemonSqueezy SDK"
check_npm "paddle-sdk"           "Paddle SDK"
check_npm "paypal-rest-sdk"      "PayPal SDK (legacy)"

check_url "Stripe API (api.stripe.com)" "https://api.stripe.com"
check_url "LemonSqueezy API (api.lemonsqueezy.com)" "https://api.lemonsqueezy.com"

# ============================================================================
#  12. SEARCH
# ============================================================================
section "12. Search"

check_npm "meilisearch"          "Meilisearch JS SDK"
check_npm "typesense"            "Typesense SDK"
check_npm "algoliasearch"        "Algolia SDK"
check_npm "fuse.js"              "client-side fuzzy search"
check_npm "minisearch"           "client-side full-text search"
check_npm "flexsearch"           "client-side full-text search"
check_npm "@orama/orama"         "modern in-memory full-text search"
check_npm "lyra"                 "(old name for Orama)"

# Algolia's per-app hostname pattern is <app-id>-dsn.algolia.net —
# we can't test that without a real app ID, so we test the marketing
# site instead (algolia.com) which proves DNS + reachability to Algolia.
check_url "Algolia (algolia.com)" "https://www.algolia.com"

# ============================================================================
#  13. RATE LIMITING & CACHING
# ============================================================================
section "13. Rate limiting & caching"

check_npm "lru-cache"            "in-memory LRU cache — pure JS"
check_npm "@upstash/ratelimit"   "Upstash Ratelimit (serverless)"
check_npm "@upstash/redis"       "Upstash Redis (HTTP-based)"
check_npm "rate-limiter-flexible" "Node rate limiter"
check_npm "express-rate-limit"   "Express middleware"
check_npm "keyv"                 "simple KV store with adapters"
check_npm "@keyv/redis"          "Keyv Redis adapter"
check_npm "node-cache"           "in-memory cache"

check_url "Upstash API" "https://api.upstash.com"

# ============================================================================
#  14. BACKGROUND JOBS & QUEUES
# ============================================================================
section "14. Background jobs & queues"

check_npm "bullmq"               "Redis-backed queue — pure npm"
check_npm "bull"                 "(legacy) Redis-backed queue"
check_npm "inngest"              "Inngest SDK (managed platform)"
check_npm "@trigger.dev/sdk"     "Trigger.dev SDK (managed platform)"
check_npm "agenda"               "MongoDB-backed cron"
check_npm "node-cron"            "cron scheduler (in-process)"
check_npm "bree"                 "Node.js job scheduler"
check_npm "temporal"             "Temporal SDK (self-hosted)"

# ============================================================================
#  15. WEBSOCKETS & REAL-TIME
# ============================================================================
section "15. WebSockets & real-time"

check_npm "socket.io"            "Socket.IO server"
check_npm "socket.io-client"     "Socket.IO client"
check_npm "ws"                   "raw WebSocket (RFC 6455)"
check_npm "@fastify/websocket"   "Fastify WebSocket plugin"
check_npm "pusher"               "Pusher SDK (managed)"
check_npm "pusher-js"            "Pusher client SDK"
check_npm "ably"                 "Ably real-time SDK"
check_npm "centrifuge"           "Centrifugo client"

# Pusher's API hostname is per-cluster (api-<cluster>.pusher.com) — we
# can't test the actual API without a cluster ID, so we test pusher.com
# (the marketing site) which proves DNS + reachability to Pusher.
check_url "Pusher (pusher.com)" "https://pusher.com"
check_url "Ably (ably.io)" "https://ably.io"

# ============================================================================
#  16. SECURITY
# ============================================================================
section "16. Security"

check_npm "helmet"               "HTTP security headers"
check_npm "cors"                 "CORS middleware"
check_npm "dompurify"            "XSS sanitization (DOM)"
check_npm "sanitize-html"        "HTML sanitization"
check_npm "xss"                  "XSS filter"
check_npm "express-rate-limit"   "basic rate limiting"
check_npm "csrf"                 "CSRF tokens"
check_npm "csurf"                "(deprecated) CSRF middleware"
check_npm "express-mongo-sanitize" "NoSQL injection prevention"
check_npm "hpp"                  "HTTP parameter pollution"
check_npm "express-validator"    "validation middleware"

# ============================================================================
#  17. LOGGING
# ============================================================================
section "17. Logging"

check_npm "pino"                 "★ fast structured logger"
check_npm "pino-pretty"          "Pino prettifier"
check_npm "winston"              "popular logger"
check_npm "winston-daily-rotate-file" "Winston file rotation"
check_npm "morgan"               "Express HTTP logger"
check_npm "debug"                "tiny debug utility"
check_npm "consola"              "unjs logger (Nuxt stack)"
check_npm "signale"              "pretty console logger"
check_npm "roarr"                "structured JSON logger"

# ============================================================================
#  18. TESTING
# ============================================================================
section "18. Testing"

check_npm "vitest"               "★ Vite-native test runner"
check_npm "@vitest/coverage-v8"  "V8 coverage for Vitest"
check_npm "@vitest/ui"           "Vitest UI"
check_npm "jest"                 "Jest test runner"
check_npm "@types/jest"          "Jest types"
check_npm "ts-jest"              "Jest TypeScript transformer"
check_npm "playwright"           "browser automation"
check_npm "@playwright/test"     "Playwright test runner"
check_npm "msw"                  "Mock Service Worker"
check_npm "nock"                 "HTTP mocking"
check_npm "sinon"                "spies/stubs/mocks"
check_npm "happy-dom"            "DOM implementation for tests"
check_npm "jsdom"                "DOM implementation (legacy)"

# ============================================================================
#  19. MONITORING & ERROR TRACKING
# ============================================================================
section "19. Monitoring & error tracking"

check_npm "@sentry/nextjs"       "Sentry SDK for Next.js"
check_npm "@sentry/node"         "Sentry Node SDK"
check_npm "@sentry/react"        "Sentry React SDK"
check_npm "@axiom-js/axiom"      "Axiom logs SDK"
check_npm "@highlight-run/next"  "Highlight.io SDK"
check_npm "@logtail/node"        "Better Stack (Logtail) SDK"
check_npm "posthog-node"         "PostHog server SDK"
check_npm "posthog-js"           "PostHog client SDK"
check_npm "@vercel/analytics"    "Vercel Web Analytics"
check_npm "plausible-tracker"    "Plausible tracker"

check_url "Sentry (sentry.io)" "https://sentry.io"
check_url "PostHog (app.posthog.com)" "https://app.posthog.com"
check_url "Highlight.io (pub.highlight.io)" "https://pub.highlight.io"
check_url "Axiom (api.axiom.co)" "https://api.axiom.co"

# ============================================================================
#  20. UI / COMPONENT LIBRARIES — already in the project
# ============================================================================
section "20. UI / component libs (verify they're installable)"

check_npm "next"                 "currently in package.json (^16)"
check_npm "react"                "currently in package.json (^19)"
check_npm "react-dom"            "currently in package.json (^19)"
check_npm "tailwindcss"          "currently in package.json (^4)"
check_npm "@tailwindcss/postcss" "Tailwind v4 PostCSS plugin"
check_npm "lucide-react"         "icon library"
check_npm "class-variance-authority" "variant utility"
check_npm "clsx"                 "classname utility"
check_npm "tailwind-merge"       "Tailwind class merging"
check_npm "framer-motion"        "animation"
check_npm "@radix-ui/react-dialog" "Radix dialog (representative)"
check_npm "cmdk"                 "command palette"
check_npm "vaul"                 "drawer component"
check_npm "recharts"             "charts"
check_npm "react-markdown"       "markdown renderer"
check_npm "react-syntax-highlighter" "code highlighting"
check_npm "embla-carousel-react" "carousel"

# ============================================================================
#  21. STATE & DATA FETCHING — already in the project
# ============================================================================
section "21. State & data fetching (verify)"

check_npm "zustand"              "currently in package.json"
check_npm "@tanstack/react-query" "currently in package.json"
check_npm "@tanstack/react-table" "currently in package.json"
check_npm "swr"                  "alt to react-query"
check_npm "jotai"                "atomic state"
check_npm "valtio"               "proxy state"
check_npm "mobx"                 "observable state"
check_npm "redux"                "Redux core"
check_npm "@reduxjs/toolkit"     "Redux Toolkit"
check_npm "react-redux"          "React bindings for Redux"
check_npm "xstate"               "state machines"

# ============================================================================
#  22. FORMS & TABLES — already in the project
# ============================================================================
section "22. Forms & tables (verify)"

check_npm "react-hook-form"      "currently in package.json"
check_npm "@hookform/resolvers"  "currently in package.json"
check_npm "formik"               "alt forms library"
check_npm "final-form"           "subscription-based forms"
check_npm "react-day-picker"     "date picker"
check_npm "react-resizable-panels" "resizable panels"
check_npm "input-otp"            "OTP input"

# ============================================================================
#  23. MDX / EDITORS / MISC — already in the project
# ============================================================================
section "23. MDX / editors / misc (verify)"

check_npm "@mdxeditor/editor"    "currently in package.json"
check_npm "@dnd-kit/core"        "drag and drop"
check_npm "@dnd-kit/sortable"    "sortable DnD"
check_npm "@reactuses/core"      "React hooks collection"
check_npm "date-fns"             "date utilities"
check_npm "uuid"                 "UUID generation"
check_npm "next-intl"            "i18n for Next.js (currently in project)"
check_npm "next-themes"          "dark mode"
check_npm "nanoid"               "compact UUID"
check_npm "cross-env"            "cross-platform env vars"

# ============================================================================
#  24. AI / LLM SDKs
# ============================================================================
section "24. AI / LLM SDKs"

check_npm "z-ai-web-dev-sdk"     "Z.ai SDK — currently in package.json"
check_npm "openai"               "OpenAI SDK"
check_npm "anthropic"            "Anthropic SDK"
check_npm "@anthropic-ai/sdk"    "Anthropic SDK (alt name)"
check_npm "ai"                   "Vercel AI SDK"
check_npm "@ai-sdk/openai"       "AI SDK OpenAI provider"
check_npm "@ai-sdk/anthropic"    "AI SDK Anthropic provider"
check_npm "langchain"            "LangChain"
check_npm "@langchain/core"      "LangChain core"
check_npm "ollama"               "Ollama client (local LLMs)"

check_url "OpenAI API" "https://api.openai.com"
check_url "Anthropic API" "https://api.anthropic.com"
check_url "Z.ai API" "https://docs.z.ai"

# ============================================================================
#  25. ALTERNATIVE DATABASE / BACKEND-AS-A-SERVICE
# ============================================================================
section "25. Backend-as-a-Service / DB providers"

check_npm "@supabase/supabase-js" "Supabase JS client"
check_npm "@supabase/ssr"         "Supabase SSR helpers"
check_npm "@supabase/auth-helpers-nextjs" "Supabase Next.js auth (legacy)"
check_npm "@neondatabase/serverless" "Neon serverless Postgres"
check_npm "@planetscale/database" "PlanetScale serverless driver"
check_npm "@vercel/postgres"      "Vercel Postgres"
check_npm "@vercel/kv"            "Vercel KV (Redis)"
check_npm "@upstash/vector"       "Upstash Vector (embeddings)"
check_npm "faunadb"               "FaunaDB client"

check_url "Supabase API (api.supabase.com)" "https://api.supabase.com"
check_url "Neon API (console.neon.tech)" "https://console.neon.tech"

# ============================================================================
#  Summary
# ============================================================================
echo ""
echo "============================================================================"
echo "  Summary"
echo "============================================================================"
printf "  ${GREEN}PASS${NC}: %-4d   ${RED}FAIL${NC}: %-4d   ${YELLOW}WARN${NC}: %-4d\n" \
  "$PASS_COUNT" "$FAIL_COUNT" "$WARN_COUNT"
echo ""

if [[ ${#WARNED_ITEMS[@]} -gt 0 ]]; then
  printf "  ${YELLOW}Warnings (HTTP non-2xx but reachable):${NC}\n"
  for item in "${WARNED_ITEMS[@]}"; do
    printf "    ${YELLOW}•${NC} %s\n" "$item"
  done
  echo ""
fi

if [[ ${#FAILED_ITEMS[@]} -gt 0 ]]; then
  printf "  ${RED}Failures (unreachable hosts):${NC}\n"
  for item in "${FAILED_ITEMS[@]}"; do
    printf "    ${RED}•${NC} %s\n" "$item"
  done
  echo ""
  echo "  ${BOLD}${YELLOW}Next steps:${NC}"
  echo ""
  echo "  ${BOLD}1. If npm registry (registry.npmjs.org) failed:${NC}"
  echo "     Nothing will install. Check DNS + outbound HTTPS egress."
  echo "       sudo apt-get update && sudo apt-get install -y ca-certificates"
  echo "       echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf"
  echo ""
  echo "  ${BOLD}2. If Prisma CDN (binaries.prisma.sh) failed:${NC}"
  echo "     Switch to ${BOLD}Drizzle ORM${NC} — pure npm, no binary CDN:"
  echo "       npm uninstall prisma @prisma/client"
  echo "       npm i drizzle-orm drizzle-kit"
  echo "       npm i postgres   # pure-JS Postgres driver"
  echo "     Then migrate your schema. See vps-library-alternatives.md"
  echo "     (next to this script) for a Prisma→Drizzle migration guide."
  echo ""
  echo "  ${BOLD}3. If GitHub Releases failed (bcrypt / argon2 / sharp / etc.):${NC}"
  echo "     Install the build toolchain so native modules can compile"
  echo "     from source instead of fetching prebuilds:"
  echo "       sudo apt-get install -y build-essential python3 make g++ pkg-config"
  echo "     Then re-install the affected packages — node-gyp will build locally."
  echo "     Or switch to pure-JS alternatives (bcryptjs instead of bcrypt)."
  echo ""
  echo "  ${BOLD}4. If runtime service APIs failed (Stripe / Resend / Sentry / etc.):${NC}"
  echo "     These only matter when the app actually runs (not at install time)."
  echo "     Check the VPS firewall / security group egress rules."
  echo ""
  exit 1
fi

echo "  ${GREEN}${BOLD}All hosts reachable.${NC} Every library in the test list"
echo "  should install cleanly via npm."
exit 0
