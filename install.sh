#!/usr/bin/env bash
# ============================================================================
#  install.sh — قانون‌یاب (modavanat.ir) bootstrap installer
# ----------------------------------------------------------------------------
#  One-shot, interactive, step-by-step installer. Handles BOTH:
#    • DEV  — your laptop, PGlite file DB, no SSL, `bun run dev`
#    • PROD — fresh Ubuntu VPS, real Postgres, nginx + Let's Encrypt,
#            systemd service running the Next.js standalone build.
#
#  Run directly from GitHub (no need to clone first):
#    curl -fsSL https://raw.githubusercontent.com/Massie382/Modavanat/main/install.sh | bash
#    wget -qO- https://raw.githubusercontent.com/Massie382/Modavanat/main/install.sh | bash
#
#  Or save and inspect first (recommended):
#    curl -fsSL https://raw.githubusercontent.com/Massie382/Modavanat/main/install.sh -o install.sh
#    less install.sh && bash install.sh
#
#  Optional flags:
#    --dev        Force dev mode (skip nginx/SSL/systemd/postfix).
#    --prod       Force prod mode (default if running as root on Linux).
#    --yes        Non-interactive: accept all defaults (good for CI).
#    --dir PATH   Clone target dir.
#                 dev default: ./modavanat
#                 prod default: /var/www/modavanat
#    --branch B   Git branch to clone (default: main).
#    --skip-smtp  Skip Postfix install (prod).
#    --skip-ssl   Skip certbot / SSL setup (prod).
#
#  Exit codes:
#    0  success
#    1  generic failure
#    2  aborted by user (Ctrl-C or answered "no" to a required prompt)
# ============================================================================

set -Eeuo pipefail
shopt -s inherit_errexit 2>/dev/null || true

# ── Globals ───────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/Massie382/Modavanat.git"
REPO_BRANCH="main"
SCRIPT_VERSION="1.0.0"

# Defaults
MODE=""            # dev | prod — auto-detected if empty
ASSUME_YES=0
TARGET_DIR=""
SKIP_SMTP=0
SKIP_SSL=0

# Colors (disabled if not a TTY)
if [[ -t 1 ]]; then
    C_RED='\033[0;31m'; C_GREEN='\033[0;32m'; C_YELLOW='\033[1;33m'
    C_BLUE='\033[0;34m'; C_BOLD='\033[1m'; C_DIM='\033[2m'; C_NC='\033[0m'
else
    C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''; C_BOLD=''; C_DIM=''; C_NC=''
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { printf "${C_BOLD}>>> %s${C_NC}\n" "$*"; }
ok()   { printf "${C_GREEN}✓ %s${C_NC}\n" "$*"; }
warn() { printf "${C_YELLOW}! %s${C_NC}\n" "$*"; }
err()  { printf "${C_RED}✗ %s${C_NC}\n" "$*" >&2; }
die()  { err "$*"; exit 1; }

step() {
    printf "\n${C_BLUE}${C_BOLD}━━━ Step %s: %s ━━━${C_NC}\n" "$1" "$2"
}

ask() {
    # ask "Prompt" "default" -> sets REPLY
    local prompt="$1"; local default="${2:-}"
    if [[ $ASSUME_YES -eq 1 ]]; then
        REPLY="$default"
        printf "${C_DIM}%s [%s] (auto)${C_NC}\n" "$prompt" "$default"
        return
    fi
    if [[ -n "$default" ]]; then
        read -rp "$(printf "${C_BOLD}%s${C_NC} [${C_DIM}%s${C_NC}]: " "$prompt" "$default")" REPLY
        REPLY="${REPLY:-$default}"
    else
        read -rp "$(printf "${C_BOLD}%s${C_NC}: " "$prompt")" REPLY
    fi
}

ask_yn() {
    # ask_yn "Prompt" [default y|n] -> returns 0 if yes, 1 if no
    local prompt="$1"; local default="${2:-y}"
    if [[ $ASSUME_YES -eq 1 ]]; then
        printf "${C_DIM}%s (y/N) auto=%s${C_NC}\n" "$prompt" "$default"
        [[ "$default" == "y" ]]
        return $?
    fi
    local hint="y/N"; [[ "$default" == "y" ]] && hint="Y/n"
    while true; do
        read -rp "$(printf "${C_BOLD}%s${C_NC} [${C_DIM}%s${C_NC}]: " "$prompt" "$hint")" REPLY
        case "${REPLY:-$default}" in
            y|Y|yes|YES) return 0 ;;
            n|N|no|NO)   return 1 ;;
            *) warn "Please answer 'y' or 'n'." ;;
        esac
    done
}

have() { command -v "$1" >/dev/null 2>&1; }

# Trap unexpected errors — print the failing line + filename.
on_err() {
    local errcode=$?
    local lastcmd="${BASH_COMMAND:-unknown}"
    err "Command failed (exit $errcode): $lastcmd"
    err "At line ${BASH_LINENO[0]:-?} of $(basename "${BASH_SOURCE[0]:-install.sh}")"
    if [[ $ASSUME_YES -eq 0 ]]; then
        err "Fix the issue above and re-run. (Or use --yes to skip prompts.)"
    fi
    exit 1
}
trap on_err ERR

# Ctrl-C handler
trap 'warn "Aborted by user."; exit 2' INT TERM

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dev)        MODE="dev";  shift ;;
        --prod)       MODE="prod"; shift ;;
        --yes|-y)     ASSUME_YES=1; shift ;;
        --dir)        TARGET_DIR="$2"; shift 2 ;;
        --dir=*)      TARGET_DIR="${1#--dir=}"; shift ;;
        --branch)     REPO_BRANCH="$2"; shift 2 ;;
        --branch=*)   REPO_BRANCH="${1#--branch=}"; shift ;;
        --skip-smtp)  SKIP_SMTP=1; shift ;;
        --skip-ssl)   SKIP_SSL=1; shift ;;
        --version)     printf "install.sh v%s\n" "$SCRIPT_VERSION"; exit 0 ;;
        -h|--help)
            sed -n '2,/^# =\+/p' "$0" | sed 's/^# \?//'
            exit 0 ;;
        *) err "Unknown flag: $1 (use --help)"; exit 1 ;;
    esac
done

# ── Header ───────────────────────────────────────────────────────────────────
cat <<'BANNER'
  __  __           _    __              ___          
 |  \/  |_   _ ___| |__ \ \ _   _ _ __ / _ \ ___ __ _ 
 | |\/| | | | / __| '_ \ \ \| | | | '__| | | / __/ _` |
 | |  | | |_| \__ \ | | |/ /| |_| | |  | |_| | (_| (_| |
 |_|  |_|\__,_|___/_| |_/_/  \__,_|_|   \___/ \___\__,_|
                       bootstrap installer
BANNER

log "Repo:    $REPO_URL (branch: $REPO_BRANCH)"
log "Script:  v$SCRIPT_VERSION"

# ── Step 1: detect environment ───────────────────────────────────────────────
step 1 "Detect environment"

OS_KERNEL="$(uname -s)"
OS_ARCH="$(uname -m)"
USER_NAME="$(whoami 2>/dev/null || echo "$USER")"

log "OS:      $OS_KERNEL ($OS_ARCH)"
log "User:    $USER_NAME"
log "PWD:     $(pwd)"

# Detect: are we already inside a clone of this repo?
IN_REPO=0
if have git && git rev-parse --show-toplevel >/dev/null 2>&1; then
    REPO_ROOT="$(git rev-parse --show-toplevel)"
    if [[ -f "$REPO_ROOT/package.json" ]] && grep -q '"nextjs_tailwind_shadcn_ts"' "$REPO_ROOT/package.json" 2>/dev/null; then
        IN_REPO=1
        ok "Already inside a clone at: $REPO_ROOT"
    fi
fi

# Pick mode if not forced
if [[ -z "$MODE" ]]; then
    # Default: dev if running on a laptop (non-root, or non-Linux), prod if root on Linux.
    if [[ "$OS_KERNEL" == "Linux" && "$(id -u)" -eq 0 && $IN_REPO -eq 0 ]]; then
        MODE="prod"
    else
        MODE="dev"
    fi
    log "Auto-detected mode: $MODE"
    ask_yn "Use $MODE mode?" "y" || {
        # Flip and ask again
        if [[ "$MODE" == "dev" ]]; then MODE="prod"; else MODE="dev"; fi
        ask_yn "Use $MODE mode instead?" "y" || die "Cannot proceed without choosing a mode."
    }
fi
ok "Mode: $MODE"

# Pick target dir
if [[ -z "$TARGET_DIR" ]]; then
    if [[ $IN_REPO -eq 1 ]]; then
        TARGET_DIR="$REPO_ROOT"
    elif [[ "$MODE" == "prod" ]]; then
        TARGET_DIR="/var/www/modavanat"
    else
        TARGET_DIR="$PWD/modavanat"
    fi
fi
ok "Target dir: $TARGET_DIR"

# ── Step 2: install system packages (Linux only) ──────────────────────────────
if [[ "$OS_KERNEL" == "Linux" ]]; then
    step 2 "Install system packages (apt)"

    APT_PKGS=(git curl ca-certificates build-essential)
    [[ "$MODE" == "prod" ]] && APT_PKGS+=(nginx certbot python3-certbot-nginx postgresql postgresql-contrib)

    if have apt-get; then
        log "Need root for apt. Packages: ${APT_PKGS[*]}"
        if [[ "$(id -u)" -ne 0 ]]; then
            if have sudo; then
                SUDO="sudo"
            else
                die "Run as root, or install sudo and add $USER_NAME to sudoers."
            fi
        else
            SUDO=""
        fi

        if ask_yn "Run apt-get update + install these packages?" "y"; then
            $SUDO apt-get update -y
            $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${APT_PKGS[@]}"
            ok "System packages installed"
        else
            warn "Skipped — assume packages already present"
        fi
    else
        warn "No apt-get on this system. Skipping apt install."
        warn "Make sure these are installed manually: ${APT_PKGS[*]}"
    fi
else
    step 2 "Install system packages (non-Linux — skipped)"
    warn "On $OS_KERNEL, please install git and bun manually if missing."
fi

# ── Step 3: install Bun ──────────────────────────────────────────────────────
step 3 "Install Bun runtime"

if have bun; then
    ok "Bun already installed: $(bun --version)"
else
    log "Bun not found. Will install via bun.sh installer."
    if [[ "$OS_KERNEL" == "Linux" || "$OS_KERNEL" == "Darwin" ]]; then
        if ask_yn "Install Bun now (curl -fsSL https://bun.sh/install | bash)?" "y"; then
            curl -fsSL https://bun.sh/install | bash
            # Load bun into current shell
            export BUN_INSTALL="$HOME/.bun"
            export PATH="$BUN_INSTALL/bin:$PATH"
            if have bun; then
                ok "Bun installed: $(bun --version)"
            else
                die "Bun install claimed success but bun not on PATH. Open a new shell and re-run."
            fi
        else
            die "Bun is required. Install manually from https://bun.sh and re-run."
        fi
    else
        die "Bun is required. Install manually from https://bun.sh and re-run."
    fi
fi

# ── Step 4: clone repo (if not already in one) ───────────────────────────────
step 4 "Get the source code"

if [[ $IN_REPO -eq 1 ]]; then
    ok "Already in a clone — skipping git clone."
    cd "$REPO_ROOT"
    if ask_yn "Pull latest from origin/$REPO_BRANCH?" "y"; then
        git fetch origin "$REPO_BRANCH"
        git reset --hard "origin/$REPO_BRANCH"
        ok "Working tree synced to origin/$REPO_BRANCH"
    fi
else
    if [[ -d "$TARGET_DIR" && -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
        warn "Target dir already exists and is non-empty: $TARGET_DIR"
        if ask_yn "Continue and pull latest inside it?" "y"; then
            cd "$TARGET_DIR"
            if [[ ! -d .git ]]; then
                die "$TARGET_DIR is non-empty but not a git repo. Pick a different --dir."
            fi
            git fetch origin "$REPO_BRANCH"
            git reset --hard "origin/$REPO_BRANCH"
        else
            die "Refused to overwrite. Re-run with --dir /new/path."
        fi
    else
        if [[ "$MODE" == "prod" && "$(id -u)" -ne 0 ]]; then
            # Create /var/www as root, then chown
            sudo mkdir -p "$TARGET_DIR"
            sudo chown -R "$USER_NAME":"$USER_NAME" "$TARGET_DIR"
        else
            mkdir -p "$TARGET_DIR"
        fi
        log "Cloning into $TARGET_DIR…"
        git clone -b "$REPO_BRANCH" "$REPO_URL" "$TARGET_DIR"
        cd "$TARGET_DIR"
        ok "Cloned at: $(pwd)"
    fi
fi

# Verify expected files exist
[[ -f package.json ]]    || die "package.json missing in $(pwd) — wrong repo?"
[[ -f drizzle.config.ts ]] || die "drizzle.config.ts missing — wrong repo?"
[[ -d drizzle ]]         || die "drizzle/ dir missing — migrations not committed?"
ok "Repo contents look right"

# ── Step 5: write .env ───────────────────────────────────────────────────────
step 5 "Generate .env"

ENV_FILE="$TARGET_DIR/.env"
ENV_EXISTS=0
[[ -f "$ENV_FILE" ]] && ENV_EXISTS=1

if [[ $ENV_EXISTS -eq 1 ]]; then
    ok ".env already exists at $ENV_FILE"
    if ! ask_yn "Overwrite .env with new values?" "n"; then
        log "Keeping existing .env."
    else
        ENV_EXISTS=0
    fi
fi

if [[ $ENV_EXISTS -eq 0 ]]; then
    log "Generating fresh .env…"

    # Generate AUTH_SECRET
    AUTH_SECRET="$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)"
    ok "Generated AUTH_SECRET (32 bytes base64)"

    if [[ "$MODE" == "prod" ]]; then
        # ── Postgres DSN ──
        log "Postgres connection:"
        ask "  PG host (default 127.0.0.1)" "127.0.0.1"; PG_HOST="$REPLY"
        ask "  PG port (default 5432)" "5432"; PG_PORT="$REPLY"
        ask "  PG db name (default modavanat)" "modavanat"; PG_DB="$REPLY"
        ask "  PG user (default modavanat)" "modavanat"; PG_USER="$REPLY"
        ask "  PG password (no default — type one)" ""; PG_PW="$REPLY"
        [[ -z "$PG_PW" ]] && die "PG password required for prod mode."
        DATABASE_URL="postgres://${PG_USER}:${PG_PW}@${PG_HOST}:${PG_PORT}/${PG_DB}"

        # ── Domain ──
        log "Public URL:"
        ask "  Domain (default modavanat.ir)" "modavanat.ir"; DOMAIN="$REPLY"
        NEXTAUTH_URL="https://${DOMAIN}"

        # SMTP
        SMTP_URL="smtp://127.0.0.1:25"
        SMTP_FROM="noreply@${DOMAIN}"
    else
        # ── Dev: PGlite ──
        DATABASE_URL="file:${TARGET_DIR}/db/dev.pglite"
        NEXTAUTH_URL="http://localhost:3000"
        SMTP_URL=""
        SMTP_FROM="noreply@localhost"
    fi

    cat > "$ENV_FILE" <<EOF
# Auto-generated by install.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Mode: $MODE

# ── Database ──
# $MODE: ${DATABASE_URL%%:*}
DATABASE_URL=$DATABASE_URL

# ── NextAuth ──
AUTH_SECRET=$AUTH_SECRET
NEXTAUTH_URL=$NEXTAUTH_URL

# ── SMTP (magic-link email; empty = log to stdout instead of sending) ──
SMTP_URL=$SMTP_URL
SMTP_FROM=$SMTP_FROM
EOF
    chmod 600 "$ENV_FILE"
    ok ".env written (mode=$MODE, perms 600)"
    if [[ "$MODE" == "prod" ]]; then
        # Also write .env.production for systemd EnvironmentFile
        cp "$ENV_FILE" "$TARGET_DIR/.env.production"
        chmod 600 "$TARGET_DIR/.env.production"
        ok ".env.production written (for systemd EnvironmentFile)"
    fi
fi

# ── Step 6: bun install ──────────────────────────────────────────────────────
step 6 "Install Node dependencies (bun install)"

# Parse DOMAIN / NEXTAUTH_URL out of .env (for the prod-only steps below
# that need them, regardless of whether .env was just written or kept).
if [[ -f "$ENV_FILE" ]]; then
    NEXTAUTH_URL_FROM_ENV="$(grep -E '^NEXTAUTH_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
    DOMAIN_FROM_ENV="${NEXTAUTH_URL_FROM_ENV#https://}"
    DOMAIN_FROM_ENV="${DOMAIN_FROM_ENV#http://}"
    DOMAIN_FROM_ENV="${DOMAIN_FROM_ENV%%/*}"
    # Strip leading www. for the certbot email; keep DOMAIN canonical
    DOMAIN="${DOMAIN_FROM_ENV:-modavanat.ir}"
    NEXTAUTH_URL="${NEXTAUTH_URL_FROM_ENV:-https://modavanat.ir}"
fi
export DOMAIN NEXTAUTH_URL  # for downstream steps

if [[ "$MODE" == "prod" ]]; then
    log "Installing production deps only…"
    bun install --production
else
    log "Installing dev + prod deps…"
    bun install
fi
ok "Dependencies installed"

# ── Step 7: database setup ───────────────────────────────────────────────────
step 7 "Database setup"

if [[ "$MODE" == "prod" ]]; then
    log "Prod: ensure Postgres DB + user exist."

    # Parse PG_HOST/PORT/DB/USER/PW out of DATABASE_URL in .env
    # (read directly so we don't re-encode anything)
    PG_DSN="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
    PG_PROTO="${PG_DSN%%://*}"
    PG_REST="${PG_DSN#*://}"
    PG_AUTH="${PG_REST%%@*}"
    PG_USER="${PG_AUTH%%:*}"
    PG_PW="${PG_AUTH#*:}"
    PG_HOSTPORT="${PG_REST#*@}"
    PG_HOST="${PG_HOSTPORT%%:*}"
    PG_PORTDB="${PG_HOSTPORT#*:}"
    PG_PORT="${PG_PORTDB%%/*}"
    PG_DB="${PG_PORTDB#*/}"

    if [[ "$(id -u)" -ne 0 ]]; then SUDO="sudo"; else SUDO=""; fi

    if ask_yn "Create Postgres user + database (idempotent)?" "y"; then
        $SUDO -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${PG_USER}') THEN
    CREATE USER ${PG_USER} WITH ENCRYPTED PASSWORD '${PG_PW}';
  ELSE
    ALTER USER ${PG_USER} WITH ENCRYPTED PASSWORD '${PG_PW}';
  END IF;
END \$\$;
SELECT 'CREATE DATABASE ${PG_DB} OWNER ${PG_USER}' WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = '${PG_DB}'
)\gexec
GRANT ALL PRIVILEGES ON DATABASE ${PG_DB} TO ${PG_USER};
SQL
        ok "Postgres user + DB ready"
    else
        warn "Skipped Postgres user/DB creation — assume it already exists."
    fi
else
    log "Dev: PGlite (file DB) — nothing to provision, the app will create db/dev.pglite on first run."
fi

# ── Step 8: apply DB migrations ──────────────────────────────────────────────
step 8 "Apply DB migrations"

# drizzle/*.sql are committed to the repo; db-migrate.ts reads them in.
MIG_COUNT="$(find drizzle -name '*.sql' -type f 2>/dev/null | wc -l | tr -d ' ')"
if [[ "$MIG_COUNT" -eq 0 ]]; then
    warn "No migration SQL files found in drizzle/ — generating from schema…"
    bun run db:generate
fi
log "Applying migrations via scripts/db-migrate.ts…"
bun run db:migrate
ok "DB migrations applied"

# ── Step 9: import sample laws ───────────────────────────────────────────────
step 9 "Import laws"

# Dev has a `db:seed` script that uses src/data/laws.ts (static fallback).
# Prod uses `db:import-laws` with laws-import/*.json files (user-supplied).
SAMPLE_FILE="laws-import/q-madani-1347.sample.json"

if [[ "$MODE" == "prod" ]]; then
    log "Prod: scan laws-import/ for *.json…"
    LAW_FILES=$(find laws-import -maxdepth 1 -name '*.json' -type f 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$LAW_FILES" -gt 0 ]]; then
        ok "Found $LAW_FILES law JSON file(s) in laws-import/"
        if ask_yn "Run scripts/import-laws.ts now?" "y"; then
            # NOTE: call the script directly, not `bun run db:import-laws` —
            # the npm script already appends `laws-import` as argv[1], so
            # any extra arg we passed would shift the import dir.
            bun run scripts/import-laws.ts laws-import/
            ok "Law JSONs imported"
        else
            warn "Skipped — you can run \`bun run db:import-laws\` later."
        fi
    else
        warn "No law JSONs in laws-import/. Drop your *.json files in there and run:"
        warn "  bun run db:import-laws"
    fi
else
    if ask_yn "Run dev seed (bun run db:seed) — populates from src/data/laws.ts?" "y"; then
        bun run db:seed
        ok "Dev DB seeded"
    elif ask_yn "Import the bundled sample law JSON instead?" "n"; then
        bun run scripts/import-laws.ts "$SAMPLE_FILE"
        ok "Sample law imported"
    else
        warn "DB will be empty. You can run \`bun run db:seed\` or \`bun run db:import-laws\` later."
    fi
fi

# ── Step 10: create admin user ───────────────────────────────────────────────
step 10 "Create first admin user"

if ask_yn "Create / update the first admin user now?" "y"; then
    ask "  Admin email" "admin@${DOMAIN:-modavanat.ir}"; ADMIN_EMAIL="$REPLY"
    ask "  Admin name (Persian ok)" "مدیر"; ADMIN_NAME="$REPLY"
    ask "  Admin password (>= 8 chars)" ""; ADMIN_PW="$REPLY"
    [[ ${#ADMIN_PW} -lt 8 ]] && die "Password too short (need >= 8)."
    ask "  Role (admin | super-admin)" "super-admin"; ADMIN_ROLE="$REPLY"

    bun run scripts/create-admin.ts "$ADMIN_EMAIL" "$ADMIN_NAME" --password "$ADMIN_PW" --role "$ADMIN_ROLE"
    ok "Admin user ready: $ADMIN_EMAIL ($ADMIN_ROLE)"
else
    warn "Skipped. Run later: bun run scripts/create-admin.ts <email> <name> --password <pw>"
fi

# ── Step 11: build (prod) or skip (dev) ──────────────────────────────────────
if [[ "$MODE" == "prod" ]]; then
    step 11 "Build Next.js (production standalone)"
    log "Running bun run build… (this takes ~60-120s)"
    bun run build
    ok "Production build complete (.next/standalone/)"
else
    step 11 "Build (dev — skipped)"
    log "Dev mode: no build needed. Use \`bun run dev\` to start the dev server."
fi

# ── Step 12: nginx + SSL (prod only) ─────────────────────────────────────────
if [[ "$MODE" == "prod" ]]; then
    step 12 "nginx + Let's Encrypt SSL"

    if [[ $SKIP_SSL -eq 1 ]]; then
        warn "Skipped (--skip-ssl flag)."
    elif [[ "$(id -u)" -ne 0 ]] && ! have sudo; then
        warn "Need root or sudo for nginx/certbot. Skipping."
    else
        SUDO=""
        [[ "$(id -u)" -ne 0 ]] && SUDO="sudo"

        if ask_yn "Install nginx site config from deploy/nginx/?" "y"; then
            $SUDO cp deploy/nginx/modavanat.ir.conf /etc/nginx/sites-available/
            $SUDO ln -sf /etc/nginx/sites-available/modavanat.ir.conf /etc/nginx/sites-enabled/
            $SUDO rm -f /etc/nginx/sites-enabled/default
            $SUDO mkdir -p /var/www/certbot
            $SUDO nginx -t && $SUDO systemctl reload nginx
            ok "nginx site installed"
        else
            warn "Skipped nginx config — you can do it manually later."
        fi

        if ask_yn "Request Let's Encrypt cert via certbot now? (DNS must already point here)" "y"; then
            DOMAIN_FOR_CERT="${DOMAIN:-modavanat.ir}"
            EMAIL_FOR_CERT="admin@${DOMAIN_FOR_CERT}"
            ask "  Certbot email" "$EMAIL_FOR_CERT"; EMAIL_FOR_CERT="$REPLY"
            $SUDO certbot --nginx -d "$DOMAIN_FOR_CERT" -d "www.$DOMAIN_FOR_CERT" \
                --agree-tos -m "$EMAIL_FOR_CERT" --redirect --non-interactive
            ok "SSL cert installed + auto-renewal scheduled"
        else
            warn "Skipped certbot. Get a cert manually:"
            warn "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        fi
    fi
else
    step 12 "nginx + SSL (dev — skipped)"
fi

# ── Step 13: systemd service (prod only) ─────────────────────────────────────
if [[ "$MODE" == "prod" ]]; then
    step 13 "Install systemd service"

    if [[ "$(id -u)" -ne 0 ]] && ! have sudo; then
        warn "Need root or sudo for systemd unit. Skipping."
    else
        SUDO=""
        [[ "$(id -u)" -ne 0 ]] && SUDO="sudo"

        # Resolve the bun binary path for ExecStart
        BUN_BIN="$(command -v bun)"
        [[ -z "$BUN_BIN" ]] && BUN_BIN="$HOME/.bun/bin/bun"

        if ask_yn "Install + enable modavanat.service systemd unit?" "y"; then
            $SUDO tee /etc/systemd/system/modavanat.service >/dev/null <<UNIT
[Unit]
Description=modavanat.ir Next.js server
After=network.target postgresql.service

[Service]
Type=simple
User=${USER_NAME}
WorkingDirectory=${TARGET_DIR}
EnvironmentFile=${TARGET_DIR}/.env.production
ExecStart=${BUN_BIN} ${TARGET_DIR}/.next/standalone/server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
            $SUDO systemctl daemon-reload
            $SUDO systemctl enable --now modavanat
            sleep 2
            $SUDO systemctl status modavanat --no-pager || warn "Service failed to start — check: journalctl -u modavanat -e"
            ok "modavanat.service installed + started"
        else
            warn "Skipped systemd. Start manually: bun run start"
        fi
    fi
else
    step 13 "systemd (dev — skipped)"
fi

# ── Step 14: local SMTP (prod only) ───────────────────────────────────────────
if [[ "$MODE" == "prod" ]]; then
    step 14 "Local SMTP (Postfix)"

    if [[ $SKIP_SMTP -eq 1 ]]; then
        warn "Skipped (--skip-smtp flag)."
    elif [[ "$(id -u)" -ne 0 ]] && ! have sudo; then
        warn "Need root or sudo for postfix. Skipping."
    elif ask_yn "Install Postfix (for magic-link email)?" "y"; then
        SUDO=""
        [[ "$(id -u)" -ne 0 ]] && SUDO="sudo"
        # Pre-seed debconf to avoid the interactive TUI
        echo "postfix postfix/mailname string ${DOMAIN:-modavanat.ir}" | $SUDO debconf-set-selections
        echo "postfix postfix/main_mailer_type string 'Internet Site'" | $SUDO debconf-set-selections
        $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends postfix
        $SUDO systemctl enable --now postfix
        ok "Postfix installed + started"
        warn "Test: echo 'body' | mail -s 'subject' your@personal.email"
    else
        warn "Skipped Postfix. Magic-link emails will log to stdout instead."
    fi
else
    step 14 "SMTP (dev — skipped)"
fi

# ── Step 15: smoke test ──────────────────────────────────────────────────────
step 15 "Smoke test"

if [[ "$MODE" == "prod" ]]; then
    log "Probing http://127.0.0.1:3000 …"
    sleep 1
    if curl -fsS --max-time 5 -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/; then
        ok "Next.js is responding on :3000"
    else
        warn "Probe failed — service may still be starting. Check:"
        warn "  sudo systemctl status modavanat"
        warn "  sudo journalctl -u modavanat -e"
    fi
    if [[ -n "${DOMAIN:-}" ]]; then
        log "Probing https://${DOMAIN} …"
        if curl -fsS --max-time 8 -o /dev/null -w "HTTP %{http_code}\n" "https://${DOMAIN}/"; then
            ok "Public site is up at https://${DOMAIN}"
        else
            warn "Public probe failed — DNS may not have propagated yet, or certbot didn't run."
        fi
    fi
else
    log "Dev mode: start the dev server with:"
    log "  cd $TARGET_DIR && bun run dev"
    log "Then open: ${NEXTAUTH_URL:-http://localhost:3000}"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
cat <<DONE

${C_GREEN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_NC}
${C_GREEN}${C_BOLD}  ✓  Install complete!${C_NC}
${C_GREEN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_NC}

  Mode:        $MODE
  Directory:   $TARGET_DIR
  Repo:        $REPO_URL
  Branch:      $REPO_BRANCH
  Env file:    $ENV_FILE
  Database:    ${DATABASE_URL:-file:dev (PGlite)}

DONE

if [[ "$MODE" == "prod" ]]; then
    cat <<DONE
  Next steps:
    • Visit https://${DOMAIN:-modavanat.ir}/ in your browser.
    • Admin panel:  https://${DOMAIN:-modavanat.ir}/admin
    • Logs:         sudo journalctl -u modavanat -f
    • Restart:      sudo systemctl restart modavanat
    • Update later:
        cd $TARGET_DIR && git pull && bun install --production && \\
        bun run build && bun run db:migrate && \\
        sudo systemctl restart modavanat

DONE
else
    cat <<DONE
  Next steps:
    • Start the dev server:  cd $TARGET_DIR && bun run dev
    • Open:                  http://localhost:3000
    • Admin panel:           http://localhost:3000/admin
    • Edit .env if you need to switch to a real Postgres later.

DONE
fi

log "Done. — install.sh v$SCRIPT_VERSION"
