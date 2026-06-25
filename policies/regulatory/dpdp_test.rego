package vasa.regulatory.dpdp_test
import rego.v1
import data.vasa.regulatory.dpdp

test_no_consent_denied if {
	count(dpdp.deny) > 0 with input as {"action": "pii.process", "resource": {"consent": false, "age": 30}}
}
test_minor_without_guardian_denied if {
	count(dpdp.deny) > 0 with input as {"action": "pii.process", "resource": {"consent": true, "age": 12, "guardianConsent": false}}
}
test_minor_with_guardian_permitted if {
	count(dpdp.deny) == 0 with input as {"action": "pii.process", "resource": {"consent": true, "age": 12, "guardianConsent": true}}
}
test_cross_border_blocked if {
	count(dpdp.deny) > 0 with input as {"action": "pii.transfer", "resource": {"crossBorder": true}}
}
