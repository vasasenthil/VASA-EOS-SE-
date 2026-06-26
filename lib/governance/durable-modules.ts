// VASA-EOS(SE) — durable-module register (honest deep-build evidence).
//
// The brochure markets ~391 (catalogue 312) functional modules. Most are broad reference UI; this register
// pins down the SUBSET that is genuinely DEEP — a clickable Next.js route whose server actions drive the durable
// Go backbone (platformd + PostgreSQL) with real workflows, invariants and an audited write path. It exists so
// the "deep-transactional" count in the brochure register cannot drift or be overstated: a companion test
// (tests/durable-modules.test.ts) asserts every route below has an app/<route>/actions.ts that imports the
// platform-client seam, i.e. it really is wired to the durable backend.

export interface DurableModule {
  /** The app route (app/<route>/page.tsx). */
  route: string
  /** Human label. */
  label: string
  /** The backbone service it drives (platformd endpoint). */
  service: string
  /** The headline invariant / workflow enforced server-side. */
  invariant: string
}

export const DURABLE_MODULES: DurableModule[] = [
  { route: "establishment", label: "Establishment & Posts", service: "/establishment", invariant: "no over-appointment beyond sanctioned strength" },
  { route: "fee-ledger", label: "Fee & Finance Ledger", service: "/fees", invariant: "money in paise; a payment can never overpay a demand" },
  { route: "rte-admissions", label: "RTE Admissions", service: "/admission", invariant: "RTE §12(1)(c) reject of EWS/DG → require-approval (HITL)" },
  { route: "grievance-cases", label: "Grievance Cases", service: "/grievance-case", invariant: "category-driven SLA escalation chain" },
  { route: "grievance-approvals", label: "Grievance Approvals", service: "/grievance-case", invariant: "tiered resolve/escalate/reject workflow" },
  { route: "dbt-scholarship", label: "Scholarship / DBT", service: "/scholarship", invariant: "amount-driven multi-tier sanction chain → disburse → reconcile" },
  { route: "mid-day-meal", label: "Mid-Day Meal (PM-POSHAN)", service: "/mdm", invariant: "stock never negative; meals ≤ enrolment" },
  { route: "school-transport", label: "School Transport", service: "/transport", invariant: "capacity + fitness/licence serviceability gates" },
  { route: "health-immunisation", label: "Health Immunisation", service: "/immunisation", invariant: "dose-sequence + schedule; no future-dated dose" },
  { route: "free-supply", label: "Free-Supply Entitlement", service: "/entitlement", invariant: "no over-issue beyond the entitled quantity" },
  { route: "class-timetable", label: "Class Timetable", service: "/timetable", invariant: "a teacher can't be in two classes at the same day+period" },
  { route: "school-library", label: "School Library", service: "/library", invariant: "one physical copy on loan to at most one member" },
  { route: "estate-register", label: "Estate & Asset Register", service: "/infra", invariant: "no decommission with an open ticket; critical-ticket auto-flip" },
  { route: "parent-teacher-meetings", label: "Parent–Teacher Meetings", service: "/ptm", invariant: "no overbooking / no double-booking of a session" },
  { route: "health-screening", label: "RBSK Health Screening", service: "/rbsk", invariant: "any finding auto-refers to DEIC; treat → close pipeline" },
  { route: "teacher-cpd", label: "Teacher CPD (NEP-2020)", service: "/cpd", invariant: "50-hour annual target; only completed/certified hours count" },
  { route: "student-attendance", label: "Student Attendance", service: "/attendance", invariant: "(student,date) upsert; RTE 75% chronic-absentee flag" },
  { route: "events-calendar", label: "Academic Calendar", service: "/calendar", invariant: "dynamic multi-tier approval chain (fail-closed on role+scope)" },
  { route: "exam-results", label: "Examinations & Results", service: "/exams", invariant: "PDP separation of duties; submit locks + grades" },
  { route: "user-directory", label: "User Directory & IAM", service: "/directory", invariant: "five-model PDP; access-explain with per-model trace" },
  { route: "leave-approvals", label: "Staff Leave", service: "/leave", invariant: "dynamic approval chain (principal → +BEO → +DEO)" },
  { route: "audit-trail", label: "Audit Trail & Integrity Ledger", service: "/audit", invariant: "hash-chained, tamper-evident, verified intact" },
  { route: "school-inspection", label: "School Inspection & Monitoring", service: "/inspection", invariant: "no duplicate open inspection per type; close only after action" },
  { route: "transfer-certificate", label: "Transfer Certificates", service: "/tc", invariant: "one active TC per student; request → issue (serial) → cancel" },
  { route: "employee-attendance", label: "Staff Attendance & Payable Days", service: "/staff-attendance", invariant: "(employee,date) upsert; payable-days + leave-without-pay computation" },
  { route: "school-grants", label: "School Grant Utilisation", service: "/grant", invariant: "no over-spend — cumulative expenditure can never exceed the allocation" },
  { route: "lesson-plan", label: "Lesson Plans", service: "/lesson-plan", invariant: "publish quality-gate — a plan cannot be published without learning objectives" },
  { route: "period-attendance", label: "Period Attendance & Lesson Delivery", service: "/period-attendance", invariant: "timetable-validated period + published-plan link; subject/teacher snapshot; subject-wise attendance" },
  { route: "smc-meetings", label: "SMC Meetings & Resolutions", service: "/smc", invariant: "RTE §21(2) three-fourths-parents composition + majority-quorum convene; resolutions only on a quorate meeting" },
  { route: "bonafide-register", label: "Bonafide Certificate Register", service: "/bonafide", invariant: "cross-module — cannot issue for a student with an active transfer certificate; monotonic per-school serial" },
  { route: "teacher-transfer", label: "Teacher Transfer & Posting", service: "/teacher-transfer", invariant: "single active request per teacher; cross-module — approve only into a destination with a sanctioned cadre vacancy" },
  { route: "hostel-occupancy", label: "Hostel Allocation & Occupancy", service: "/hostel", invariant: "occupancy never exceeds capacity (no over-allocation) + one active bed per student statewide" },
  { route: "campus-facilities", label: "Campus Infrastructure & Facilities (CIFM)", service: "/cifm", invariant: "safety gate — no return-to-operational with an open critical work order; critical WO auto-flips to under-maintenance" },
  { route: "language-lab", label: "Native AI Language Lab", service: "/language-lab", invariant: "review-before-publish quality gate — machine (Bhashini) output cannot be published without human review; 22 Eighth-Schedule languages" },
  { route: "gem-procurement", label: "Procurement & GeM Purchase Orders", service: "/procurement", invariant: "GFR controls — no over-receipt beyond ordered qty + no over-payment beyond goods received (paise)" },
  { route: "wash-register", label: "School Sanitation & WASH Register", service: "/wash", invariant: "no over-report (functional units ≤ sanctioned) + Swachh/ODF certification gate — cannot certify while any critical facility is not fully functional; critical regression auto-revokes" },
  { route: "sports-competitions", label: "Co-curricular & Sports Competitions", service: "/competitions", invariant: "unique entry per student + podium-position uniqueness (one gold/silver/bronze) + advancement gate (only podium finishers advance; national is terminal)" },
  { route: "stock-register", label: "School Stores & Inventory Register", service: "/inventory", invariant: "no negative stock — an issue can never exceed quantity on hand + no close with stock on hand; reorder-level low-stock worklist" },
  { route: "visitor-gate", label: "Visitor & Gate Management", service: "/gate", invariant: "single open pass per visitor statewide (no phantom presence) + no double check-out (only a checked-in pass can be checked out)" },
  { route: "water-testing", label: "Water Quality Testing", service: "/water", invariant: "potability approval gate — cannot approve potable while any critical parameter (E.coli/turbidity/pH) is out of range + evidence-backed fail gate (cannot mark unsafe without a failing critical parameter)" },
  { route: "notice-board", label: "Notice Board & Circulars", service: "/circulars", invariant: "no ack before publish + unique read-receipt per recipient + archive compliance gate (cannot archive until every targeted recipient has acknowledged)" },
  { route: "remedial-batches", label: "Diagnostic & Remedial Learning (NIPUN FLN)", service: "/remedial", invariant: "capacity cap + eligibility gate (only below-target students enrol) + unique enrolment + proficiency graduation gate (cannot exit until re-assessed at/above target)" },
  { route: "event-registration", label: "Co-curricular Registration", service: "/registrations", invariant: "registration window + unique registration per student + seat cap (confirmed never exceeds cap) + FIFO waitlist auto-promotion on a vacated seat" },
  { route: "health-clinic", label: "School Health Clinic (Sick Room)", service: "/clinic", invariant: "single open visit per student statewide + outcome gate (cannot close without a recorded outcome) + referral requires a destination" },
  { route: "imprest-book", label: "Petty Cash / Imprest Book", service: "/imprest", invariant: "GFR controls (paise) — no overspend beyond cash on hand + imprest ceiling (no replenish beyond the sanctioned float) + settlement reconciliation gate (settle only when cash equals the float)" },
  { route: "staff-disciplinary", label: "Staff Disciplinary / Vigilance", service: "/disciplinary", invariant: "natural justice — no penalty without an inquiry + penalty must be from the sanctioned schedule + appeal only against a decided case; staged charge→inquiry→decided→closed" },
  { route: "library-fines", label: "Library Fine Ledger", service: "/library-fines", invariant: "money in paise — no overpay beyond a fine's outstanding + no re-settling a paid/waived fine + borrow-block gate (member over the dues threshold cannot be issued a book)" },
]

/** Count of genuinely deep, durable, backbone-wired modules. */
export const DURABLE_MODULE_COUNT = DURABLE_MODULES.length

/** Distinct backbone services these modules drive. */
export function durableServices(): string[] {
  return Array.from(new Set(DURABLE_MODULES.map((m) => m.service))).sort()
}
