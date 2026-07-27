# VASA-EOS-SE-TN Production Infrastructure Hardening

## Migrations
Run `npm run migrate` with `DATABASE_URL` or `SUPABASE_DB_URL` set. The runner applies `migrations/manifest.json` in dependency order and records completed entries in `public.schema_migrations`. Use `npm run migrate:status` to print the manifest order before deployment.

## Atomic outbox RPCs
Domain writes that must publish events use Postgres RPCs in `lib/events/rpc/`. PostgreSQL executes each function call atomically, so a domain insert/update and its `platform_outbox` inserts commit or roll back together. Critical functions include `scholarship_file_with_outbox`, `tc_file_with_outbox`, and `scheme_propose_with_outbox`.

## Workers
Worker classes live in `lib/workers/`. `WorkerBase` provides graceful shutdown, heartbeat updates, structured JSON logs, and metric hooks. The outbox worker processes pending events and moves poison events to dead letters after the configured retry threshold. The SLA worker emits timeout events for breached workflow steps.

## Deployment
Build workers with `docker/workers.Dockerfile`. Local development can start workers through `docker-compose -f docker-compose.workers.yml up`. Kubernetes manifests under `infra/workers/` deploy two outbox dispatcher replicas and one SLA monitor replica using the `vasa-worker` service account.

## Monitoring
Prometheus metrics are exposed by `GET /metrics`. Worker health is available at `GET /workers/outbox-dispatcher/health` and `GET /workers/sla-monitor/health`. Logs are JSON records with timestamps, worker names, and correlation IDs.

## Dead letters
Poison outbox messages move to `platform_outbox_dead_letters`. Operators can list open events with `GET /api/admin/dead-letters`, retry with `POST /api/admin/dead-letters/{id}/retry`, or discard with `POST /api/admin/dead-letters/{id}/discard`. The UI at `/admin/dead-letters` summarizes open failures and action endpoints.

## Authorization
Scheme and admin APIs use session/JWT based role checks from `lib/auth`. Requests without a valid Supabase-compatible Bearer JWT or authenticated Supabase cookie receive `401`; authenticated users lacking required VASA roles receive `403`. Tenant context is derived from user/app metadata fields such as `school_id`, `block_id`, and `district_id`.

## Troubleshooting
- Migration fails: verify `DATABASE_URL`, ensure `psql` is installed, and rerun `npm run migrate` after resolving the reported SQL error.
- Worker health is unhealthy: check `/metrics`, worker logs, and the `worker_heartbeats`/health output for stale heartbeat timestamps.
- Dead letters are growing: inspect the error, fix the handler/schema issue, then retry from the admin endpoint.
- API returns 401/403: verify the JWT includes a `sub` claim and `app_metadata.roles` or equivalent VASA role metadata.
