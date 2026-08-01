import { readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { isPostgresUrl, resolveMigrationDatabaseUrl } from "../../lib/db/environment.ts"

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
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-qAt", "-f", sqlFile], { encoding: "utf8" })
  rmSync(tempDir, { recursive: true, force: true })
  if (result.status !== 0) throw new DeployMigrationError(result.stderr || result.stdout || "psql failed")
  return result.stdout.trim()
}

function quote(value: string): string {
  return value.replace(/'/g, "''")
}

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(resolve(process.cwd(), "migrations/manifest.json"), "utf8")) as Manifest
}

function checksum(sql: string): string {
  let hash = 0
  for (let i = 0; i < sql.length; i++) hash = (Math.imul(31, hash) + sql.charCodeAt(i)) | 0
  return `sha32:${(hash >>> 0).toString(16).padStart(8, "0")}`
}

function ledgerSql(): string {
  return `
    create table if not exists platform_schema_migrations (
      id text primary key,
      path text not null,
      checksum text not null,
      applied_at timestamptz not null default now()
    );
  `
}

function migrationSql(id: string, path: string, sql: string): string {
  return `
    do $$
    begin
      if not exists (select 1 from platform_schema_migrations where id = '${quote(id)}') then
        ${sql}
        insert into platform_schema_migrations (id, path, checksum) values ('${quote(id)}', '${quote(path)}', '${quote(checksum(sql))}');
      end if;
    end $$;
  `
}

function main(): void {
  const databaseUrl = resolveMigrationDatabaseUrl()
  if (!databaseUrl) throw new DeployMigrationError("A production PostgreSQL URL is required; Vercel POSTGRES_URL_NON_POOLING is supported")
  if (!isPostgresUrl(databaseUrl)) throw new DeployMigrationError("Production database URL must be a PostgreSQL URI, not an HTTPS project URL")
  const manifest = loadManifest()
  if (!manifest.migrations.length) throw new DeployMigrationError("migrations/manifest.json has no migrations")

  runPsql(databaseUrl, ledgerSql())
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
