// VASA-EOS(SE) TN — consolidated provisioning bootstrap generator.
//
// Concatenates every numbered migration (in order) into a single, idempotent scripts/bootstrap.sql.
// Operators run that ONE file in the Supabase/Postgres SQL editor to provision the entire schema —
// all tables, indexes and deny-by-default RLS — instead of applying 77 files by hand. Re-runnable:
// every statement is `if (not) exists`, so applying it twice is safe.
//
//   regenerate:  node scripts/build-bootstrap.mjs
//   (a test asserts the committed bootstrap.sql stays in sync with the migration set)

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const dir = dirname(fileURLToPath(import.meta.url))
const files = readdirSync(dir)
  .filter((f) => /^\d{3}.*\.sql$/.test(f))
  .sort()

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

const body = files.map((f) => `-- ==== ${f} ====\n${readFileSync(join(dir, f), "utf8").trim()}\n`)

const out = `${header.join("\n")}\n${body.join("\n")}\ncommit;\n`
writeFileSync(join(dir, "bootstrap.sql"), out)
console.log(`bootstrap.sql written: ${files.length} migrations, ${out.length} bytes`)
