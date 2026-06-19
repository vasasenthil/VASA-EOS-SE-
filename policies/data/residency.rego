# Data residency — Class-1/2 PII may reside only within TN sovereign regions (CC-SPEC-001 §18.3, §2.1, §10.3).
package vasa.data.residency

import rego.v1
import data.vasa.data.classification

# TN-sovereign regions: the primary State Data Centre (Chennai) and its in-state DR (Coimbatore). Both are
# under TN custody, so active-active/DR placement of PII stays sovereign (§10.3 multi-region, BLOCKERS B-004).
sovereign_regions := {"TN-SDC", "TN-SDC-DR"}

deny contains d if {
	c := classification.class with input as input
	c in {"class1", "class2"}
	not input.resource.region in sovereign_regions
	d := {"rule": "DATA-RESIDENCY", "citation": "Class-1/2 PII must reside only within TN sovereign regions (State Data Centre + in-state DR); cross-region/border placement is blocked."}
}
