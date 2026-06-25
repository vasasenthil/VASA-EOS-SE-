# ABAC — fine-grained: subject × object × action × environment attributes (CC-SPEC-001 §8.4)
package vasa.access.abac

import rego.v1

# Example: a teacher may read marks only for a class they are assigned, in school hours, on a trusted network.
allow if {
	input.subject.role == "TEACHER"
	input.action == "marks.read"
	input.resource.class in input.subject.classes_assigned
	input.environment.time_in_school_hours == true
	input.environment.network in {"school_lan", "state_vpn"}
}

# AAL3 step-up: governance/finance actions require assurance level AAL3.
deny contains "AAL3 required for governance/finance action" if {
	input.action in {"fund.release", "circular.publish", "governance.decide"}
	input.subject.aal != "AAL3"
}
