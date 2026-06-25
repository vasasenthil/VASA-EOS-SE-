package integration

import (
	"github.com/vasa-eos-se-tn/platform/govtiers"
	"github.com/vasa-eos-se-tn/platform/notify"
	"github.com/vasa-eos-se-tn/platform/workflow"
)

// SanctionDefinitionFor builds the scheme-sanction approval flow from the L11 governance-tier register: its
// steps ARE the govtiers escalation path for the decision's stakes. A high-stakes sanction (a large/novel
// scheme) escalates G4 PMU → G3 Inter-Directorate → G2 Empowered Committee → G1 State Cabinet; a routine one
// runs G4 PMU → G5 Architecture → G6 Ethics. Each step's approver role + required scope come straight from the
// register, so the governance hierarchy — not a hard-coded list — drives who must sign and in what order.
func (p *Platform) SanctionDefinitionFor(highStakes bool) workflow.Definition {
	d := workflow.Definition{Name: "scheme-sanction"}
	for _, code := range govtiers.EscalationPath(highStakes) {
		t, ok := govtiers.TierFor(code)
		if !ok {
			continue
		}
		d.Steps = append(d.Steps, workflow.Step{
			Name: t.Code + " " + t.Name, ApproverRole: t.ApproverRole, RequiredScope: t.RequiredScope,
		})
	}
	return d
}

// SanctionDefinition is the default (high-stakes) scheme-sanction flow, retained for callers that don't
// distinguish stakes — it escalates all the way to the Cabinet (G1).
func (p *Platform) SanctionDefinition() workflow.Definition { return p.SanctionDefinitionFor(true) }

// StartSanction opens a scheme-sanction workflow instance at the stakes-appropriate escalation and audits it.
func (p *Platform) StartSanction(id string, highStakes bool) (*workflow.Instance, error) {
	def := p.SanctionDefinitionFor(highStakes)
	in, err := workflow.Start(def, id)
	if err != nil {
		return nil, err
	}
	stakes := "routine"
	if highStakes {
		stakes = "high-stakes"
	}
	p.appendAudit("system", "workflow.start", id, string(in.Status), "scheme-sanction:"+stakes)
	return in, nil
}

// ActSanction applies a tier decision to a sanction instance (role + scope gated by the workflow engine) and
// audits the transition. The definition must match the instance's stakes (use the same highStakes value).
func (p *Platform) ActSanction(in *workflow.Instance, highStakes bool, decision workflow.Decision, actor, role string, scopes []string, note string) error {
	d := p.SanctionDefinitionFor(highStakes)
	if err := d.Act(in, decision, actor, role, scopes, note, p.now); err != nil {
		return err
	}
	p.appendAudit("role:"+role, "workflow.act", in.ID, string(in.Status), string(decision))
	return nil
}

// SanctionEscalation returns the ordered governance tiers a sanction of the given stakes must pass — the
// register-driven approval chain (G4→G3→G2→G1 for high-stakes; G4→G5→G6 for routine).
func (p *Platform) SanctionEscalation(highStakes bool) []govtiers.Tier {
	var out []govtiers.Tier
	for _, code := range govtiers.EscalationPath(highStakes) {
		if t, ok := govtiers.TierFor(code); ok {
			out = append(out, t)
		}
	}
	return out
}

// Notifications returns the inbox notifications addressed to a recipient (the role-gated inbox surface).
func (p *Platform) Notifications(to string) []notify.Notification { return p.Inbox.For(to) }
