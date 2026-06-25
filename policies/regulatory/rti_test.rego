package vasa.regulatory.rti_test

import rego.v1
import data.vasa.regulatory.rti

test_exempt_personal_info_denied if {
	count(rti.deny) > 0 with input as {"action": "rti.disclose", "resource": {"exempt_category": "personal-info"}}
}

test_national_security_denied if {
	count(rti.deny) > 0 with input as {"action": "rti.disclose", "resource": {"exempt_category": "national-security"}}
}

test_third_party_requires_pio_review if {
	count(rti.require_approval) > 0 with input as {"action": "rti.disclose", "resource": {"third_party": true}}
}

test_public_info_disclosable if {
	count(rti.deny) == 0 with input as {"action": "rti.disclose", "resource": {"exempt_category": "public"}}
}

test_exempt_third_party_denied_not_review if {
	# an exempt third-party request is denied outright, not routed to review
	count(rti.deny) > 0 with input as {"action": "rti.disclose", "resource": {"third_party": true, "exempt_category": "fiduciary"}}
	count(rti.require_approval) == 0 with input as {"action": "rti.disclose", "resource": {"third_party": true, "exempt_category": "fiduciary"}}
}
