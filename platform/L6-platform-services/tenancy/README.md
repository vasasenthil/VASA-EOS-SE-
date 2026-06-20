# tenancy — T0–T6 sovereign multi-tenancy hierarchy

The CC-SPEC-001 / Synthesis-Brief **seven-tier sovereign multi-tenancy** model, made a **first-class Go module**
(previously the Go mesh only carried tenant-ids on records; the hierarchy lived in the TS `lib/tenancy`).

Authority descends strictly:

```
T0 Sovereign  (State of Tamil Nadu — ultimate authority + the off-switch)
└─ T1 Secretariat  (School Education Secretariat)
   └─ T2 Directorate  (7 — DSE · DEE · DGE · DMS · DTERT · DPSE · DNFE)
      └─ T3 District  (38, under DSE's territorial remit)
         └─ T4 Block  (385)
            └─ T5 Cluster  (~3,800)
               └─ T6 School  (~69,000 — UDISE+ leaf)
```

## Guarantees (enforced in code)

- **Strict chain:** `Add` rejects any node whose level isn't exactly one below its parent, any non-T0 node
  without a parent, and any second root. The tree is provably a complete, strictly-descending hierarchy.
- **Downward governance (fail-closed):** `Governs(subject, target)` is true only when the subject *is* the
  target or an **ancestor** of it — never an ancestor-from-below, never a sibling. T0 governs the whole estate;
  a district governs its blocks but not a sibling district. Unknown nodes are never governed.
- **Real anchoring:** `BuildTN(tree)` materialises the hierarchy over the **real estate** (`seed.Directorates`
  + the `population` tree), so the tier counts are the actual §D cardinalities (1·1·7·38·385·3,800·69,000).

## API

```go
tenancy.Tiers()                       // the 7-tier catalogue (T0–T6)
h, _ := tenancy.BuildTN(tree)         // the full ≈73k-node sovereign tree
h.Governs(subjectID, targetID)        // downward-governance jurisdiction check
h.Ancestors(id) / h.Path(id)          // the governance chain T0 → … → node
h.DescendantCount(id) / h.TierCounts()
```

## Surfaced

`integration.Platform` materialises the hierarchy lazily (once, behind a `sync.Once`): `TenancyTiers`,
`TenancySummary`, `TenancyPath`, `Governs`, `TenantNode`. `platformd` serves `GET /tenancy` (summary ·
`?path=ID` · `?governs=A&over=B`).

TN is the sole sovereign tenant today; T0 is anchored so sibling states / a national tier can be added later
without restructuring. Deterministic; stdlib-only. 5 module tests.
