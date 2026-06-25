// VASA-EOS(SE) — post-provision schema verifier.
//
// Run AFTER applying the SQL migrations to a freshly provisioned database to
// confirm the workflow-backed transactional tables actually exist. Exits 0 when
// all are reachable, 1 when any is missing (re-run the migrations), 2 when no
// database is configured.
//
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpm db:verify
//
// Creates its own service-role client (like the seed scripts) so it runs under
// plain `tsx` without the Next.js request runtime.

import { createClient } from "@supabase/supabase-js"
import { verifySchema, WORKFLOW_FLOW_TABLES } from "@/lib/persistence/schema"

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error("✗ No database configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    process.exit(2)
  }

  const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const verification = await verifySchema(db, WORKFLOW_FLOW_TABLES)
  for (const p of verification.probes) {
    console.log(`${p.ok ? "✓" : "✗"} ${p.table}${p.error ? `  — ${p.error}` : ""}`)
  }

  if (verification.ok) {
    console.log(`\n✓ All ${verification.checked} workflow tables reachable — durable persistence is operational.`)
    process.exit(0)
  } else {
    console.error(
      `\n✗ ${verification.missing.length} table(s) missing: ${verification.missing.join(", ")}` +
        `\n  Apply scripts/021-create-workflow-flow-tables.sql (and any earlier missing migrations), then re-run.`,
    )
    process.exit(1)
  }
}

main().catch((e) => {
  console.error("✗ Verification failed:", e instanceof Error ? e.message : String(e))
  process.exit(1)
})
