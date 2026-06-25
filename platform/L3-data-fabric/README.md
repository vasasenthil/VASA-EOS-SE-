# L3 · Data Fabric

**CC-SPEC-001 layer · Phase-2 status: `oltp-core-built` (cluster-gated)**

Polyglot persistence (Citus/Cockroach/Cassandra/ClickHouse/Neo4j/Redis/MinIO/Iceberg/Milvus).

| Component | Status | Verification |
|---|---|---|
| `dataplane` — classification → store/region routing → retention, residency fail-closed (ADR-0009) | ✅ built + tested | `go test` + policy-parity vs OPA |
| `schema/citus/001_core_oltp.sql` — tenant-sharded OLTP core, `FORCE` RLS, append-only audit | ✅ built + validated | applied to PG 16; RLS isolation proven |
| `schema/citus/002_distribution.sql` — Citus distribution calls | ✅ authored | CI vs Citus image (B-013) |
| ClickHouse · Cassandra · MinIO/Iceberg · Neo4j · Milvus · Redis | ⛔ cluster-gated | routed-to by `dataplane`; B-013 |

> The OLTP **core** is built and validated against real PostgreSQL 16 (RLS tenant-isolation + append-only
> audit proven as a non-superuser role). Distribution and the remaining stores need the cluster. Gated per
> `PHASE-2-PLAN.md` / Section 24; nothing live until its phase passes the Section 25 Definition of Done.
