package vasa.regulatory.rte_test
import rego.v1
import data.vasa.regulatory.rte

test_expel_6_to_14_denied if {
	some d in rte.deny with input as {"action": "student.expel", "resource": {"age": 8}}
	d.rule == "RTE-NO-DETENTION"
}
test_expel_16_not_denied if {
	count(rte.deny) == 0 with input as {"action": "student.expel", "resource": {"age": 16}}
}
test_screening_denied if {
	count(rte.deny) > 0 with input as {"action": "admission.screen", "resource": {}}
}
test_ews_reject_requires_approval if {
	some d in rte.require_approval with input as {"action": "admission.reject", "resource": {"category": "EWS", "quotaFull": false}}
	d.rule == "RTE-EWS-QUOTA"
}
test_ews_reject_quota_full_no_gate if {
	count(rte.require_approval) == 0 with input as {"action": "admission.reject", "resource": {"category": "EWS", "quotaFull": true}}
}
