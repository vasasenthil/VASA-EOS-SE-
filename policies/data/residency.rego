# Data residency — Class-1/2 PII never leaves TN-SDC (CC-SPEC-001 §18.3, §2.1). Phase-2 implementation.
package vasa.data.residency
import rego.v1
deny contains "Class-1 PII may reside only in TN-SDC" if {
	input.resource.data_class == "class1"
	input.resource.region != "TN-SDC"
}
