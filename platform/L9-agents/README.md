# L9 · Agents & Orchestration

**CC-SPEC-001 layer · Phase-5 status: `hitl-orchestration-built` (LLM-planning gated)**

6 native-AI agents composing the 6 engines into role-facing recommendations — every one advisory, under human
authority (HITL). LangGraph/MCP orchestration; role-gated tool-approval queues.

| Component | Status | Verification |
|---|---|---|
| `agents` — the **6 agents** (Teacher·Student·Governance·Grievance·Policy·Compliance) composing the L8 engines into advisory recommendations | ✅ built + tested | `go test` |
| `registry` — 6 agent specs + MCP tool catalogue (risk tier + required scope) (ADR-0012) | ✅ built + tested | `go test` |
| `hitl` — role-gated tool-approval queue; approve→execute, reject, audited; scope-gated (ADR-0012) | ✅ built + tested | `go test` |
| `orchestrator` — agent run state machine: auto-execute vs route-to-human (high-risk/high-stakes/low-confidence) | ✅ built + tested | `go test` |
| LLM-backed agent planning (LangGraph + MCP tool-calls on served models) | ⛔ serving-gated | B-011 |

> The HITL **approval queue + orchestration state machine** are authored and tested. The safety invariant —
> high-risk scopes (fund.release / compliance.sign / policy.sanction) are never delegated, so those tools
> ALWAYS require a scoped human — is enforced and tested. LLM-backed planning runs on the L8 serving gateway
> once the GPU fleet exists (B-011). Gated per `PHASE-5-PLAN.md` / Section 24; nothing live until the
> Section 25 Definition of Done passes.
