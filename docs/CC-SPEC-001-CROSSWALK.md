# Reference → CC-SPEC-001 Crosswalk

Maps the **working reference implementation** (the Next.js app under `app/`, `lib/`) onto CC-SPEC-001 layers
and modules, with a **port verdict** for each: `PORT` (domain logic is reusable), `RE-AUTHOR` (logic reusable
but must be re-expressed in the spec's technology), or `DROP` (violates a Non-Negotiable; do not port).

This is how Phase 0 guarantees the reference impl's correct domain logic is *not lost* when the production
layers are built — while ensuring its non-compliant scaffolding (demo mode, in-memory store, TS-embedded
access rules) never reaches production (ADR-0005).

## Layer map
| Spec layer | Reference asset | Verdict | Notes |
|---|---|---|---|
| L3 Data Fabric | `scripts/bootstrap.sql`, `lib/persistence`, `lib/*/store.ts` | **PORT** schema → Citus; **RE-AUTHOR** the supabase-js seam → sovereign drivers | 110+ tables + RLS are a strong OLTP port source |
| L4 Integration | `lib/integrations`, `lib/federation` (APAAR/EMIS/PFMS drift) | **PORT** reconciliation logic; **RE-AUTHOR** as resilient adapters w/ contracts | drift detectors are reusable |
| L5 Security | `lib/access/policy`, `lib/policy-engine` | **RE-AUTHOR** → `policies/*.rego` (done in Phase 0); **DROP** the TS PDP for production | logic mirrored into Rego |
| L6 Platform Svc | `lib/workflow`, `lib/audit/trail`, `lib/i18n` | **PORT** workflow state machine, audit chain, i18n | strong reuse |
| L7 Knowledge | `lib/knowledge-graph`, `lib/mcp` | **PORT** ontology + tool registry; **RE-AUTHOR** → Neo4j + Milvus | |
| L8 Engines | `lib/ai/engines` (deterministic) | **RE-AUTHOR** as oracles/baselines; real engines are LLM-served | analogues, not LLMs |
| L9 Agents | `lib/ai/agents`, `lib/agentflow` (HITL queue) | **PORT** HITL approval pattern; **RE-AUTHOR** orchestration → LangGraph+MCP | |
| L10 Surfaces | `app/**` (13 portal roles, ~408 routes) | **PORT** UX + flows; **RE-AUTHOR** → 13 separate Next.js apps + RN/PWA | the app is the UX port source |
| L11 Governance | `lib/governance/{control-tower,architecture-layers,…}` | **PORT** the G1–G7 register + workflow | |
| L12 Civic | `lib/rti`, `lib/grievance`, `app/governance/public-communication` | **PORT** | |

## DROP list (Non-Negotiable violations — never port to production)
- `NEXT_PUBLIC_DEMO_MODE`, the `demo_role` cookie, `lib/demo-auth`, every in-memory store fallback (§2.11, ADR-0005).
- `scripts/dev-supabase-shim.mjs` (a dev-only verification tool, not production).
- Any access rule embedded in TypeScript business logic (§2.9 → moved to Rego).

## Module mapping (sample; full mapping generated with the catalogue linter)
| Spec module | Reference source | Verdict |
|---|---|---|
| M0086 Admission RTE-25% Lottery | `lib/admissionsflow`, `app/admissions` | PORT logic, DROP demo |
| M0241 Governance Workflow G1–G7 | `lib/workflow`, `lib/governance/control-tower` | PORT |
| M0281–M0320 Grievance | `lib/grievanceflow`, `lib/rti` | PORT |
| M0321–M0360 Analytics/Equity | `lib/outcomes`, `lib/outcomes/allocation` | PORT (Quality Index + Opportunity-Gap + equity allocation) |
| M0201–M0240 Scheme/PFMS | `lib/fundledger`, `app/scheme-fund-flow` | PORT logic; RE-AUTHOR PFMS as real adapter |
| Policy plane | `lib/policy-engine` | RE-AUTHOR → `policies/regulatory/*.rego` (done) |
