# ADR-0011 · AI serving gateway, safety guardrails, and fairness/drift evaluation

- **Status:** Accepted
- **Date:** Phase 4
- **Deciders:** G4 Academic & Data Standards, G6 Security & Compliance, G2 Platform Engineering

## Context
CC-SPEC-001 §5, §10.7 and §17.6 require that the 6 AI engines are served under strict human authority with
enforced safety, fairness, and drift controls — never as an unconstrained model endpoint. Phase 0 authored
the AI gates in Rego (`policies/ai/{safety,bias,drift}.rego`) but those policies only adjudicate signals;
nothing yet PRODUCES the signals or sits in the inference path. Real LLM serving needs the GPU fleet
(vLLM/Triton, BLOCKERS B-011), which is not available here — but the gateway, guardrails, and evaluation
harness are model-agnostic and fully buildable now.

## Decision
Three stdlib-only Go components under `platform/L8-engines/`:

1. **`guardrails`** — the safety pipeline that produces the signals `ai/safety.rego` adjudicates: PII
   detection + redaction (a model never sees a raw Aadhaar/phone/email/APAAR id), prompt-injection/jailbreak
   detection, and a content-safety score (a `Scorer` seam; deterministic baseline here, served classifier in
   production). The DECISION stays in policy: `SafetyGate` builds the policy input and evaluates
   `data.vasa.ai.safety.deny`, fail-closed. Integration tests run the real Rego corpus.

2. **`evaluation`** — the fairness/drift harness that produces the metrics `ai/bias.rego` and `ai/drift.rego`
   gate on: Population Stability Index (PSI) for distribution drift (rollback above 0.2) and disparate-impact
   ratio + four-fifths (80%) rule + demographic-parity difference for bias. Deterministic and reproducible
   for the G7 auditor.

3. **`serving`** — the inference gateway every engine call flows through. IN: redact PII, adjudicate the
   prompt, refuse unsafe/injection input (fail-closed). CALL: invoke the model backend through the resilience
   core (breaker + retry), falling back to a deterministic **oracle baseline** on sustained failure. OUT:
   re-adjudicate the generated text. The `Backend` is a seam — vLLM/Triton in production, `OracleBackend`
   here — so the whole guarded path is tested without a GPU. The gateway returns text or a refusal; it never
   takes an autonomous action (human authority).

## Consequences
- Safety, fairness, and drift are enforced in the inference path and decided by policy, not by model goodwill
  or Go business logic; the Phase-0 AI policies are now operational.
- PII cannot reach a model; an unsafe prompt or output cannot be returned; a drifted or biased model is
  blocked by the gates fed from `evaluation`.
- Swapping the deterministic oracle for vLLM/Triton is a `Backend` + `Scorer` wiring exercise once the GPU
  fleet exists (B-011); RAG/grounding adds Milvus (B-013). The contracts and gates do not change.
