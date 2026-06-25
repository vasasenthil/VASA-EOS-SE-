package integration

import (
	"context"

	registry "github.com/vasa-eos-se-tn/platform/agentregistry"
	"github.com/vasa-eos-se-tn/platform/agents"
	"github.com/vasa-eos-se-tn/platform/orchestrator"
)

// Advise runs an agent's recommendation through the L9 orchestration: the agent (L9, composing the L8
// engines) proposes a tool call with a confidence; the orchestrator routes it auto vs human-in-the-loop by
// the agent's stakes, the tool's risk, and the confidence. This is the full cognition→authority path:
// engines → agent → orchestrator → (auto-execute | HITL queue). Every proposal is audited.
func (p *Platform) Advise(ctx context.Context, rec agents.Recommendation, tool string, args map[string]any) (orchestrator.Outcome, error) {
	out, err := p.Orchestrator.Run(ctx, orchestrator.Proposal{
		Agent:      registry.AgentID(rec.Agent),
		Tool:       tool,
		Args:       args,
		Confidence: rec.Confidence,
	})
	if err != nil {
		p.appendAudit("agent:"+rec.Agent, "agent.advise.error", tool, "error", err.Error())
		p.recordOutcome(false)
		return orchestrator.Outcome{}, err
	}
	p.appendAudit("agent:"+rec.Agent, "agent.advise", tool, string(out.State), rec.Summary)
	p.recordOutcome(true)
	return out, nil
}
