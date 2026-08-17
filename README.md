# قانون‌یاب · Modavanat

A Persian (RTL) legal-reference website built on **Next.js 16 + Drizzle + Postgres/PGlite + NextAuth**. Browse, search, and read Iranian laws with full table-of-contents navigation, amendment tracking, article-level deep-linking, and an admin panel for managing content.

The project ships with a single one-shot installer so you can be up-and-running on a fresh VPS or your laptop in minutes.

---

## Quick install — one-liner

The fastest path. No need to clone the repo first — `install.sh` clones it for you and walks through every step interactively.

### On a fresh VPS (Ubuntu 22.04 / 24.04)

```bash
# As root (or sudo user), in any directory:
curl -fsSL https://raw.githubusercontent.com/Massie382/Modavanat/main/install.sh | bash
```

The script will:

1. Detect that you're root on Linux → switch to **prod mode** (asks you to confirm)
2. Install `git curl nginx certbot postgresql build-essential` via apt
3. Install Bun (the JS runtime we use instead of Node)
4. Clone this repo into `/var/www/modavanat`
5. Generate `.env` and `.env.production` interactively (DB password, domain, etc.)
6. `bun install` production deps
7. Create the Postgres user + database
8. Apply DB migrations (`drizzle/*.sql`)
9. Import law JSONs from `laws-import/` (if present)
10. Create the first admin user (you type the email + password)
11. Build the Next.js standalone bundle
12. Install the nginx site config (with security headers + WS upgrade)
13. Request a Let's Encrypt cert via certbot (DNS must already point at your VPS)
14. Install + start a `modavanat.service` systemd unit (auto-restarts on crash)
15. Install Postfix for local SMTP (magic-link email)
16. Smoke-test `http://127.0.0.1:3000/` and `https://yourdomain/`

Press `y` / `n` at each prompt, or pass `--yes` to accept all defaults (good for re-runs).

### On your laptop (dev)

```bash
# From anywhere on your machine:
curl -fsSL https://raw.githubusercontent.com/Massie382/Modavanat/main/install.sh | bash -- --dev
```

The script will:

1. Detect dev mode (you're not root on Linux, or you're on macOS)
2. Skip apt (or run a no-op on macOS — make sure you have `git` installed via brew/Xcode)
3. Install Bun
4. Clone the repo into `./modavanat` (or your chosen `--dir`)
5. Generate `.env` with `DATABASE_URL=file:./db/dev.pglite` (no real Postgres needed)
6. `bun install` (dev + prod deps)
7. Apply migrations to PGlite (an in-process Postgres, file-backed)
8. Seed the dev DB from `src/data/laws.ts`
9. (Skip admin creation if you want — or create one with a simple email + password)
10. (Skip build — dev mode uses `bun run dev` with HMR)

Then start the dev server and open the URL it prints:

```bash
cd modavanat && bun run dev
# → http://localhost:3000
```

---

## Want to inspect the script first?

Good instinct. Save it, read it, then run it:

```bash
curl -fsSL https://raw.githubusercontent.com/Massie382/Modavanat/main/install.sh -o install.sh
less install.sh           # read it
bash install.sh            # run it when you're ready
```

---

## Flags

| Flag           | Effect                                                              |
| -------------- | ------------------------------------------------------------------ |
| `--dev`        | Force dev mode (skip nginx/SSL/systemd/postfix).                    |
| `--prod`       | Force prod mode (default if root on Linux).                        |
| `--yes` / `-y` | Non-interactive: accept all defaults (good for CI / re-runs).      |
| `--dir PATH`   | Override the clone target dir (default: `/var/www/modavanat` prod, `./modavanat` dev). |
| `--branch B`   | Git branch to clone (default: `main`).                             |
| `--skip-smtp`  | Prod: skip Postfix install.                                        |
| `--skip-ssl`   | Prod: skip certbot / Let's Encrypt.                                |
| `--version`    | Print installer version and exit.                                  |
| `--help` / `-h`| Print the header comment and exit.                                 |

---

## Manual setup (without the installer)

If you'd rather do it by hand, see:

- **`deploy/VPS-DEPLOYMENT.md`** — step-by-step VPS deployment guide (Ubuntu + nginx + Postgres + Let's Encrypt + systemd)
- **`deploy/nginx/modavanat.ir.conf`** — nginx site config (HTTP→HTTPS, WS upgrade, gzip, security headers)
- **`deploy/caddy/Caddyfile`** — alternative Caddy config (auto-SSL, simpler)
- **`scripts/`** — DB migrate, law import, admin creation, seed scripts (each has a header docstring explaining usage)

---

## Project layout

```
.
├── install.sh                  # ← the one-shot installer you just used
├── package.json                 # Bun/Next.js project, db: scripts wired up
├── drizzle.config.ts            # Drizzle Kit config (pglite in dev, pg in prod)
├── drizzle/
│   ├── 0000_burly_morph.sql    # Initial schema migration (committed)
│   └── meta/                    # Drizzle journal snapshots
├── .env.example                 # Template env file
├── deploy/                      # VPS deployment artifacts
│   ├── VPS-DEPLOYMENT.md
│   ├── nginx/modavanat.ir.conf
│   └── caddy/Caddyfile
├── scripts/                     # DB + content management scripts
│   ├── db-migrate.ts            # Applies drizzle/*.sql
│   ├── seed-db.ts               # Dev: seeds from src/data/laws.ts
│   ├── import-laws.ts           # Prod: imports from laws-import/*.json
│   └── create-admin.ts          # Bootstraps the first admin user
├── laws-import/                 # Drop your law JSONs here (gitignored content)
│   └── q-madani-1347.sample.json
├── src/
│   ├── app/                     # Next.js App Router (public, admin, account, api)
│   ├── components/              # Site, law, admin, account UI components
│   ├── db/                      # Drizzle schema + client
│   ├── lib/                     # Auth, queries, diff, types
│   ├── auth.ts / auth.config.ts # NextAuth config
│   └── middleware.ts            # Auth-gated route protection
└── public/                      # Static assets (fonts, logos)
```

---

## Tech stack

| Layer       | Choice                                                | Why                                                                |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| Runtime     | Bun                                                   | Fast install, native .env, native TS, drops 2s off cold start      |
| Framework   | Next.js 16 (App Router, standalone output)            | Server components, streaming, image opt, i18n routing              |
| ORM         | Drizzle (postgres-js driver in prod, pglite in dev)   | Same schema in both modes; zero-binary, no CDN dep                |
| Auth        | NextAuth v5 (credentials + magic-link)               | Server-side session cookies, role-based access                     |
| UI          | Tailwind 4 + shadcn/ui + Radix                        | Headless a11y primitives, RTL support                              |
| DB (prod)   | PostgreSQL 14+                                        | Real FK constraints, JSON columns, full-text search                |
| DB (dev)    | PGlite (in-process Postgres, file-backed)             | Zero install — just `bun install` and go                          |
| Web server  | nginx (default) or Caddy                             | TLS termination, static caching, WS upgrade for Phase 5            |
| TLS         | Let's Encrypt (via certbot or Caddy auto)             | Free, auto-renewing                                                |
| Process     | systemd                                               | Restart-on-failure, boot-time startup                              |
| Email       | Postfix (local)                                       | Magic-link auth emails without a 3rd-party SaaS                   |

---

## Common operations

```bash
# Dev server (HMR, picks up .env automatically)
bun run dev

# Production build (creates .next/standalone/)
bun run build

# Production start (uses the standalone bundle)
bun run start

# Apply DB migrations (after a git pull that adds new migrations)
bun run db:migrate

# Re-generate migrations from the schema (only when you change src/db/schema/*)
bun run db:generate

# Open Drizzle Studio (DB browser at http://localhost:4983)
bun run db:studio

# Import law JSONs (drop files in laws-import/ first)
bun run db:import-laws

# Re-seed dev DB from src/data/laws.ts
bun run db:seed --reset

# Create / update an admin user
bun run create-admin admin@modavanat.ir "نام مدیر" --password 'S3cret!' --role super-admin
```

---

## Update procedure (after a `git pull`)

```bash
cd /var/www/modavanat
git pull
bun install --production
bun run build
bun run db:migrate          # if migrations changed
sudo systemctl restart modavanat
```

Or just re-run the installer in `--yes` mode — it detects the existing clone, pulls latest, and skips anything already done.

---

## License

Private project. See the repository for details.
