package vasa.data.data_test
import rego.v1
import data.vasa.data.classification
import data.vasa.data.residency
import data.vasa.data.retention

test_biometric_is_class1 if { classification.class == "class1" with input as {"field": {"category": "biometric"}} }
test_marks_is_class2 if { classification.class == "class2" with input as {"field": {"category": "marks"}} }
test_aggregate_is_class4 if { classification.class == "class4" with input as {"field": {"category": "aggregate"}} }
test_default_class3 if { classification.class == "class3" with input as {"field": {"category": "name"}} }
test_class1_offshore_denied if { count(residency.deny) > 0 with input as {"field": {"category": "financial"}, "resource": {"region": "OFFSHORE"}} }
test_class1_tnsdc_ok if { count(residency.deny) == 0 with input as {"field": {"category": "financial"}, "resource": {"region": "TN-SDC"}} }
test_class1_tnsdc_dr_ok if { count(residency.deny) == 0 with input as {"field": {"category": "financial"}, "resource": {"region": "TN-SDC-DR"}} }
test_retain_past_purpose_denied if { count(retention.deny) > 0 with input as {"action": "pii.retain", "resource": {"statutory_hold": false, "days_since_purpose_end": 30}} }
