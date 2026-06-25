# ADR-0012 · Agents under human authority: HITL queue + deterministic orchestration

- **Status:** Accepted
- **Date:** Phase 5
- **Deciders:** G1 Sovereign Authority, G6 Security & Compliance, G4 Academic & Data Standards

## Context
CC-SPEC-001 §5 and §6 are categorical: the 6 native-AI agents are **advisory** and operate **under human
authority** — they never take a consequential action autonomously. The reference implementation has the right
shape (a tool-approval queue, agents flagged high-stakes) but as in-memory/mock seams. Phase 5 must build the
production agent layer so that (a) every side-effecting tool call is human-approved by someone holding the
right governance scope, and (b) the routing that decides "auto vs human" cannot be tricked into letting a
high-risk action through.

## Decision
Three stdlib-only Go modules under `platform/L9-agents/`:

1. **`registry`** — the 6 agent specs (five-part anatomy, high-stakes flag) and an MCP-style tool catalogue.
   Each tool declares a **risk tier** (low/medium/high) and the governance **scope** a human must hold to
   approve it; a high-risk tool cannot be registered without a required scope.

2. **`hitl`** — the role-gated tool-approval queue. An agent's proposed side-effecting call is queued
   `pending`; a human approves only if they **hold the required scope** (a `*` superscope exists for apex
   authorities), at which point the tool executes against its seam; a reject closes it without effect. A
   failed execution leaves the request pending for retry. Every transition (queued / approved / rejected /
   denied / exec-failed) is appended to the tamper-evident audit (L5).

3. **`orchestrator`** — the deterministic run state machine. A proposal AUTO-EXECUTES only when it is
   low-risk, high-confidence, and from a non-high-stakes agent; anything high-risk, high-stakes, or
   low-confidence is routed to the HITL queue as `pending-approval`. The platform's delegated **system
   approver holds only routine scopes** (e.g. `grievance.route`) and never the high-risk ones
   (`fund.release`, `compliance.sign`, `policy.sanction`) — so those tools are structurally guaranteed to
   require a human, regardless of stated confidence.

## Consequences
- Human authority is enforced by construction: a financial/legal/safety action cannot execute without a
  scoped human, and the audit shows exactly who approved what.
- The auto-execute path is narrow and explicit, keeping routine, read-only agent help fast while never
  widening to consequential actions.
- LLM-backed planning (LangGraph + MCP tool-calls) plugs in on the L8 serving gateway once the GPU fleet
  exists (B-011); the orchestration, scoping, and approval semantics are unchanged by which model proposes.
