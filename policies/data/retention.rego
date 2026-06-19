# Retention windows + erasure (DPDP §8(7)) — CC-SPEC-001 §18.2
package vasa.data.retention

import rego.v1

# Deny continued retention of non-statutory PII past its purpose window.
deny contains d if {
	input.action == "pii.retain"
	not input.resource.statutory_hold
	input.resource.days_since_purpose_end > 0
	d := {"rule": "RETENTION-ERASE", "citation": "DPDP §8(7): erase personal data once the purpose is served and no statutory retention applies."}
}
