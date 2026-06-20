package integration

import (
	"context"
	"strings"

	"github.com/vasa-eos-se-tn/platform/agents"
	"github.com/vasa-eos-se-tn/platform/civic"
	"github.com/vasa-eos-se-tn/platform/engines"
)

// grievancePolicyCorpus is the small governing-policy corpus the L9 grievance agent cites when routing. In
// production this is the L7 TN-canon retriever; here it is a public, deterministic policy set so the routing
// is grounded and reproducible.
func grievancePolicyCorpus() []engines.Doc {
	return []engines.Doc{
		{ID: "RTE-S12", Text: "rte act section 12 admission denial under the 25 percent quota is routed to the block education officer"},
		{ID: "POCSO-MR", Text: "a child safety or pocso concern is escalated immediately to the district child protection officer as a mandatory report"},
		{ID: "MDM-QUAL", Text: "mid-day meal quality and hygiene complaints are routed to the block for inspection and supplier action"},
		{ID: "SCHOL-DBT", Text: "scholarship or dbt non-credit grievances are routed to the directorate finance cell for fund-flow reconciliation"},
		{ID: "INFRA", Text: "school infrastructure water sanitation and building safety issues are routed to the block engineering wing"},
	}
}

// GrievanceInput is a citizen grievance to route.
type GrievanceInput struct {
	ID      string `json:"id"`
	Subject string `json:"subject"` // the grievance text/query
	Citizen string `json:"citizen"`
}

// GrievanceOutcome is the end-to-end routing result: the L9 agent's advisory routing, the tier the grievance
// was filed at in the L12 civic tracker, and whether a human must confirm the routing.
type GrievanceOutcome struct {
	ID               string          `json:"id"`
	Routed           bool            `json:"routed"`
	Tier             string          `json:"tier"`
	Recommendation   string          `json:"recommendation"`
	CitedPolicy      string          `json:"cited_policy,omitempty"`
	Confidence       float64         `json:"confidence"`
	RequiresApproval bool            `json:"requires_approval"`
	Grievance        civic.Grievance `json:"grievance"`
	AuditSeq         uint64          `json:"audit_seq"`
}

// tierFromCitation maps the policy the grievance agent cited to the governance tier that handles it. An
// ungrounded grievance (no citation) escalates to the directorate for manual routing.
func tierFromCitation(detail string, grounded bool) (tier, policy string) {
	if !grounded {
		return "directorate", ""
	}
	switch {
	case strings.Contains(detail, "child protection") || strings.Contains(detail, "pocso"):
		return "district", "POCSO-MR"
	case strings.Contains(detail, "directorate finance"):
		return "directorate", "SCHOL-DBT"
	default:
		return "block", "field-policy"
	}
}

// RouteGrievance runs a citizen grievance end-to-end: the L9 grievance agent recommends a routing grounded in
// governing policy (L8 conversational engine over the policy corpus), the grievance is filed into the L12
// civic tracker at the resolved governance tier, and the routing is written to the L5 audit chain. A low-
// confidence (ungrounded) routing is flagged for human confirmation (HITL) rather than auto-actioned.
func (p *Platform) RouteGrievance(ctx context.Context, in GrievanceInput) GrievanceOutcome {
	rec := agents.Grievance(in.Subject, grievancePolicyCorpus())
	grounded := !rec.RequiresApproval // the grievance agent only clears approval when it found a governing policy
	tier, policy := tierFromCitation(rec.Detail, grounded)

	g := p.Civic.FileGrievance(in.ID, in.Subject, in.Citizen, tier)
	p.appendAudit("citizen:"+in.Citizen, "grievance.route", in.ID, tier, rec.Agent)

	return GrievanceOutcome{
		ID: in.ID, Routed: true, Tier: tier, Recommendation: rec.Summary, CitedPolicy: policy,
		Confidence: rec.Confidence, RequiresApproval: rec.RequiresApproval, Grievance: g,
		AuditSeq: uint64(p.Audit.Len()),
	}
}

// ResolveGrievance closes a grievance in the L12 civic tracker (after the tier officer has acted).
func (p *Platform) ResolveGrievance(id string) (civic.Grievance, bool) {
	return p.Civic.ResolveGrievance(id)
}
