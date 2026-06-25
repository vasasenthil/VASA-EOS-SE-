# DPDP Act 2023 — Policy-as-Code (CC-SPEC-001 §2.4, §8.5, §18, §20)
package vasa.regulatory.dpdp

import rego.v1

# §6 — personal data processed only for a lawful purpose WITH consent; §9 — a minor needs guardian consent.
deny contains d if {
	input.action in {"pii.process", "pii.share"}
	not has_lawful_consent
	d := {
		"rule": "DPDP-CONSENT",
		"act": "DPDP Act 2023 §6/§9",
		"citation": "Personal data may be processed only for a lawful purpose with consent; a minor requires verifiable guardian consent.",
	}
}

# §8(7) — erase personal data once the purpose is served / retention is not required.
deny contains d if {
	input.action == "pii.retain"
	input.resource.pastRetention == true
	d := {
		"rule": "DPDP-RETENTION",
		"act": "DPDP Act 2023 §8(7)",
		"citation": "A data fiduciary must erase personal data once the purpose is served and retention is not required.",
	}
}

# §16 — cross-border transfer disabled by default; blocked at egress.
deny contains d if {
	input.action == "pii.transfer"
	input.resource.crossBorder == true
	d := {
		"rule": "DPDP-CROSS-BORDER",
		"act": "DPDP Act 2023 §16",
		"citation": "Cross-border transfer of personal data is disabled by default and blocked at network egress.",
	}
}

has_lawful_consent if {
	input.resource.consent == true
	input.resource.age >= 18
}

has_lawful_consent if {
	input.resource.consent == true
	input.resource.age < 18
	input.resource.guardianConsent == true
}
