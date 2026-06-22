module github.com/vasa-eos-se-tn/platform/integration

go 1.22

require (
	github.com/vasa-eos-se-tn/platform/adapters v0.0.0
	github.com/vasa-eos-se-tn/platform/agentregistry v0.0.0
	github.com/vasa-eos-se-tn/platform/audit v0.0.0
	github.com/vasa-eos-se-tn/platform/calendar v0.0.0
	github.com/vasa-eos-se-tn/platform/capacity v0.0.0
	github.com/vasa-eos-se-tn/platform/credentials v0.0.0
	github.com/vasa-eos-se-tn/platform/cutover v0.0.0
	github.com/vasa-eos-se-tn/platform/dataplane v0.0.0
	github.com/vasa-eos-se-tn/platform/dr v0.0.0
	github.com/vasa-eos-se-tn/platform/evaluation v0.0.0
	github.com/vasa-eos-se-tn/platform/exams v0.0.0
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
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/pgx/v5 v5.6.0 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/sync v0.6.0 // indirect
	golang.org/x/text v0.14.0 // indirect
)

require (
	github.com/vasa-eos-se-tn/platform/agents v0.0.0
	github.com/vasa-eos-se-tn/platform/alignments v0.0.0
	github.com/vasa-eos-se-tn/platform/attendance v0.0.0
	github.com/vasa-eos-se-tn/platform/catalogue v0.0.0
	github.com/vasa-eos-se-tn/platform/civic v0.0.0
	github.com/vasa-eos-se-tn/platform/consent v0.0.0
	github.com/vasa-eos-se-tn/platform/cpd v0.0.0
	github.com/vasa-eos-se-tn/platform/dao v0.0.0
	github.com/vasa-eos-se-tn/platform/directory v0.0.0
	github.com/vasa-eos-se-tn/platform/edge v0.0.0
	github.com/vasa-eos-se-tn/platform/engines v0.0.0
	github.com/vasa-eos-se-tn/platform/escrow-agent v0.0.0
	github.com/vasa-eos-se-tn/platform/govtiers v0.0.0
	github.com/vasa-eos-se-tn/platform/grievance v0.0.0
	github.com/vasa-eos-se-tn/platform/guardrails v0.0.0
	github.com/vasa-eos-se-tn/platform/i18n v0.0.0
	github.com/vasa-eos-se-tn/platform/iot v0.0.0
	github.com/vasa-eos-se-tn/platform/leave v0.0.0
	github.com/vasa-eos-se-tn/platform/loop v0.0.0
	github.com/vasa-eos-se-tn/platform/modelregistry v0.0.0
	github.com/vasa-eos-se-tn/platform/modulecatalogue v0.0.0
	github.com/vasa-eos-se-tn/platform/ndears v0.0.0
	github.com/vasa-eos-se-tn/platform/notify v0.0.0
	github.com/vasa-eos-se-tn/platform/onboarding v0.0.0
	github.com/vasa-eos-se-tn/platform/population v0.0.0
	github.com/vasa-eos-se-tn/platform/portals v0.0.0
	github.com/vasa-eos-se-tn/platform/quality v0.0.0
	github.com/vasa-eos-se-tn/platform/rbsk v0.0.0
	github.com/vasa-eos-se-tn/platform/resilience v0.0.0 // indirect
	github.com/vasa-eos-se-tn/platform/retrieval v0.0.0
	github.com/vasa-eos-se-tn/platform/scholarship v0.0.0
	github.com/vasa-eos-se-tn/platform/seed v0.0.0
	github.com/vasa-eos-se-tn/platform/tenancy v0.0.0
	github.com/vasa-eos-se-tn/platform/tokens v0.0.0
	github.com/vasa-eos-se-tn/platform/volumes v0.0.0
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

replace github.com/vasa-eos-se-tn/platform/loop => ../L9-agents/loop

replace github.com/vasa-eos-se-tn/platform/retrieval => ../L7-knowledge/retrieval

replace github.com/vasa-eos-se-tn/platform/seed => ../L3-data-fabric/seed

replace github.com/vasa-eos-se-tn/platform/onboarding => ../L3-data-fabric/onboarding

replace github.com/vasa-eos-se-tn/platform/quality => ../L3-data-fabric/quality

replace github.com/vasa-eos-se-tn/platform/volumes => ../L10-surfaces/volumes

replace github.com/vasa-eos-se-tn/platform/catalogue => ../L3-data-fabric/catalogue

replace github.com/vasa-eos-se-tn/platform/modelregistry => ../L8-engines/modelregistry

replace github.com/vasa-eos-se-tn/platform/consent => ../L3-data-fabric/consent

replace github.com/vasa-eos-se-tn/platform/population => ../L3-data-fabric/population

replace github.com/vasa-eos-se-tn/platform/tenancy => ../L6-platform-services/tenancy

replace github.com/vasa-eos-se-tn/platform/govtiers => ../L11-governance/govtiers

replace github.com/vasa-eos-se-tn/platform/portals => ../L10-surfaces/portals

replace github.com/vasa-eos-se-tn/platform/ndears => ../L4-integration/ndears

replace github.com/vasa-eos-se-tn/platform/alignments => ../L11-governance/alignments

replace github.com/vasa-eos-se-tn/platform/modulecatalogue => ../L11-governance/catalogue

replace github.com/vasa-eos-se-tn/platform/civic => ../L12-civic/civic

replace github.com/vasa-eos-se-tn/platform/iot => ../L4-integration/iot

replace github.com/vasa-eos-se-tn/platform/edge => ../L2-infrastructure/edge

replace github.com/vasa-eos-se-tn/platform/dao => ../L11-governance/dao

replace github.com/vasa-eos-se-tn/platform/directory => ../L5-security/directory

replace github.com/vasa-eos-se-tn/platform/calendar => ../L6-platform-services/calendar

replace github.com/vasa-eos-se-tn/platform/exams => ../L6-platform-services/exams

replace github.com/vasa-eos-se-tn/platform/leave => ../L6-platform-services/leave

replace github.com/vasa-eos-se-tn/platform/grievance => ../L12-civic/grievance

replace github.com/vasa-eos-se-tn/platform/attendance => ../L6-platform-services/attendance

replace github.com/vasa-eos-se-tn/platform/scholarship => ../L6-platform-services/scholarship

replace github.com/vasa-eos-se-tn/platform/cpd => ../L6-platform-services/cpd

replace github.com/vasa-eos-se-tn/platform/rbsk => ../L12-civic/rbsk
