# BLOCKERS · CC-SPEC-001 · VASA-EOS(SE) TN

Per CC-SPEC-001 §26.7, blockers are logged here and adjacent work continues. These are the dependencies
that **cannot be provisioned from the build environment** and that gate the corresponding phases. None is a
code defect; each is an infrastructure, hardware, organisational, or network-policy dependency that a human
team must satisfy. Honesty posture: *we do not claim a phase done until its real dependency exists.*

## Class A — Sovereign infrastructure (organisational / capital)
| ID | Blocker | Blocks | Needed from |
|---|---|---|---|
| B-001 | **TN State Data Centre (Chennai) + DR (Coimbatore)** physical sovereign hosting | L1, Phase 1, Phase 8 | Govt of TN |
| B-002 | **HSM cluster** (cryptographic root-of-trust, Vault auto-unseal, per-tenant KEK) | L1/L5, §17.4 | Govt of TN procurement |
| B-003 | **Off-switch (M-of-N quorum) + source-code escrow agent** held by T0 | L1, §2.1 | Govt of TN legal+ops |
| B-004 | **Multi-region active-active topology + edge POPs** (Chennai/Coimbatore + 7 PoPs) | L2, §10.3 | sovereign infra |

## Class B — Compute substrate (cloud / cluster / GPU)
| ID | Blocker | Blocks | Needed from |
|---|---|---|---|
| B-010 | **Kubernetes 1.30+ clusters** (3/region, 200+ nodes at scale) + Istio/Vault/ArgoCD/SPIRE | L2, Phases 1–8 | cluster ops |
| B-011 | **GPU fleet** (est. 200–400 H100/H200-class) for vLLM/Triton LLM serving | L8, Phase 4, §10.7 | capital + ops |
| B-012 | **No Docker daemon in this environment** → cannot run any local container stack | dev verification of L2+ | environment policy |
| B-013 | **8 polyglot datastores** (Citus, CockroachDB, Cassandra, ClickHouse, Neo4j, Milvus, MinIO/Iceberg, Redis Cluster) | L3, Phase 2 | cluster ops |

## Class C — External networks / regulated integrations
| ID | Blocker | Blocks | Needed from |
|---|---|---|---|
| B-020 | **Hyperledger Besu validator network** (4–7 nodes incl. CAG/IITM/Anna Univ) | 7.2, Phase 6 | inter-institutional MoUs |
| B-021 | **EMQX/MQTT + physical IoT devices + edge K3s** | 7.1, Phase 6 | hardware deployment |
| B-022 | **Sovereign DPI live credentials/MoUs** — NDEAR-S, APAAR, UDISE+, DIKSHA, PFMS, DigiLocker, DGE | L4, Phase 3 | Govt API access |
| B-023 | **Network egress is policy-restricted** here (supabase.com 403; GitHub release-asset CDN blocked) → cannot fetch the OPA/conftest binary, PostgREST, or run cloud signups | policy execution, live cloud | environment policy |

## Class D — Organisation / governance (human gates the spec mandates)
| ID | Blocker | Blocks | Needed from |
|---|---|---|---|
| B-030 | **Three-reviewer PRs** (domain + security/compliance + accessibility/perf) per §26.6 | every merge | VASA Architecture Board |
| B-031 | **G1–G7 governance bodies + sign-offs** (Cabinet → CAG) | phase gates, §6.1 | constituted bodies |
| B-032 | **1-crore load-test rig** (k6 1 Cr × 1 hr; 2 Cr surge; 72-hr soak; chaos GameDay) | Phase 7 gate, §10.8 | dedicated perf env |
| B-033 | **PwD user-testing cohort** (RPwD coordination) for AAA manual audit | §16.3 | accessibility QA |

## What proceeds despite these
Phase-0 governance, the Section-11 skeleton, the compliance matrix, the module catalogue, the **Rego policy
bundles (authored + unit-tested in `opa test` format)**, the CI templates, and the reference→spec crosswalk —
all producible here — are done. Policy *execution* (B-023) and everything in Classes A–C/D are flagged, not
faked.
