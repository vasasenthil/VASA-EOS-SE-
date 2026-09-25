import assert from "node:assert/strict"
import test from "node:test"
import { migrationSql, migrationChecksum } from "../scripts/deploy/migration-sql"

test("migration payload remains top-level with dollar-quoted blocks intact", () => {
  const sql = "DO $$ BEGIN PERFORM 1; END $$;\nCREATE FUNCTION public.example() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;"
  const script = migrationSql("id'1", "test.sql", sql)
  assert.ok(script.includes(sql))
  assert.equal(script.match(/DO \$\$/g)?.length, 1)
  assert.ok(script.indexOf("pg_advisory_xact_lock") < script.indexOf("CREATE TABLE"))
  assert.ok(script.indexOf(sql) < script.indexOf("INSERT INTO public.platform_schema_migrations"))
  assert.match(script, /id''1/)
  assert.match(script, /\\quit 1/)
  assert.match(script, /\\if :already_applied/)
  assert.match(script, /COMMIT;/)
})

test("migration checksum detects changed SQL", () => {
  assert.notEqual(migrationChecksum("SELECT 1;"), migrationChecksum("SELECT 2;"))
  assert.match(migrationChecksum("SELECT 1;"), /^sha256:[a-f0-9]{64}$/)
})
