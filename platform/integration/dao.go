package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/dao"
	"github.com/vasa-eos-se-tn/platform/hitl"
)

// CouncilVote is a deterministic SMC (School Management Committee) deliberation: a council of soulbound members
// votes a proposal, and — because a DAO decision is ADVISORY to the statutory authority — a passed proposal is
// routed to the HITL queue for the head teacher / BEO to ratify. The council recommends; the human authority
// decides. The Besu/Snapshot substrate is gated (B-020); this runs the sovereign council-governance logic.
type CouncilVote struct {
	Outcome   dao.Outcome `json:"outcome"`
	RatifyReq string      `json:"ratify_request_id,omitempty"` // HITL request when the proposal passed
	AuditSeq  uint64      `json:"audit_seq"`
}

// DemoCouncilVote runs a representative council deliberation (4 soulbound members, a proposal that passes), and
// routes the advisory result to the statutory authority for ratification.
func (p *Platform) DemoCouncilVote(ctx context.Context, udise, title string) CouncilVote {
	c := dao.NewCouncil("SMC-"+udise, "SMC "+udise, udise, p.now)
	c.IssueBadge("parent-1", "parent")
	c.IssueBadge("parent-2", "parent")
	c.IssueBadge("teacher-1", "teacher")
	c.IssueBadge("head-1", "head-teacher")

	prop := c.Propose("PROP-"+udise, title)
	_ = prop.Cast("parent-1", dao.Yes)
	_ = prop.Cast("parent-2", dao.Yes)
	_ = prop.Cast("teacher-1", dao.Yes)
	_ = prop.Cast("head-1", dao.No)
	out := prop.Tally(3, 0.6)

	res := CouncilVote{Outcome: out}
	p.appendAudit("council:"+udise, "council.vote", out.ProposalID, string(out.Status), title)

	// a passed (advisory) proposal must be ratified by the statutory authority — route to HITL.
	if out.NeedsRatify {
		if r, err := p.Queue.Enqueue("council", "council.ratify",
			map[string]any{"proposal": out.ProposalID, "title": title}, "council.ratify"); err == nil {
			res.RatifyReq = r.ID
		}
	}
	res.AuditSeq = uint64(p.Audit.Len())
	return res
}

// RatifyCouncil is the statutory authority's ratification of a passed council proposal (HITL). Approving records
// the ratification; the authority must hold council.ratify.
func (p *Platform) RatifyCouncil(ctx context.Context, requestID string, approve bool, authority string) (hitl.Request, error) {
	return p.Queue.Decide(ctx, requestID, approve, hitl.Approver{ID: authority, Scopes: []string{"council.ratify"}})
}
