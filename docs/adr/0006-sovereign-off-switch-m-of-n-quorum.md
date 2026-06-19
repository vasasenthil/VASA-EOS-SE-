# ADR-0006 · Sovereign off-switch with M-of-N key quorum

- **Status:** Accepted
- **Date:** Phase 1
- **Deciders:** G1 Sovereign Authority (T0 — State of Tamil Nadu), G6 Security & Compliance

## Context
CC-SPEC-001 §2.1 (sovereignty-by-construction) requires the State to hold an **off-switch**: the ability to
disable the platform independently of the vendor. §4 L1 places this in the Sovereign Foundation layer. A
naive switch — a single admin flag — concentrates catastrophic power in one officer, is trivially abused or
coerced, and leaves no defensible audit. It also makes the State dependent on the vendor's runtime to honour
the flag, which defeats the sovereignty goal.

The control must therefore be: (a) **distributed** — no single person can engage or disengage it;
(b) **cryptographically verifiable** — authorisation cannot be forged or replayed; (c) **tamper-evident** —
every approval and state change is auditable after the fact; (d) **portable and auditable** — dependency-free
so the State (G7 auditor) can read and reason about the whole mechanism without a supply chain.

## Decision
`platform/L1-foundation/off-switch-svc` (Go, stdlib-only) implements an **M-of-N threshold quorum**:

- N registered **key-holders** (T0 officers) each hold an ed25519 private key; their public keys form the
  quorum. The threshold **M** is configured at construction (`New` rejects `M < 1` or `M > N`).
- An action (`engage` = disable / `disengage` = re-enable) is expressed as a **Request** carrying a unique
  nonce (`ID`). Each holder signs the request's **canonical byte encoding** (`CanonicalBytes`); the service
  re-derives the same bytes and verifies with `ed25519.Verify`. A signature over a different request does not
  validate.
- `Submit` records approvals, **deduplicating per holder** (one holder cannot count twice), and authorises +
  executes **exactly on the approval that crosses M**. The request nonce is then **closed** — replay of an
  executed request is rejected.
- Every approval, execution, and rejection is appended to a **tamper-evident audit** trail.
- Quorum keys are issued by the **State HSM/PKI at deploy time** (gated on B-002); the service logic is
  complete and tested here with ephemeral test keys (7/7 tests: quorum threshold, duplicate-holder, invalid
  signature, unknown holder, replay, engage→disengage, bad-quorum construction).

## Consequences
- Engaging or disengaging the platform provably requires collusion of M independent State officers — coercion
  or compromise of fewer than M holders cannot flip the switch.
- The mechanism is independently auditable: stdlib-only Go, deterministic canonicalisation, append-only audit.
- The runtime integration (which platform control planes honour `engaged`, and how the signal propagates to
  L2 workloads) is part of Phase 2+ and the substrate; this ADR fixes the **authorisation core**.
- Key issuance, rotation, and holder revocation depend on the State PKI/HSM (B-002) and are out of scope here.
