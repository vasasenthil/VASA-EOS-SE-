# ADR-0009 · Data fabric: classification/residency routing + Citus tenant-sharded OLTP

- **Status:** Accepted
- **Date:** Phase 2
- **Deciders:** G2 Platform Engineering, G6 Security & Compliance

## Context
CC-SPEC-001 §18 and §10.4 require a polyglot data fabric where every write lands in the right store **and**
the right sovereign region, under data classification, residency, and retention rules — at scale (~69k
schools, ~1.27 Cr students). Phase 0 authored the data rules in Rego (`policies/data/*.rego`); Phase 2 must
build the routing data-plane and the transactional core, without duplicating those rules into business logic
(§2.9, ADR-0005).

## Decision
1. **`platform/L3-data-fabric/dataplane`** (Go) — the hot-path router. For a record it returns the
   classification class (1–4), the target **store** (Citus OLTP / ClickHouse OLAP / Cassandra TS / MinIO blob
   / Neo4j graph / Milvus vector), the **region**, and a retention-erasure verdict. Residency is fail-closed:
   a Class-1/2 record requested outside a TN-sovereign region is denied with no store offered. The
   classification/residency/retention **rules** remain authored once in Rego; a **policy-parity test**
   cross-checks the Go router against the live OPA corpus over a category × region matrix so the two can never
   drift. (That parity test caught a real gap — the policy denied the in-state DR region; the policy was
   widened to all TN-sovereign regions, §10.3.)

2. **`platform/L3-data-fabric/schema/citus`** — the transactional core (port of the reference OLTP schema).
   Every tenant-scoped table carries `tenant_id`, is distributed by it and co-located so a tenant's data
   stays shard-local, and is fenced by `FORCE`d Row-Level Security keyed on `app.current_tenant`. `audit_log`
   is append-only (UPDATE/DELETE revoked); PII is stored only as KMS-sealed envelopes. `001_core_oltp.sql` is
   vanilla-PostgreSQL-valid and was applied to PostgreSQL 16 with the RLS isolation and append-only
   guarantees proven functionally as a non-superuser role; `002_distribution.sql` carries the Citus
   distribution calls (cluster-gated, B-013).

## Consequences
- Data placement is deterministic and sovereign-by-construction; residency cannot be violated by a code path,
  and the router cannot silently diverge from policy.
- The OLTP core scales horizontally and isolates tenants in two independent layers (RLS + the application
  PEP).
- The remaining stores (OLAP/TS/blob/graph/vector) are routed-to here and provisioned with the cluster
  (B-013); `002_distribution.sql` is validated in CI against a Citus image.
