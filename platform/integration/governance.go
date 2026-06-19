package integration

import (
	"github.com/vasa-eos-se-tn/platform/notify"
	"github.com/vasa-eos-se-tn/platform/workflow"
)

// SanctionDefinition is the canonical G3→G5→G7 scheme-sanction approval flow (L6 workflow engine): a District
// Officer recommends, a Director approves, the Secretary releases funds — each gated to a role + scope.
func (p *Platform) SanctionDefinition() workflow.Definition {
	return workflow.Definition{
		Name: "scheme-sanction",
		Steps: []workflow.Step{
			{Name: "G3 District Officer", ApproverRole: "DEO", RequiredScope: "scheme.recommend"},
			{Name: "G5 Director", ApproverRole: "DIRECTOR", RequiredScope: "scheme.approve"},
			{Name: "G7 Secretary", ApproverRole: "SECRETARY", RequiredScope: "fund.release"},
		},
	}
}

// StartSanction opens a scheme-sanction workflow instance and audits it.
func (p *Platform) StartSanction(id string) (*workflow.Instance, error) {
	in, err := workflow.Start(p.SanctionDefinition(), id)
	if err != nil {
		return nil, err
	}
	p.appendAudit("system", "workflow.start", id, string(in.Status), "scheme-sanction")
	return in, nil
}

// ActSanction applies a tier decision to a sanction instance (role + scope gated by the workflow engine) and
// audits the transition.
func (p *Platform) ActSanction(in *workflow.Instance, decision workflow.Decision, actor, role string, scopes []string, note string) error {
	d := p.SanctionDefinition()
	if err := d.Act(in, decision, actor, role, scopes, note, p.now); err != nil {
		return err
	}
	p.appendAudit("role:"+role, "workflow.act", in.ID, string(in.Status), string(decision))
	return nil
}

// Notifications returns the inbox notifications addressed to a recipient (the role-gated inbox surface).
func (p *Platform) Notifications(to string) []notify.Notification { return p.Inbox.For(to) }
