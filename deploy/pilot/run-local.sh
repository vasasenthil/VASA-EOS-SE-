#!/usr/bin/env bash
# VASA-EOS(SE)-TN — run the FULL STACK locally, wired, with one command (no Docker required).
#
#   deploy/pilot/run-local.sh
#
# Boots, in this order:
#   1. the Go backbone (platformd) against PostgreSQL — self-migrates + seeds PILOT_DISTRICT
#   2. the Next.js app with PLATFORM_URL pointed at the backbone, so every wired module's
#      Add / Edit / Delete / approve button performs a real, persisted operation
#
# Then open  http://localhost:3000  and log in with a demo identity (see below).
#
# Prerequisites: Go 1.22+, Node 20/22 + pnpm, and a reachable PostgreSQL.
# Configure via env (sensible defaults shown):
#   DATABASE_URL    postgres connection string for platformd   (default: postgres://localhost:5432/vasa?sslmode=disable)
#   PILOT_DISTRICT  the district to seed/scope                  (default: TN-DIST-Chennai)
#   WEB_PORT        Next.js port                                (default: 3000)
#   PLATFORMD_PORT  backbone port                               (default: 8080)
set -euo pipefail
cd "$(dirname "$0")/../.."   # repo root

DATABASE_URL="${DATABASE_URL:-postgres://localhost:5432/vasa?sslmode=disable}"
PILOT_DISTRICT="${PILOT_DISTRICT:-TN-DIST-Chennai}"
WEB_PORT="${WEB_PORT:-3000}"
PLATFORMD_PORT="${PLATFORMD_PORT:-8080}"
export DATABASE_URL PILOT_DISTRICT

echo "▶ VASA-EOS(SE)-TN full stack — district=$PILOT_DISTRICT"
echo "  database : $DATABASE_URL"

PIDS=()
cleanup() { echo; echo "▶ stopping…"; for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM

# 1) backbone ----------------------------------------------------------------------------------------------
echo "▶ building platformd…"
( cd platform/integration && go build -o /tmp/vasa-platformd ./cmd/platformd )
echo "▶ starting platformd on :$PLATFORMD_PORT (self-migrates + seeds)…"
PORT="$PLATFORMD_PORT" /tmp/vasa-platformd & PIDS+=("$!")
for i in $(seq 1 30); do
  curl -sf -m2 "http://localhost:$PLATFORMD_PORT/establishment?scope=$PILOT_DISTRICT" >/dev/null 2>&1 && break
  sleep 1
done
echo "  backbone up: http://localhost:$PLATFORMD_PORT"

# 2) web app -----------------------------------------------------------------------------------------------
export PLATFORM_URL="http://localhost:$PLATFORMD_PORT"
export PLATFORM_DEFAULT_ORG="$PILOT_DISTRICT"
export NEXT_PUBLIC_DEMO_MODE="true"   # demo login (no Supabase needed); all data persists via the backbone
export PORT="$WEB_PORT"
if [ ! -d node_modules ]; then echo "▶ installing web deps…"; pnpm install --frozen-lockfile; fi
if [ ! -f .next/BUILD_ID ]; then echo "▶ building the web app (first run)…"; pnpm exec next build; fi
echo "▶ starting the web app on :$WEB_PORT (wired to the backbone)…"
pnpm exec next start -p "$WEB_PORT" & PIDS+=("$!")

cat <<EOF

  ────────────────────────────────────────────────────────────────────────
   ✅  Full stack is up.

   Open    : http://localhost:$WEB_PORT
   Login   : admin@vasa-eos.tn.gov.in   /   Vasa@Edu#2026
   Try     : /establishment  and  /fee-ledger  — every button persists to PostgreSQL
             (e.g. over-appoint a full cadre, or overpay a demand → the backbone rejects it)
   Backbone: http://localhost:$PLATFORMD_PORT   (district = $PILOT_DISTRICT)

   Press Ctrl-C to stop both services.
  ────────────────────────────────────────────────────────────────────────
EOF

wait
