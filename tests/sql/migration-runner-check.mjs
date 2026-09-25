import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { migrationSql } from '../../scripts/deploy/migration-sql.ts'
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL required: isolated test database only')
const execute = sql => spawnSync('psql', ['--no-psqlrc', url, '-v', 'ON_ERROR_STOP=1', '-qAt'], { input: sql, encoding: 'utf8' })
const payload = 'CREATE TABLE public.pr30_runner (id int); DO $$ BEGIN INSERT INTO public.pr30_runner VALUES (1); END $$;'
const script = migrationSql('test-runner', 'test.sql', payload)
assert.equal(execute(script).status, 0)
assert.equal(execute(script).status, 0)
assert.equal(execute('SELECT count(*) FROM public.pr30_runner;').stdout.trim(), '1')
assert.notEqual(execute(migrationSql('test-runner','test.sql',payload+' SELECT 1;')).status,0)
assert.notEqual(execute(migrationSql('test-rollback','bad.sql','CREATE TABLE public.pr30_rollback (id int); SELECT 1 / 0;')).status,0)
assert.equal(execute("SELECT to_regclass('public.pr30_rollback') IS NULL;").stdout.trim(),'t')
assert.equal(execute("SELECT count(*) FROM public.platform_schema_migrations WHERE id = 'test-rollback';").stdout.trim(),'0')
console.log('PASS: nested dollar bodies, ledger rerun, checksum mismatch and transactional rollback')
