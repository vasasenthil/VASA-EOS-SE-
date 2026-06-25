package integration

import (
	"context"
	"testing"
)

func TestPolicyLeverProjectsAndRequiresHumanSanction(t *testing.T) {
	p := newPlatform(t)
	before := p.Audit.Len()
	out := p.SimulatePolicyLever(context.Background(), PolicyLeverRequest{
		Name: "Free-cycle scheme expansion", CurrentCoverage: 0.6, CoverageDelta: 0.25, CostPerUnit: 4500, EquityWeight: 0.8,
	})
	// the projection runs over the 1.27 Cr default population.
	if out.Projection.NewCoverage <= 0.6 || out.Projection.NewlyCovered == 0 || out.Projection.Cost == 0 {
		t.Fatalf("the lever must project a positive coverage/cost impact: %+v", out.Projection)
	}
	// it is high-stakes → never auto-adopts; it waits for a sanctioning authority.
	if !out.RequiresApproval || out.RequestID == "" {
		t.Fatalf("a policy lever must require human sanction + be queued: %+v", out)
	}
	if len(p.PendingPolicyLevers()) != 1 {
		t.Fatalf("expected 1 pending policy lever, got %d", len(p.PendingPolicyLevers()))
	}
	if p.Audit.Len() <= before {
		t.Fatal("simulating a lever must be audited")
	}

	// a sanctioning authority approves → the executor records the adoption.
	adoptBefore := p.Audit.Len()
	if _, err := p.DecidePolicyLever(context.Background(), out.RequestID, true, "MINISTER"); err != nil {
		t.Fatalf("a sanctioning authority should be able to approve: %v", err)
	}
	if p.Audit.Len() <= adoptBefore {
		t.Fatal("adopting a lever must be audited")
	}
	if len(p.PendingPolicyLevers()) != 0 {
		t.Fatal("the queue must be empty after the decision")
	}
}

func TestPolicyLeverRejectionStops(t *testing.T) {
	p := newPlatform(t)
	out := p.SimulatePolicyLever(context.Background(), PolicyLeverRequest{Name: "Costly low-equity lever", CurrentCoverage: 0.9, CoverageDelta: 0.02, CostPerUnit: 90000, EquityWeight: 0.1})
	// an authority can reject a poorly-projected lever; nothing is adopted.
	if _, err := p.DecidePolicyLever(context.Background(), out.RequestID, false, "MINISTER"); err != nil {
		t.Fatalf("rejection should be a valid decision: %v", err)
	}
	if len(p.PendingPolicyLevers()) != 0 {
		t.Fatal("a rejected lever must leave the queue")
	}
}
