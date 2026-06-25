# AI bias/fairness gate — a deployment requires a current AIF360/FairLearn attestation (CC-SPEC-001 §17.6).
package vasa.ai.bias

import rego.v1

deny contains d if {
	input.action == "model.deploy"
	not input.model.bias_attestation_signed
	d := {"rule": "AI-BIAS-ATTESTATION", "citation": "§17.6: no model deploys without a signed bias/fairness (AIF360/FairLearn) attestation in its model card."}
}
