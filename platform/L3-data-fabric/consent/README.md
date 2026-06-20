# consent — DAT-TN-001 §E consent, lawful-basis & retention register

The stateful **DPDP-Act-2023 ledger**. Where the dataplane classifies a record and answers "is erasure due?"
statelessly, this register is the durable record of *why* each principal's personal data may be processed,
*for how long*, and the *rights* they can exercise over it.

Per data principal + purpose it records a **lawful basis** — consent (§6) or a §7 legitimate use (legal
obligation, court order, employment, subsidy, medical emergency) — and enforces:

- **Child protection (§9):** a minor's consent requires a named guardian (verifiable parental consent), and a
  purpose flagged `ChildProhibited` (behavioural monitoring / targeted advertising) is refused for a minor
  outright.
- **Withdrawal (§6(4)):** consent is withdrawable as easily as given; a §7 legitimate use is not.
- **Retention clock (§8(7)):** ending a purpose (graduation, scheme-cycle close, withdrawal) starts the
  per-purpose retention window; `RunRetention` sweeps and erases everything past its window.
- **Rights:** right-to-access (§11) returns every grant held about a principal; right-to-erasure (§12) honours
  a forced erase request — **unless** a statutory hold applies, which blocks erasure either way.

Every transition is appended to an immutable per-grant history. `LawfulToProcess` is the enforcement seam —
withdrawn or erased grants are no longer lawful.

## Surfaced

`integration.Platform` seeds the register at boot with the platform's standing purposes (enrolment, attendance,
assessment, scheme DBT, AI tutoring, + a child-prohibited advertising purpose) and their retention rules.
`platformd` serves it at `GET /consent` (`?purposes=1`, `?access=PRINCIPAL`) and `POST /consent` runs the
rights flow end-to-end.

Deterministic; injectable clock. 6 module tests.
