import test from "node:test"
import assert from "node:assert/strict"
import { isPostgresUrl, resolveMigrationDatabaseUrl, resolveSupabaseAnonKey, resolveSupabaseUrl } from "@/lib/db/environment"

test("database environment resolves the Vercel Supabase aliases shown by deployment configuration", () => {
  const env = {
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    POSTGRES_URL_NON_POOLING: "postgresql://user:pass@db.example:5432/vasa?sslmode=require",
    POSTGRES_URL: "postgresql://pooler:pass@pool.example:6543/vasa",
  }
  assert.equal(resolveSupabaseUrl(env), env.SUPABASE_URL)
  assert.equal(resolveSupabaseAnonKey(env), env.SUPABASE_ANON_KEY)
  assert.equal(resolveMigrationDatabaseUrl(env), env.POSTGRES_URL_NON_POOLING)
})

test("canonical migration URL wins and invalid HTTPS project URLs are rejected", () => {
  const env = { DATABASE_URL: "postgres://direct:pass@db.example:5432/vasa", POSTGRES_URL_NON_POOLING: "postgres://fallback:pass@db.example:5432/vasa" }
  assert.equal(resolveMigrationDatabaseUrl(env), env.DATABASE_URL)
  assert.equal(isPostgresUrl(env.DATABASE_URL), true)
  assert.equal(isPostgresUrl("https://project.supabase.co"), false)
})
