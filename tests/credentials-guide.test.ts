import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"

const guide = readFileSync("docs/setup/credentials-guide.md", "utf8")

const requiredSections = [
  "## Overview",
  "## Prerequisites",
  "## 1. Supabase",
  "## 2. PFMS",
  "## 3. DBT/APBS",
  "## 4. APAAR",
  "## 5. DigiLocker",
  "## 6. Bhashini",
  "## 7. NDEAR",
  "## Verification",
] as const

const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PFMS_API_SECRET",
  "APAAR_TIMEOUT_MS",
  "DIGILOCKER_CLIENT_SECRET",
  "BHASHINI_USER_ID",
  "NDEAR_API_KEY",
  "ENABLE_OUTBOX_DISPATCHER_WORKER",
] as const

test("credentials guide includes all setup sections", () => {
  for (const section of requiredSections) assert.ok(guide.includes(section), `${section} missing`)
})

test("credentials guide documents key production variables", () => {
  for (const name of requiredEnvVars) assert.ok(guide.includes(name), `${name} missing`)
})

test("credentials guide includes verification commands", () => {
  assert.ok(guide.includes("npm run validate:env -- --env-file .env.production"))
  assert.ok(guide.includes("npm run migrate"))
  assert.ok(guide.includes("npm run production:cutover"))
})
