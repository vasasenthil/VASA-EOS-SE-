# PHASE-4-PLAN · AI Engines & Serving (L8) · CC-SPEC-001 §5, §10.7, §17.6

**Phase 4 · Days 61–90 · Revision: in-progress**

Phase 4 builds L8: the 6 AI engines served under human authority with enforced safety/bias/drift gates. Real
LLM serving needs the GPU fleet; the model-agnostic gateway, guardrails, and evaluation harness are built and
tested now. **Authored + verified here** is split honestly from what **needs GPUs/cluster**.

## Producible + verified in this environment
| # | Deliverable | Verification | Status |
|---|---|---|---|
| 4.1 | `guardrails` (Go) — PII redaction · injection detection · safety scoring; enforces `ai/safety.rego` | `go test` + **live OPA** gate | ✅ done |
| 4.2 | `evaluation` (Go) — PSI drift + disparate-impact/4-fifths bias; feeds `ai/drift.rego` & `ai/bias.rego` | `go test` | ✅ done |
| 4.3 | `serving` (Go) — inference gateway: backend seam + oracle baseline + resilience + pre/post guardrails | `go test` (refuse/retry/fallback/fail-closed) | ✅ done |
| 4.4 | Deterministic engine baselines/oracles (`lib/ai/engines`, RE-AUTHOR seam) | reference logic | ✅ present |
| 4.5 | ADR-0011 (AI serving gateway + guardrails + evaluation) | review | ✅ done |

Gateway guarantees proven against a deterministic oracle backend: PII redacted before serving, injection /
age-inappropriate / unsafe prompts refused at the input gate, fail-closed when the policy plane is
unreachable, retry on transient backend failure, and fallback to the oracle baseline on sustained failure.

## Requires the substrate (gated — `BLOCKERS.md`)
- **vLLM/Triton model serving** needs the GPU fleet (~200–400 H100/H200-class) — B-011. The `Backend` seam
  drops a vLLM/Triton client in with no gateway change.
- **RAG / grounding** needs the Milvus vector store — B-013.
- **The served safety/bias classifiers** replace the deterministic `Scorer`/oracle baselines once the fleet
  exists; the policy gates and evaluation metrics are unchanged.

## Exit / review gate
Phase 5 (Agents & Orchestration, L9) begins only when: this plan is reviewed; the GPU fleet + serving exist
(B-011); Milvus is provisioned (B-013); and the HITL agent-approval queues (L9) are designed atop this
gateway. **The build stops at this gate after Phase 4's authorable deliverables.**
