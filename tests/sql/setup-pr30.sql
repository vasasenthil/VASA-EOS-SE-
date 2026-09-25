CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
\ir ../../lib/events/outbox-schema.sql
\ir ../../lib/events/rpc/dead_letters.sql
\ir ../../lib/events/rpc/insert_with_outbox.sql
\ir ../../lib/events/rpc/update_with_outbox.sql
\ir ../../lib/events/rpc/generic_atomic.sql
\ir ../../lib/events/rpc/scholarship_file_with_outbox.sql
\ir ../../lib/events/rpc/tc_file_with_outbox.sql
\ir ../../lib/events/rpc/scheme_propose_with_outbox.sql
\ir ../../lib/ml/schema.sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
\ir ../../migrations/014_pr30_security_access.sql
\ir ../../migrations/015_pr30_outbox_retry.sql
\ir pr30-access-retry.sql
