# platformd — the merged platform, runnable

A small HTTP harness that mounts the `integration.Platform` (every layer wired together) and serves its
end-to-end workflows, so the CC-SPEC-001 build can be **exercised live** on any host.

## Run
```bash
# from the repo root (uses the live Rego policy plane if opa + policies/ are present, else an in-process mirror)
cd platform/integration
go run ./cmd/platformd            # listens on :8080  (PORT to override)

# optional: force the live policy plane
VASA_OPA_BIN=/path/to/opa VASA_POLICY_DIR="$PWD/../../policies" go run ./cmd/platformd
```
Open `http://localhost:8080/` for a one-click web console.

## Endpoints
| Method | Path | Workflow |
|---|---|---|
| GET | `/healthz` | SLO/error-budget + off-switch health |
| GET | `/readiness` | merged go-live readiness (capacity + DR + SLO + off-switch) |
| GET | `/scenarios` | the §10.8 load-test suite |
| POST | `/admission` | top-to-bottom: rate-limit → off-switch → residency → KMS → PEP → audit → HITL → credential |
| POST | `/tutor` | bottom-to-top: serving (guardrails+oracle) → knowledge graph → audit |

## Examples
```bash
# admit → issues a verifiable, notarised credential
curl -sX POST localhost:8080/admission \
  -d '{"actorRole":"HEAD_TEACHER","decision":"admit","applicantId":"STU-1","applicantName":"Anbu","applicantAge":7,"category":"GEN","region":"TN-SDC"}'

# EWS reject with quota unmet → routed to a human (require-approval, RequestID)
curl -sX POST localhost:8080/admission \
  -d '{"actorRole":"HEAD_TEACHER","decision":"reject","applicantId":"STU-2","category":"EWS","applicantAge":7}'

# Class-1 PII requested offshore → blocked at residency
curl -sX POST localhost:8080/admission \
  -d '{"actorRole":"HEAD_TEACHER","decision":"admit","applicantId":"STU-3","category":"GEN","region":"AWS-Mumbai"}'

# tutor: a benign question is served with a learning path; an injection prompt is refused
curl -sX POST localhost:8080/tutor \
  -d '{"question":"Explain fractions for Class 4.","ageAppropriate":true,"mastered":{"div":true,"place":true},"target":"frac"}'
```

This is a reference/demo harness. In production these workflows run inside the cluster behind the gateway;
the binary makes the authorable build runnable so the end-to-end behaviour can be seen and tested.
