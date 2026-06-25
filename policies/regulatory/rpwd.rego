# RPwD Act 2016 — Policy-as-Code (CC-SPEC-001 §2.6, §16, §8.5)
package vasa.regulatory.rpwd

import rego.v1

# §16/§31 — reasonable accommodation for a CWSN learner is mandatory.
deny contains d if {
	input.action in {"assessment.conduct", "admission.process"}
	input.resource.pwd == true
	not input.resource.accommodation
	d := {
		"rule": "RPWD-ACCOMMODATION",
		"act": "RPwD Act 2016 §16/§31",
		"citation": "Inclusive education with reasonable accommodation for children with disabilities is mandatory.",
	}
}
