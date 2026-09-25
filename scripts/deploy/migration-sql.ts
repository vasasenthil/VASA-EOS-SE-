import { createHash } from "node:crypto"

const quote = (value: string) => value.replace(/'/g, "''")
export function migrationChecksum(sql: string): string {
  return `sha256:${createHash("sha256").update(sql).digest("hex")}`
}
function legacyChecksum(sql: string): string {
  let hash = 0
  for (let i = 0; i < sql.length; i++) hash = (Math.imul(31, hash) + sql.charCodeAt(i)) | 0
  return `sha32:${(hash >>> 0).toString(16).padStart(8, "0")}`
}

// psql executes the migration at SQL top level; nested dollar-quoted function
// bodies never become part of a surrounding DO string. Lock and ledger share
// the migration transaction. The runner must use ON_ERROR_STOP=1.
export function migrationSql(id: string, path: string, sql: string): string {
  const checksum = migrationChecksum(sql)
  return `
BEGIN;
SELECT pg_advisory_xact_lock(730030);
CREATE TABLE IF NOT EXISTS public.platform_schema_migrations (
  id text PRIMARY KEY, path text NOT NULL, checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SELECT EXISTS (SELECT 1 FROM public.platform_schema_migrations WHERE id = '${quote(id)}') AS already_applied
\\gset
\\if :already_applied
SELECT EXISTS (SELECT 1 FROM public.platform_schema_migrations
  WHERE id = '${quote(id)}' AND path = '${quote(path)}'
    AND checksum IN ('${checksum}', '${legacyChecksum(sql)}')) AS checksum_matches
\\gset
\\if :checksum_matches
\\else
\\echo Migration checksum/path mismatch; refusing to continue
\\quit 1
\\endif
\\else
${sql}
INSERT INTO public.platform_schema_migrations (id, path, checksum)
VALUES ('${quote(id)}', '${quote(path)}', '${checksum}');
\\endif
COMMIT;
`
}
