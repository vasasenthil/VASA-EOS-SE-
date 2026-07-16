# User Discovery Interview Guide — Scholarship Reconciliation Wedge

## Purpose

Validate whether scholarship reconciliation is a true "hair on fire" problem and define what **10x better** means before building more platform breadth. This guide is deliberately wedge-focused: the discovery target is not the entire VASA-EOS-SE-TN ecosystem, but the end-to-end scholarship journey from eligibility and verification through PFMS/DBT/APBS settlement, failed-payment handling, reconciliation, escalation, and reporting.

## Discovery Hypothesis

Scholarship reconciliation is the best first production wedge if interviews prove that:

1. Payments are delayed or fail often enough to create urgent operational pain.
2. Operators spend substantial time reconciling PFMS/DBT/APBS status manually.
3. Students and parents experience real harm when payment status is unclear.
4. Government officers need auditable, dynamic reports for escalation and accountability.
5. A vertical slice can reduce cycle time, failed-payment resolution time, and manual reconciliation effort by at least **10x** for one pilot jurisdiction.

## Target Interviewees

| Stakeholder | Target count | Why this stakeholder matters |
| --- | ---: | --- |
| District Education Officers (DEOs) | 10 | Own district-level approvals, escalation, reporting, and political pressure. |
| Block Education Officers (BEOs) | 10 | See school-level verification delays and block-level exception queues. |
| School Heads / Principals | 20 | Coordinate school verification, document collection, and parent follow-up. |
| Teachers / Scholarship Verifiers | 20 | Often perform eligibility/document verification and repeated data correction. |
| Parents / Students | 20 | Experience the lived impact of delayed, failed, or opaque payments. |
| Finance / Reconciliation Officers | 5 | Own PFMS/DBT/APBS reconciliation, exception resolution, and audit evidence. |
| State Officials (Directorate / Secretary level) | 5 | Define ownership, pilot authorization, budget, and institutional rollout path. |

## Interview Ethics and Data Handling

- Explain that the interview is for product discovery, not benefit approval or grievance disposal.
- Do not collect bank account numbers, Aadhaar numbers, full APAAR IDs, or other sensitive identifiers in notes.
- Anonymize quotes by role and district/block only, for example: `BEO, western district`.
- Ask permission before recording.
- Store raw notes in a restricted folder; publish only synthesized findings.
- Separate user pain evidence from solution ideas so the team does not overfit to one requested feature.

## Interview Structure (45–60 minutes)

### Part 1: Current Workflow (15 minutes)

1. Walk me through how scholarship disbursement works today.
2. What are the steps from application to payment?
3. Who is involved at each step?
4. Which systems do you use at each step? Examples: EMIS, school records, PFMS, DBT/APBS, spreadsheets, WhatsApp, email, paper files.
5. How long does each step usually take?
6. Where do you manually copy or re-enter data?
7. What reports do you prepare, and for whom?

### Part 2: Pain Points (15 minutes)

8. What are the biggest challenges in this process?
9. Where do things get stuck or delayed?
10. How often do payments fail, get rejected, or remain unclear?
11. What happens when a payment fails?
12. How do you find the root cause of a failed or delayed payment?
13. How do you track pending, blocked, released, failed, and reconciled payments today?
14. What is the most frustrating part of your job related to scholarships?
15. What creates the most complaints or escalations?

### Part 3: Impact (10 minutes)

16. How do these problems affect students and parents?
17. How much time do you spend on manual reconciliation each week?
18. How many escalations or complaints do you handle per month?
19. What is the cost of delays in staff time, student trust, and political pressure?
20. Have you tried to fix this before? What worked and what failed?

### Part 4: Ideal 10x Solution (10 minutes)

21. If you could wave a magic wand, what would the perfect scholarship process look like?
22. What would "10x better" mean in concrete terms: 10x faster, 10x fewer failures, 10x less manual work, 10x clearer reporting, or something else?
23. Which features would be absolute must-haves?
24. Which reports or dashboards would you need daily, weekly, monthly, and at audit time?
25. What would make you switch from the current process?
26. What would make you refuse to use a new system?
27. Who else should we interview before building?

### Part 5: Validation and Pilot Feasibility (5 minutes)

28. On a scale of 1–10, how painful is scholarship reconciliation today?
29. How often would you use a system that solved this?
30. Who would approve a pilot?
31. What is the smallest pilot scope that would still prove value: one school, one block, one district, one scheme, or one beneficiary category?
32. What data and permissions would be required to run a pilot?
33. Can we follow up after a prototype is ready?

## Stakeholder-Specific 10x Definitions

| Stakeholder | 10x value hypothesis to validate | Evidence to collect |
| --- | --- | --- |
| Student | Knows payment status without repeated school visits; receives benefit faster. | Days waited, visits made, uncertainty pain, impact of delay. |
| Parent | Gets transparent status and clear next action when payment is blocked. | Complaints, travel/time cost, documents resubmitted. |
| Teacher / Verifier | Stops repeating manual corrections and status chasing. | Weekly hours spent, duplicate entries, correction loops. |
| School Head | Sees complete eligible/pending/blocked/reconciled list for the school. | Number of cases tracked manually, parent escalations. |
| BEO | Has block-level exception queue with owner, SLA, and root cause. | Pending case aging, escalation frequency, status reporting effort. |
| DEO | Gets district reconciliation dashboard and drill-down reports. | Monthly review effort, audit preparation time, unresolved failures. |
| Finance Officer | Reconciles PFMS/DBT/APBS exceptions from one queue instead of multiple files. | File formats, manual matching time, unmatched count. |
| Director / Secretary | Sees statewide release, utilization, failure, and SLA posture. | Review cadence, reporting burden, policy bottlenecks. |
| Minister | Gets trusted public/assembly-ready outcome and exception reporting. | Required metrics, credibility gaps, political escalation points. |

## Baseline Metrics to Capture

| Metric | Current value | Source / evidence | Target 10x direction |
| --- | --- | --- | --- |
| Application-to-payment cycle time |  | Interview + records | 10x faster or clearly bounded SLA. |
| Failed-payment resolution time |  | Finance/BEO/DEO records | 10x faster exception closure. |
| Manual reconciliation hours per week |  | Operator self-report + work sampling | 10x less manual matching/chasing. |
| Payment failure / rejection rate |  | PFMS/DBT/APBS reports | Major reduction or same-day root-cause visibility. |
| Monthly escalations / complaints |  | Grievance logs + officer estimate | 10x fewer avoidable escalations. |
| Duplicate data-entry points |  | Workflow mapping | Remove or automate repeated entry. |
| Audit report preparation time |  | Finance/DEO/Directorate estimate | Minutes/hours instead of days. |
| Parent/student status inquiries |  | School/BEO estimate | Self-service status for most cases. |

## Pain Score Rubric

| Score | Meaning | Decision signal |
| ---: | --- | --- |
| 1–3 | Mild annoyance; users will not change behavior. | Do not build this wedge yet. |
| 4–6 | Real pain, but not urgent or owned. | Keep researching; narrow further. |
| 7 | Important, but value must be very obvious. | Pilot only if buyer exists. |
| 8–10 | Hair-on-fire problem with urgent operational pressure. | Proceed to prototype and pilot design. |

Proceed only if at least **70% of operators** score the pain at **8 or higher**, and at least one named owner can authorize a pilot.

## Current Workflow Mapping Template

For every interview, capture the actual process in this format:

1. **Trigger:** What starts the scholarship workflow?
2. **Inputs:** What data/documents are required?
3. **Actors:** Who touches the case?
4. **Systems:** Which portals/files/messages are used?
5. **Approvals:** Who approves and at what threshold?
6. **Payment rail:** PFMS, DBT/APBS, sponsor bank, or other.
7. **Failure modes:** Missing docs, duplicate identity, bank mismatch, PFMS rejection, beneficiary not found, sanction not released, stale status, reconciliation mismatch.
8. **Escalations:** Who gets called when the case is stuck?
9. **Reports:** What reports are produced and how often?
10. **Audit evidence:** What proof is kept today?

## Post-Interview Synthesis Template

Use the standalone synthesis worksheet at [`synthesis-template.md`](synthesis-template.md) after every interview. A compact inline template is also provided below for quick capture.

Create one synthesis note per interview:

```markdown
# Interview Synthesis — <role>, <district/block>, <date>

## Context
- Role:
- Jurisdiction:
- Scholarship schemes touched:
- Systems used:

## Top 3 Pain Points
1.
2.
3.

## Current Workflow Summary
- Trigger:
- Steps:
- Actors:
- Systems:
- Manual handoffs:

## Quantitative Baseline
- Cycle time:
- Failed-payment rate:
- Manual reconciliation hours/week:
- Escalations/month:
- Audit/reporting time:

## 10x Definition From This User
-

## Must-Have Capabilities
-

## Direct Quotes (Anonymized)
> "..."

## Red Flags / Adoption Risks
-

## Follow-Up Questions
-
```

## Go / No-Go Criteria for Building the Vertical Slice

### Go

Build the scholarship reconciliation vertical slice if discovery proves all of the following:

- Average operator pain score is **8/10 or higher**.
- At least one district/block agrees to a pilot scope.
- A named government owner exists for decisions and data access.
- Operators can provide baseline cycle-time and failure-resolution metrics.
- The workflow can be piloted without waiting for every statewide integration.
- The expected value is at least one of:
  - 10x faster failed-payment resolution.
  - 10x less manual reconciliation effort.
  - 10x clearer beneficiary/payment status visibility.
  - 10x faster audit/report generation.

### No-Go / Pivot

Do not build this wedge yet if:

- Pain scores are below 8 for most operators.
- No one owns the workflow or pilot approval.
- Data access is impossible.
- Payment failures are too rare to matter.
- The real bottleneck is only policy approval and cannot be influenced by software.
- Users say another dashboard would add work rather than remove it.

## Discovery Output Required Before Build

Before writing production code for the vertical slice, produce:

1. Interview count and role coverage report.
2. Current-state workflow map.
3. Top five pain points with frequency and severity.
4. Baseline metric table.
5. Stakeholder-specific 10x definitions.
6. Pilot scope recommendation.
7. Named owner / buyer hypothesis.
8. Procurement and data-access path.
9. Prototype requirements.
10. Risks and adoption objections.

## Replication Pattern for Other Modules

After the scholarship wedge, apply the same pattern to other modules:

1. Identify one painful workflow.
2. Interview every stakeholder in the chain.
3. Define 10x value in measurable terms.
4. Build one vertical slice end-to-end.
5. Prove baseline-to-after improvement.
6. Only then expand adjacent modules.
