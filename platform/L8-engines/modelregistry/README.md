# modelregistry — DAT-TN-001 §G AI-operational governance registry

The authoritative record of every model the platform may run, and the lifecycle gate that makes the §F.2
**"no model in production without a signed card"** SLA *enforceable* rather than aspirational.

Each entry binds an `evaluation.ModelCard` (intended use + bias + drift + signed attestation) to red-team
evidence and a lifecycle state machine:

```
registered ──request──▶ pending-approval ──human approve──▶ deployed ──retire──▶ retired
    │                          │                                │
    └─(card fails gate)        └─(human rejects)                └─(drift > threshold)
            ▼                          ▼                                ▼
         blocked                   rejected                          blocked  (automatic rollback)
```

The transition **into production** requires all three, fail-closed:

1. the **card-level gate** — fairness clears the four-fifths rule, drift (PSI) is under threshold, and the
   bias/fairness attestation is **signed**;
2. **red-team evidence** on file;
3. a **named human approver** (HITL / continuous human authority).

Live drift past threshold on a deployed model trips an **automatic rollback** to `blocked` (canary discipline),
so production never silently serves a drifted model. `IsServable` is the enforcement point — an unregistered or
non-deployed model is never servable.

## Surfaced

`integration.Platform` boots the registry mirroring what actually runs: the deterministic safety classifier is
carried through the full gate to **deployed**; the GPU-served generative + Indic models are **registered but
un-deployed**, awaiting their B-011 substrate and independent bias/red-team evidence (honest). `Summary`
exposes the live **model-card coverage** that feeds the §F.2 SLA. `platformd` serves it at `GET /models`
(`?list=1`, `?model=NAME&version=V`).

Deterministic; injectable clock. 5 module tests.
