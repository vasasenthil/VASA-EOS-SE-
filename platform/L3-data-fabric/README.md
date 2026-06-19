# L3 · Data Fabric

**CC-SPEC-001 layer · Phase-0 status: `partial-reference`**

Polyglot persistence (Citus/Cockroach/Cassandra/ClickHouse/Neo4j/Redis/MinIO/Iceberg/Milvus). A single-Postgres reference schema (110+ tables, RLS, scripts/bootstrap.sql) exists in the reference implementation and is the PORT SOURCE for the Citus OLTP store; the remaining stores are spec-only.

> Phase 0 scaffolds this layer's contract surface and acceptance criteria only. The implementation is
> gated to its phase in `PHASE-0-PLAN.md` / Section 24, and depends on the infrastructure listed in
> `BLOCKERS.md`. Nothing here is claimed as built until its phase passes the Section 25 Definition of Done.
