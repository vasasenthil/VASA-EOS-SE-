# L8 · AI Engines & Serving

**CC-SPEC-001 layer · Phase-4 status: `gateway+guardrails-built` (GPU-serving gated)**

6 AI engines (Reasoning · Personalisation · Assessment · Policy · Analytics · Conversational) served via
vLLM/Triton on the sovereign GPU fleet, under human authority (HITL) with safety/bias/drift gates.

| Component | Status | Verification |
|---|---|---|
| `engines` — the **6 deterministic engine baselines** (Reasoning·Personalisation·Assessment·Policy·Analytics·Conversational) | ✅ built + tested | `go test` |
| `guardrails` — PII redaction · prompt-injection detection · safety scoring; enforces `ai/safety.rego` (ADR-0011) | ✅ built + tested | `go test` + live OPA gate |
| `evaluation` — PSI drift + disparate-impact/4-fifths bias; feeds `ai/drift.rego` & `ai/bias.rego` (§5.1) | ✅ built + tested | `go test` |
| `serving` — inference gateway: backend seam + deterministic **oracle** baseline + resilience + pre/post guardrails | ✅ built + tested | `go test` |
| vLLM/Triton model serving on the GPU fleet | ⛔ substrate-gated | B-011 |
| Milvus vector store for RAG/grounding | ⛔ cluster-gated | B-013 |

> The inference **gateway + guardrails + evaluation** are authored and tested with a deterministic oracle
> backend (no GPU). The **6 engines** are built as deterministic, explainable baselines/oracles (`engines`,
> a RE-AUTHOR of `lib/ai/engines`) that the gateway falls back to and that `evaluation` grades the served
> models against. Real LLM serving needs the GPU fleet (B-011) and Milvus (B-013). Gated per `PHASE-4-PLAN.md`
> / Section 24; nothing live until its phase passes the Section 25 Definition of Done.
