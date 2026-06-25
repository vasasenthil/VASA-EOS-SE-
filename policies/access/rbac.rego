# RBAC — coarse-grained roles bound to portal × action surfaces (CC-SPEC-001 §8.2)
package vasa.access.rbac

import rego.v1

# Role → permitted actions (illustrative; the production grants are generated from config/portals + module.yaml).
grants := {
	"STUDENT": {"content.read", "practice.attempt", "grievance.file", "credential.view"},
	"TEACHER": {"roster.read", "marks.write", "lesson.read", "grievance.file"},
	"HEAD_TEACHER": {"school.read", "staff.read", "scheme.deliver", "audit.read", "admission.admit", "admission.reject"},
	"BEO": {"block.read", "mentor.visit"},
	"DEO": {"district.read", "scheme.rollout", "fund.release"},
	"DIRECTOR_DSE": {"circular.draft", "report.read"},
	"SECRETARY_SE": {"policy.read", "audit.read"},
	"AUDITOR": {"audit.read", "extract.sign"},
	"CITIZEN": {"dashboard.read", "rti.file", "grievance.track"},
	"PIO": {"rti.disclose", "audit.read"},
}

# allow if the subject's role grants the action. (RBAC is the first gate; ABAC/ReBAC/PBAC narrow further.)
allow if {
	some action in grants[input.subject.role]
	action == input.action
}
