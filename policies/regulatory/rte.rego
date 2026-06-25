# RTE Act 2009 — Policy-as-Code (CC-SPEC-001 §8.5 PBAC, §20)
# Ported from the reference TS policy engine (lib/policy-engine) into the spec-correct Rego/OPA plane.
# Decision objects: deny-wins, then require_approval, then permit (composed in policies/decision.rego).
package vasa.regulatory.rte

import rego.v1

# RTE §16 — no expulsion or detention of a child 6–14.
deny contains d if {
	input.action in {"student.expel", "student.detain"}
	input.resource.age >= 6
	input.resource.age <= 14
	d := {
		"rule": "RTE-NO-DETENTION",
		"act": "RTE Act 2009 §16",
		"citation": "No child admitted shall be held back or expelled till elementary education is complete.",
	}
}

# RTE §13(1) — no screening procedure and no capitation fee at admission.
deny contains d if {
	input.action in {"admission.screen", "fee.capitation"}
	d := {
		"rule": "RTE-NO-SCREENING",
		"act": "RTE Act 2009 §13(1)",
		"citation": "No school shall subject a child to any screening procedure or collect any capitation fee.",
	}
}

# RTE §12(1)(c) — 25% EWS/DG quota: rejecting an EWS/DG applicant while the quota is unmet needs review.
require_approval contains d if {
	input.action == "admission.reject"
	input.resource.category in {"EWS", "DG"}
	not input.resource.quotaFull
	d := {
		"rule": "RTE-EWS-QUOTA",
		"act": "RTE Act 2009 §12(1)(c)",
		"citation": "At least 25% of entry-class seats are reserved for EWS/disadvantaged groups; rejection requires BEO/DEO review.",
		"reviewer_tier": "T3",
	}
}
