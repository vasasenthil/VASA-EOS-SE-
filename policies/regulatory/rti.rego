# RTI Act 2005 — Policy-as-Code (CC-SPEC-001 §8.5 PBAC, §20, L12 civic). Right to Information disclosure
# gates: exempt categories are refused; third-party information needs a PIO review before disclosure.
package vasa.regulatory.rti

import rego.v1

exempt_categories := {"national-security", "cabinet-papers", "personal-info", "fiduciary"}

# exempt is true only when the request's category is one of the exempt categories (undefined otherwise, so
# `not exempt` holds for non-exempt or absent categories).
exempt if input.resource.exempt_category in exempt_categories

# §8(1) — exempt categories may not be disclosed (sovereignty/security, cabinet papers, personal information
# with no public interest, info held in fiduciary capacity).
deny contains d if {
	input.action == "rti.disclose"
	exempt
	d := {
		"rule": "RTI-S8-EXEMPT",
		"act": "RTI Act 2005 §8(1)",
		"citation": "The listed categories are exempt from disclosure under §8(1) of the RTI Act.",
	}
}

# §11 — third-party information: a PIO must invite the third party's representation before disclosing.
require_approval contains d if {
	input.action == "rti.disclose"
	input.resource.third_party == true
	not exempt
	d := {
		"rule": "RTI-S11-THIRD-PARTY",
		"act": "RTI Act 2005 §11",
		"citation": "Information relating to a third party requires PIO review and the third party's representation before disclosure.",
		"reviewer_tier": "PIO",
	}
}
