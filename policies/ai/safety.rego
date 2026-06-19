# AI safety gate (POCSO / jailbreak / prompt-injection) — CC-SPEC-001 §17.6
package vasa.ai.safety

import rego.v1

# Block generation that is unsafe for a minor, flagged for injection, or below the safety threshold.
deny contains d if {
	input.minor == true
	input.classification.age_appropriate == false
	d := {"rule": "AI-AGE-INAPPROPRIATE", "citation": "POCSO §17.6: content surfaced to a minor must pass the age-appropriate filter."}
}

deny contains d if {
	input.signals.prompt_injection == true
	d := {"rule": "AI-PROMPT-INJECTION", "citation": "Prompt-injection detected; tool-use boundary enforced."}
}

deny contains d if {
	input.signals.safety_score < 0.5
	d := {"rule": "AI-UNSAFE", "citation": "Output below the safety classifier threshold; refused."}
}
