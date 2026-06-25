# PHASE-5-PLAN · Agents & Orchestration (L9) · CC-SPEC-001 §5, §6, §10.9

**Phase 5 · Days 91–115 · Revision: in-progress**

Phase 5 builds L9: the 6 native-AI agents under human authority, with role-gated approval queues and
deterministic orchestration. LLM-backed planning needs the serving fleet; the HITL queue + orchestration are
built and tested now. **Authored + verified here** is split honestly from what **needs GPUs**.

## Producible + verified in this environment
| # | Deliverable | Verification | Status |
|---|---|---|---|
| 5.1 | `registry` (Go) — 6 agent specs + MCP tool catalogue (risk tier + required scope) | `go test` | ✅ done |
| 5.2 | `hitl` (Go) — role-gated tool-approval queue; approve→execute, reject, audited | `go test` | ✅ done |
| 5.3 | `orchestrator` (Go) — agent run state machine: auto-execute vs route-to-human | `go test` | ✅ done |
| 5.4 | Safety invariant: high-risk scopes never delegated → human always required | asserted by test | ✅ done |
| 5.5 | ADR-0012 (agents HITL + orchestration) | review | ✅ done |

Guarantees proven: a high-risk tool (initiate_dbt / flag_violation / sanction_lever) and any high-stakes agent
(policy, compliance) ALWAYS route to a scoped human regardless of confidence; an approver without the required
scope cannot approve; a rejected/failed action does not execute; every transition is audited; routine low-risk
high-confidence help auto-proceeds.

## Requires the substrate (gated — `BLOCKERS.md`)
- **LLM-backed agent planning** (LangGraph + MCP tool-calls) runs on the L8 serving gateway once the GPU fleet
  exists (B-011). The orchestration, scoping, and approval semantics are model-agnostic and unchanged.
- **Durable queue persistence** lands the requests in the Citus `agent_tool_requests` table (L3) with RLS on
  the cluster (B-013); the in-memory queue here is the same logic.

## Exit / review gate
Phase 6 (Civic, Knowledge graph & Blockchain notary — L7/L11/L12) begins only when: this plan is reviewed;
the serving fleet exists (B-011); the Besu validator network has MoUs (B-020); and Neo4j/Milvus are
provisioned (B-013). **The build stops at this gate after Phase 5's authorable deliverables.**
