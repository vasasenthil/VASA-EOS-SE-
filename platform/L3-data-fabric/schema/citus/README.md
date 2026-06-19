# Citus OLTP core schema (L3 Data Fabric)

The transactional core of the polyglot data fabric (CC-SPEC-001 §18, §10.4). Production port of the
reference implementation's OLTP schema (crosswalk verdict: **PORT**).

| File | Runs on | Validated |
|---|---|---|
| `001_core_oltp.sql` | vanilla PostgreSQL 16 **and** Citus | ✅ applied to PG 16 locally + in CI (`.db-schema`); RLS tenant-isolation + append-only audit proven functionally as a non-superuser role |
| `002_distribution.sql` | Citus cluster only (coordinator + workers) | ⛔ CI against a Citus image — needs the cluster (BLOCKERS B-013) |

## Design
- **Tenant sharding** — every tenant-scoped table carries `tenant_id` and is distributed by it, co-located in
  one colocation group so a tenant's rows live together and joins stay shard-local. Scales horizontally to
  ~69k schools / ~1.27 Cr students.
- **Row-Level Security** — `tenant_isolation` policies fence every read/write to `current_setting(
  'app.current_tenant')`, `FORCE`d so even the table owner is bound. Defence-in-depth beneath the application
  PEP. (Superusers bypass RLS by design — the app connects as a non-superuser role.)
- **Append-only audit** — `audit_log` revokes `UPDATE`/`DELETE`; records are hash-chained by the L5 `audit`
  service and stored sealed (§17.6).
- **PII at rest** — `student.pii_envelope` holds a KMS-sealed blob (envelope encryption, L5 `kms`); raw
  identifiers (APAAR/Aadhaar) are never stored in the clear.

## Other stores (spec-only here)
ClickHouse (OLAP), Cassandra (time-series), MinIO/Iceberg (blobs), Neo4j (graph), Milvus (vectors), Redis
(cache) are routed to by `platform/L3-data-fabric/dataplane` and provisioned with the cluster (B-013).
