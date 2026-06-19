import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

// Go-live kit: scripts/bootstrap.sql is the single consolidated provisioning file an operator runs in
// the Supabase/Postgres SQL editor. This test keeps it HONEST: it must stay in sync with the migration
// set (no drift), be transaction-wrapped, and carry every migration's content. It is verified to
// actually provision the whole schema (131/131 tables with RLS) on a Supabase-shaped PostgreSQL 16.

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts")

function migrationFiles(): string[] {
  return readdirSync(scriptsDir).filter((f) => /^\d{3}.*\.sql$/.test(f)).sort()
}

function expectedBootstrap(): string {
  const files = migrationFiles()
  const header = [
    "-- VASA-EOS(SE) TN — CONSOLIDATED PROVISIONING BOOTSTRAP (generated; do not edit by hand).",
    "--",
    "-- Run this ONCE in your Supabase / Postgres SQL editor to provision the entire schema: all tables,",
    "-- indexes and deny-by-default row-level security. Idempotent — safe to re-run.",
    `-- Generated from ${files.length} migrations. Regenerate with: node scripts/build-bootstrap.mjs`,
    "--",
    "-- After this runs, set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and the app goes live.",
    "",
    "begin;",
    "",
  ]
  const body = files.map((f) => `-- ==== ${f} ====\n${readFileSync(join(scriptsDir, f), "utf8").trim()}\n`)
  return `${header.join("\n")}\n${body.join("\n")}\ncommit;\n`
}

test("bootstrap.sql is in sync with the migration set (no drift) — run build-bootstrap.mjs after adding a migration", () => {
  const committed = readFileSync(join(scriptsDir, "bootstrap.sql"), "utf8")
  assert.equal(committed, expectedBootstrap(), "scripts/bootstrap.sql is stale; regenerate with: node scripts/build-bootstrap.mjs")
})

test("bootstrap is transaction-wrapped and includes every migration", () => {
  const sql = readFileSync(join(scriptsDir, "bootstrap.sql"), "utf8")
  assert.match(sql, /^-- VASA-EOS\(SE\) TN — CONSOLIDATED PROVISIONING BOOTSTRAP/)
  assert.ok(sql.includes("\nbegin;\n") && sql.trimEnd().endsWith("commit;"), "must be wrapped in begin/commit")
  const headers = (sql.match(/^-- ==== /gm) ?? []).length
  assert.equal(headers, migrationFiles().length, "every migration must appear once")
  // the go-live guarantees: blanket RLS + the users identity table the app binds to
  assert.match(sql, /from pg_tables\s+where schemaname = 'public'/) // 079 blanket RLS
  assert.match(sql, /create table if not exists public\.users/) // 013 corrected identity table
})
