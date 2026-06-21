package integration

import (
	"context"
	"testing"
)

func TestCouncilVoteIsAdvisoryAndRatified(t *testing.T) {
	p := newPlatform(t)
	before := p.Audit.Len()
	cv := p.DemoCouncilVote(context.Background(), "33010100101", "Adopt the new library-hours plan")

	// the proposal passes (3 yes / 1 no = 75% over quorum 3).
	if cv.Outcome.Status != "passed" || cv.Outcome.Yes != 3 || cv.Outcome.No != 1 {
		t.Fatalf("council vote should pass 3-1: %+v", cv.Outcome)
	}
	// it is advisory and routed to the statutory authority for ratification.
	if !cv.Outcome.Advisory || !cv.Outcome.NeedsRatify || cv.RatifyReq == "" {
		t.Fatalf("a passed council proposal must be advisory + queued for ratification: %+v", cv)
	}
	if p.Audit.Len() <= before {
		t.Fatal("the council vote must be audited")
	}
	// the head teacher ratifies (HITL).
	ratBefore := p.Audit.Len()
	if _, err := p.RatifyCouncil(context.Background(), cv.RatifyReq, true, "HEAD_TEACHER"); err != nil {
		t.Fatalf("the statutory authority should be able to ratify: %v", err)
	}
	if p.Audit.Len() <= ratBefore {
		t.Fatal("ratification must be audited")
	}
}
