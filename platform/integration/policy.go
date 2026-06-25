package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/agents"
	"github.com/vasa-eos-se-tn/platform/engines"
	"github.com/vasa-eos-se-tn/platform/hitl"
)

// PolicyLeverRequest is a what-if policy intervention to project for a sanctioning authority.
type PolicyLeverRequest struct {
	Name            string  `json:"name"`             // e.g. "Free-cycle scheme expansion to Class 9"
	Population      int     `json:"population"`       // baseline population (default: 1.27 Cr students)
	CurrentCoverage float64 `json:"current_coverage"` // [0,1]
	CoverageDelta   float64 `json:"coverage_delta"`   // additive change (can be negative)
	CostPerUnit     float64 `json:"cost_per_unit"`    // ₹ per newly-covered person
	EquityWeight    float64 `json:"equity_weight"`    // [0,1] — how much the gain favours the underserved
}

// PolicyLeverOutcome is the projected impact plus the human-sanction routing. The Policy agent is HIGH-STAKES
// and only ever advisory: the projection NEVER auto-adopts — a sanctioning authority (G1/G2, policy.sanction
// scope) must approve via the HITL queue before the lever is recorded as adopted.
type PolicyLeverOutcome struct {
	Lever            string             `json:"lever"`
	Projection       engines.Projection `json:"projection"`
	Recommendation   string             `json:"recommendation"`
	RequiresApproval bool               `json:"requires_approval"` // always true (high-stakes)
	RequestID        string             `json:"request_id,omitempty"`
	AuditSeq         uint64             `json:"audit_seq"`
}

// SimulatePolicyLever projects a policy lever's coverage/cost/equity impact (L8 Policy engine via the L9 Policy
// agent) and routes the high-stakes adoption to the HITL queue for a sanctioning authority. AI assists; the
// human authority decides — the projection is advisory and is recorded as adopted only on human approval.
func (p *Platform) SimulatePolicyLever(ctx context.Context, req PolicyLeverRequest) PolicyLeverOutcome {
	if req.Population <= 0 {
		req.Population = 12_700_000 // the §D.1 student population
	}
	baseline := engines.Baseline{Population: req.Population, CurrentCoverage: req.CurrentCoverage}
	lever := engines.Lever{Name: req.Name, CoverageDelta: req.CoverageDelta, CostPerUnit: req.CostPerUnit, EquityWeight: req.EquityWeight}

	proj := engines.Project(baseline, lever)
	rec := agents.Policy(baseline, lever) // high-stakes, advisory

	out := PolicyLeverOutcome{
		Lever: req.Name, Projection: proj, Recommendation: rec.Summary, RequiresApproval: rec.RequiresApproval,
	}
	// high-stakes → never auto-adopt: queue for a sanctioning authority.
	if r, err := p.Queue.Enqueue("policy", "policy.adopt",
		map[string]any{"lever": req.Name, "summary": rec.Summary}, "policy.sanction"); err == nil {
		out.RequestID = r.ID
	}
	p.appendAudit("system", "policy.simulate", req.Name, "projected", rec.Summary)
	out.AuditSeq = uint64(p.Audit.Len())
	return out
}

// DecidePolicyLever is the sanctioning authority's decision on a queued policy lever: approving it records the
// lever as adopted (via the HITL executor); rejecting closes the request. The approver must hold policy.sanction.
func (p *Platform) DecidePolicyLever(ctx context.Context, requestID string, approve bool, authority string) (hitl.Request, error) {
	return p.Queue.Decide(ctx, requestID, approve, hitl.Approver{ID: authority, Scopes: []string{"policy.sanction"}})
}

// PendingPolicyLevers returns the policy adoptions awaiting a sanctioning authority.
func (p *Platform) PendingPolicyLevers() []hitl.Request {
	var out []hitl.Request
	for _, r := range p.Queue.Pending() {
		if r.Tool == "policy.adopt" {
			out = append(out, r)
		}
	}
	return out
}
