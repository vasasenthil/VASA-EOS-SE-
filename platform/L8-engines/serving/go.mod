module github.com/vasa-eos-se-tn/platform/serving

go 1.22

require (
	github.com/vasa-eos-se-tn/platform/guardrails v0.0.0
	github.com/vasa-eos-se-tn/platform/resilience v0.0.0
)

// Monorepo-local modules (no external registry; stdlib-only). CI builds the whole tree together.
replace github.com/vasa-eos-se-tn/platform/guardrails => ../guardrails

replace github.com/vasa-eos-se-tn/platform/resilience => ../../L4-integration/resilience
