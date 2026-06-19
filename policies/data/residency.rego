# Data residency — Class-1/2 PII may reside only in TN-SDC (CC-SPEC-001 §18.3, §2.1).
package vasa.data.residency

import rego.v1
import data.vasa.data.classification

deny contains d if {
	c := classification.class with input as input
	c in {"class1", "class2"}
	input.resource.region != "TN-SDC"
	d := {"rule": "DATA-RESIDENCY", "citation": "Class-1/2 PII must reside only in the TN State Data Centre; cross-region/border placement is blocked."}
}
