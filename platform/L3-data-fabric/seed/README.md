# seed — DAT-TN-001 seed-data inventory + loader

The minimum complete data set the platform must hold at first boot (DAT-TN-001 §C; CC-SPEC-001 §24 Phase 0/1).
The application is not productive until the seed is in.

## The Seed Rule (enforced)
- **Signed by the authority before load** — `BuildManifest(items, version, signedBy, key)` signs an ed25519
  manifest of per-seed SHA-256 checksums; the loader rejects a bad signature or any checksum mismatch.
- **Loaded once, idempotently, with rollback** — a re-run skips already-loaded seeds; `Rollback(version)`
  removes everything loaded at a seed-version tag.
- **Lineage preserved** — every loaded seed records source · steward · version · checksum · loadedAt, and
  subsequent authorised amendments (`Amend`).
- **Synthetic never mixed with production** — a production `Loader` rejects every `Synthetic` seed (§C.7).
- **Dependency-ordered** — load order resolves `Deps` (e.g. `SEED-OFFICES` after geography + directorates),
  matching the §C.8 phase sequence S0→S4.

## What it seeds (the State's reference master data, real)
- **38 TN districts**, **7 directorates** (DSE/DEE/DGE/DMS/DTERT/DPSE/DNFE), **22 scheduled languages**
  (Tamil first), **21 RPwD-2016 categories**, NEP **5+3+3+4** structure, classes Pre-KG–12, subjects, the
  scheme catalogue (PM-POSHAN, RTE-25%, Pudhumai Penn…), the role catalogue, heads of account, the regulatory
  Rego bundle list, and the governance/scheme/grievance/POCSO workflow stages.
- Counts for the large sets (385 blocks · 3,800 clusters · 69,000 schools) — seeded as counts/generators.
- Phase-4 Native-AI seeds (LLM weights, embeddings, knowledge graph) carry a `Gated` BLOCKERS id — the
  catalogue entry seeds; the real weights/vectors land with the substrate (B-011/B-013).

## Artefacts
- `seed-manifest.yaml` — the committed content-checksum manifest (`go run ./cmd/genmanifest`).
- Wired into the platform: `Platform.SeedStatus()` (productive only when OK), `SeedManifestYAML`,
  `SeedLineage`; `platformd GET /seed`. Live boot: **32 production seeds · 191 records · ok** (5 synthetic
  seeds correctly excluded from production).
