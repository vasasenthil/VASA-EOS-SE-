# AI drift gate — PSI/KL threshold; canary rollback (CC-SPEC-001 §5.1, §17.6).
package vasa.ai.drift

import rego.v1

deny contains d if {
	input.action == "model.serve"
	input.metrics.psi > 0.2
	d := {"rule": "AI-DRIFT", "citation": "§5.1: population-stability index above threshold; canary rollback required before continued serving."}
}
