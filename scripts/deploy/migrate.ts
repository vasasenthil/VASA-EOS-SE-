import { readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { isPostgresUrl, resolveMigrationDatabaseUrl } from "../../lib/db/environment.ts"

import { migrationSql } from "./migration-sql.ts"

type Manifest = { migrations: { id: string; path: string }[] }

class DeployMigrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DeployMigrationError"
  }
}

function runPsql(databaseUrl: string, sql: string): string {
  const tempDir = mkdtempSync(join(tmpdir(), "vasa-migrate-"))
  const sqlFile = join(tempDir, "migration.sql")
  writeFileSync(sqlFile, sql)
  const result = spawnSync("psql", ["--no-psqlrc", databaseUrl, "-v", "ON_ERROR_STOP=1", "-qAt", "-f", sqlFile], { encoding: "utf8" })
  rmSync(tempDir, { recursive: true, force: true })
  if (result.status !== 0) throw new DeployMigrationError(result.stderr || result.stdout || "psql failed")
  return result.stdout.trim()
}

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(resolve(process.cwd(), "migrations/manifest.json"), "utf8")) as Manifest
}

function main(): void {
  const databaseUrl = resolveMigrationDatabaseUrl()
  if (!databaseUrl) throw new DeployMigrationError("A production PostgreSQL URL is required; Vercel POSTGRES_URL_NON_POOLING is supported")
  if (!isPostgresUrl(databaseUrl)) throw new DeployMigrationError("Production database URL must be a PostgreSQL URI, not an HTTPS project URL")
  const manifest = loadManifest()
  if (!manifest.migrations.length) throw new DeployMigrationError("migrations/manifest.json has no migrations")

  for (const migration of manifest.migrations) {
    const sql = readFileSync(resolve(process.cwd(), migration.path), "utf8")
    runPsql(databaseUrl, migrationSql(migration.id, migration.path, sql))
    console.log(`VERIFIED ${migration.id} ${migration.path}`)
  }
  const count = Number(runPsql(databaseUrl, "select count(*) from platform_schema_migrations;"))
  if (count < manifest.migrations.length) throw new DeployMigrationError("schema ledger is missing applied migrations")
  console.log(`Sovereign migration complete: ${manifest.migrations.length} migrations verified`)
}

try {
  main()
} catch (error) {
  console.error(error)
  process.exit(1)
}
