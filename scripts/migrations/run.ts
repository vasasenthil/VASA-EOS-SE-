import { spawnSync } from "child_process"
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { isPostgresUrl, resolveMigrationDatabaseUrl } from "../../lib/db/environment"

export interface MigrationEntry { id: string; path: string }
export interface MigrationManifest { migrations: MigrationEntry[] }

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const manifestPath = resolve(root, "migrations/manifest.json")

export function loadManifest(path = manifestPath): MigrationManifest {
  return JSON.parse(readFileSync(path, "utf8")) as MigrationManifest
}

export function validateManifest(manifest: MigrationManifest): void {
  const ids = new Set<string>()
  for (const migration of manifest.migrations) {
    if (ids.has(migration.id)) throw new Error(`duplicate migration id ${migration.id}`)
    ids.add(migration.id)
    if (!existsSync(resolve(root, migration.path))) throw new Error(`migration file missing: ${migration.path}`)
  }
}

function psql(sql: string): string {
  const databaseUrl = resolveMigrationDatabaseUrl()
  if (!databaseUrl) throw new Error("A PostgreSQL migration URL is required (DATABASE_URL, SUPABASE_DB_URL, or Vercel POSTGRES_URL_NON_POOLING)")
  if (!isPostgresUrl(databaseUrl)) throw new Error("Migration database URL must use postgres:// or postgresql:// and include a database name")
  const temp = resolve(root, `.migration-${process.pid}.sql`)
  writeFileSync(temp, sql)
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", temp], { encoding: "utf8" })
  unlinkSync(temp)
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
  return result.stdout
}

export function ensureMigrationTable(): void {
  psql("create table if not exists public.schema_migrations (id text primary key, path text not null, checksum text not null, applied_at timestamptz not null default now());")
}

export function applyMigrations(): void {
  const manifest = loadManifest()
  validateManifest(manifest)
  ensureMigrationTable()
  for (const migration of manifest.migrations) {
    const file = resolve(root, migration.path)
    const body = readFileSync(file, "utf8")
    const sql = `begin;\n${body}\ninsert into public.schema_migrations(id,path,checksum) values ('${migration.id.replace(/'/g, "''")}','${migration.path.replace(/'/g, "''")}', md5($$${body}$$)) on conflict (id) do nothing;\ncommit;`
    psql(sql)
    console.log(JSON.stringify({ level: "info", message: "migration applied", id: migration.id, path: migration.path }))
  }
}

export function showMigrationStatus(): void {
  const manifest = loadManifest()
  validateManifest(manifest)
  const ids = manifest.migrations.map((m) => m.id).join(",")
  console.log(JSON.stringify({ migrations: manifest.migrations.length, ids }))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "status") showMigrationStatus()
  else applyMigrations()
}
