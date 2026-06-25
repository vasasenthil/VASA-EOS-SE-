# Policy Plane — Rego / OPA (CC-SPEC-001 §8, §20)

Every access decision and every regulatory check is **Rego**, not embedded business logic (§2.9, ADR-0003).
Bundles are signed (Cosign), served by an OPA bundle service, and pulled by every PEP (§8.6): Kong API
gateway, Istio mesh, application middleware, PostgreSQL RLS, MinIO, Kafka.

```
policies/
├── access/      rbac · rebac · abac · pbac        # §8.2–8.5
├── regulatory/  rte · dpdp · rpwd · pocso · pfms_gfr  # §3.1 as code
├── data/        classification · residency · retention  # §18.3
├── ai/          safety · bias · drift             # §17.6
├── decision.rego  # composed: deny-wins → require-approval → permit (§8 sequence)
└── tests/       # + *_test.rego beside each bundle (opa test format)
```

## Status & execution
The access + regulatory bundles and their `*_test.rego` are **authored and complete** (ported from the
reference TS policy engine, which acts as the oracle). They are written in valid `rego.v1` and `opa test`
format. **Execution is gated**: the OPA/Conftest binary cannot be fetched in the build environment
(`BLOCKERS.md` B-023). Run locally / in a CI that has OPA:

```
opa test policies/ -v          # unit tests
opa fmt --list policies/       # format check
conftest verify -p policies/   # policy verification
```

100% policy test coverage is mandatory before Phase 1 (§20).
