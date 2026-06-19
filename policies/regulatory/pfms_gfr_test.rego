package vasa.regulatory.pfms_gfr_test
import rego.v1
import data.vasa.regulatory.pfms_gfr as p

test_unsanctioned_release_denied if {
	count(p.deny) > 0 with input as {"action": "fund.release", "resource": {"sanctioned": false, "amount": 10000000}}
}
test_over_allocation_denied if {
	count(p.deny) > 0 with input as {"action": "fund.release", "resource": {"sanctioned": true, "exceedsAllocation": true, "amount": 1000}}
}
test_high_value_requires_approval if {
	some d in p.require_approval with input as {"action": "fund.release", "resource": {"sanctioned": true, "amount": 5000001}}
	d.rule == "FUND-HIGH-VALUE-APPROVAL"
}
test_small_sanctioned_permitted if {
	count(p.deny) == 0 with input as {"action": "fund.release", "resource": {"sanctioned": true, "amount": 1000}}
	count(p.require_approval) == 0 with input as {"action": "fund.release", "resource": {"sanctioned": true, "amount": 1000}}
}
