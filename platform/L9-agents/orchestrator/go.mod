module github.com/vasa-eos-se-tn/platform/orchestrator

go 1.22

require (
	github.com/vasa-eos-se-tn/platform/agentregistry v0.0.0
	github.com/vasa-eos-se-tn/platform/hitl v0.0.0
)

// Monorepo-local modules (no external registry; stdlib-only). CI builds the whole tree together.
replace github.com/vasa-eos-se-tn/platform/agentregistry => ../registry

replace github.com/vasa-eos-se-tn/platform/hitl => ../hitl
