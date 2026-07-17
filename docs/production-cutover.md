# Production Cutover Gate

The platform now includes a fail-closed production cutover gate for moving VASA-EOS-SE-TN from demo-ready to production-deployed posture.

Run it before promoting a release:

```bash
npm run production:cutover
```

The gate blocks production when any of the following are not true:

1. Supabase production auth/data plane is configured.
2. Demo credentials are removed.
3. Phase 6 ports are live and configured: PFMS, DBT/APBS, APAAR, DigiLocker and Bhashini.
4. Durable workers are explicitly enabled: `OUTBOX_WORKER_ENABLED=true` and `SLA_MONITOR_WORKER_ENABLED=true`.
5. Outbox, SLA and reconciliation worker heartbeats are fresh: `OUTBOX_WORKER_HEARTBEAT_AT`, `SLA_WORKER_HEARTBEAT_AT` and `RECONCILIATION_WORKER_HEARTBEAT_AT` must be ISO timestamps from the last two minutes.
6. Sovereign runtime dependencies are present: `MIGRATIONS_FULLY_APPLIED=true`, a durable DB accepted by `requireDb()`, `VAULT_ADDR` or a KMS URI, and `AUDIT_SINK_WRITABLE=true`.
7. No `INTEGRATION_*` variable is left as `mock` while `NODE_ENV=production`.

It warns, but does not block, when observability exporters such as `OTEL_EXPORTER_OTLP_ENDPOINT` or `SENTRY_DSN` are absent.

Operators can inspect the same gate through:

```http
GET /api/production/cutover
```

The API is restricted to `SECRETARY`, `DIRECTOR` or `ADMIN` roles for humans. Deployment automation may call the same route with `x-cutover-secret: $CUTOVER_SHARED_SECRET`. The route returns HTTP 503 until all blockers are resolved.
