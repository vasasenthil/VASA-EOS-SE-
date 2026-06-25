module github.com/vasa-eos-se-tn/platform/adapters

go 1.22

require (
	github.com/vasa-eos-se-tn/platform/reconcile v0.0.0
	github.com/vasa-eos-se-tn/platform/resilience v0.0.0
)

// Monorepo-local modules (no external registry; stdlib-only). CI builds the whole tree together.
replace github.com/vasa-eos-se-tn/platform/reconcile => ../reconcile

replace github.com/vasa-eos-se-tn/platform/resilience => ../resilience
