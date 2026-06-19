module github.com/vasa-eos-se-tn/platform/integration

go 1.22

require (
	github.com/vasa-eos-se-tn/platform/adapters v0.0.0
	github.com/vasa-eos-se-tn/platform/agentregistry v0.0.0
	github.com/vasa-eos-se-tn/platform/audit v0.0.0
	github.com/vasa-eos-se-tn/platform/capacity v0.0.0
	github.com/vasa-eos-se-tn/platform/credentials v0.0.0
	github.com/vasa-eos-se-tn/platform/cutover v0.0.0
	github.com/vasa-eos-se-tn/platform/dataplane v0.0.0
	github.com/vasa-eos-se-tn/platform/dr v0.0.0
	github.com/vasa-eos-se-tn/platform/evaluation v0.0.0
	github.com/vasa-eos-se-tn/platform/hitl v0.0.0
	github.com/vasa-eos-se-tn/platform/kms v0.0.0
	github.com/vasa-eos-se-tn/platform/knowledgegraph v0.0.0
	github.com/vasa-eos-se-tn/platform/loadmodel v0.0.0
	github.com/vasa-eos-se-tn/platform/notary v0.0.0
	github.com/vasa-eos-se-tn/platform/offswitch v0.0.0
	github.com/vasa-eos-se-tn/platform/orchestrator v0.0.0
	github.com/vasa-eos-se-tn/platform/pep v0.0.0
	github.com/vasa-eos-se-tn/platform/ratelimit v0.0.0
	github.com/vasa-eos-se-tn/platform/reconcile v0.0.0
	github.com/vasa-eos-se-tn/platform/serving v0.0.0
	github.com/vasa-eos-se-tn/platform/slo v0.0.0
)

require (
	github.com/vasa-eos-se-tn/platform/agents v0.0.0
	github.com/vasa-eos-se-tn/platform/engines v0.0.0
	github.com/vasa-eos-se-tn/platform/escrow-agent v0.0.0
	github.com/vasa-eos-se-tn/platform/guardrails v0.0.0
	github.com/vasa-eos-se-tn/platform/i18n v0.0.0
	github.com/vasa-eos-se-tn/platform/notify v0.0.0
	github.com/vasa-eos-se-tn/platform/resilience v0.0.0 // indirect
	github.com/vasa-eos-se-tn/platform/tokens v0.0.0
	github.com/vasa-eos-se-tn/platform/workflow v0.0.0
)

// The whole platform, wired locally — the integration layer is the composition root that merges every layer
// L1–L12 into end-to-end workflows. CI builds the monorepo together.
replace github.com/vasa-eos-se-tn/platform/offswitch => ../L1-foundation/off-switch-svc

replace github.com/vasa-eos-se-tn/platform/dataplane => ../L3-data-fabric/dataplane

replace github.com/vasa-eos-se-tn/platform/resilience => ../L4-integration/resilience

replace github.com/vasa-eos-se-tn/platform/reconcile => ../L4-integration/reconcile

replace github.com/vasa-eos-se-tn/platform/adapters => ../L4-integration/adapters

replace github.com/vasa-eos-se-tn/platform/evaluation => ../L8-engines/evaluation

replace github.com/vasa-eos-se-tn/platform/cutover => ../operations/cutover

replace github.com/vasa-eos-se-tn/platform/audit => ../L5-security/audit

replace github.com/vasa-eos-se-tn/platform/kms => ../L5-security/kms

replace github.com/vasa-eos-se-tn/platform/pep => ../L5-security/pep

replace github.com/vasa-eos-se-tn/platform/notary => ../L7-knowledge/notary

replace github.com/vasa-eos-se-tn/platform/credentials => ../L7-knowledge/credentials

replace github.com/vasa-eos-se-tn/platform/knowledgegraph => ../L7-knowledge/graph

replace github.com/vasa-eos-se-tn/platform/guardrails => ../L8-engines/guardrails

replace github.com/vasa-eos-se-tn/platform/serving => ../L8-engines/serving

replace github.com/vasa-eos-se-tn/platform/hitl => ../L9-agents/hitl

replace github.com/vasa-eos-se-tn/platform/agentregistry => ../L9-agents/registry

replace github.com/vasa-eos-se-tn/platform/orchestrator => ../L9-agents/orchestrator

replace github.com/vasa-eos-se-tn/platform/ratelimit => ../L10-surfaces/ratelimit

replace github.com/vasa-eos-se-tn/platform/capacity => ../L10-surfaces/capacity

replace github.com/vasa-eos-se-tn/platform/loadmodel => ../L10-surfaces/loadmodel

replace github.com/vasa-eos-se-tn/platform/dr => ../operations/dr

replace github.com/vasa-eos-se-tn/platform/slo => ../operations/slo

replace github.com/vasa-eos-se-tn/platform/agents => ../L9-agents/agents

replace github.com/vasa-eos-se-tn/platform/engines => ../L8-engines/engines

replace github.com/vasa-eos-se-tn/platform/escrow-agent => ../L1-foundation/escrow-agent

replace github.com/vasa-eos-se-tn/platform/workflow => ../L6-platform-services/workflow

replace github.com/vasa-eos-se-tn/platform/i18n => ../L6-platform-services/i18n

replace github.com/vasa-eos-se-tn/platform/notify => ../L6-platform-services/notify

replace github.com/vasa-eos-se-tn/platform/tokens => ../L8-engines/tokens
