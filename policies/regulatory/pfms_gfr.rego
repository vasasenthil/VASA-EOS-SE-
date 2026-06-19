# PFMS / GFR 2017 — Policy-as-Code (CC-SPEC-001 §2.x, §13)
package vasa.regulatory.pfms_gfr

import rego.v1

fund_approval_threshold := 5000000  # ₹50,00,000 delegated limit

# GFR — funds may be released only against a valid sanction.
deny contains d if {
	input.action == "fund.release"
	not input.resource.sanctioned
	d := {
		"rule": "PFMS-SANCTION-FIRST",
		"act": "GFR 2017 / PFMS",
		"citation": "Funds may be released only against a valid sanction order.",
	}
}

# GFR — a release may not exceed the sanctioned allocation.
deny contains d if {
	input.action == "fund.release"
	input.resource.exceedsAllocation == true
	d := {
		"rule": "PFMS-WITHIN-ALLOCATION",
		"act": "GFR 2017",
		"citation": "Expenditure/release must stay within the sanctioned allocation.",
	}
}

# Delegation of financial powers — high-value release needs higher (secretariat) approval.
require_approval contains d if {
	input.action == "fund.release"
	input.resource.sanctioned
	not input.resource.exceedsAllocation
	input.resource.amount > fund_approval_threshold
	d := {
		"rule": "FUND-HIGH-VALUE-APPROVAL",
		"act": "Delegation of financial powers",
		"citation": "A release above the delegated limit requires secretariat (T1) approval.",
		"reviewer_tier": "T1",
	}
}
