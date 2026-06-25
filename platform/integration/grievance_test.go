package integration

import (
	"context"
	"testing"
)

func TestRouteGrievanceGroundedToBlock(t *testing.T) {
	p := newPlatform(t)
	before := p.Audit.Len()
	out := p.RouteGrievance(context.Background(), GrievanceInput{
		ID: "GRV-1", Citizen: "Anbu", Subject: "mid-day meal quality and hygiene complaint at our school",
	})
	if !out.Routed || out.Tier != "block" {
		t.Fatalf("a grounded meal-quality grievance should route to the block: %+v", out)
	}
	if out.RequiresApproval {
		t.Fatalf("a policy-grounded grievance should not require human confirmation: %+v", out)
	}
	// it is filed in the L12 civic tracker and audited.
	if out.Grievance.ID != "GRV-1" || out.Grievance.Tier != "block" {
		t.Fatalf("grievance must be filed in the civic tracker: %+v", out.Grievance)
	}
	if p.Audit.Len() <= before {
		t.Fatal("routing must extend the audit chain")
	}
}

func TestRouteGrievancePOCSOEscalatesToDistrict(t *testing.T) {
	p := newPlatform(t)
	out := p.RouteGrievance(context.Background(), GrievanceInput{
		ID: "GRV-2", Citizen: "Bala", Subject: "a child protection pocso safety concern about a student",
	})
	if out.Tier != "district" {
		t.Fatalf("a POCSO/child-protection grievance must escalate to the district: %+v", out)
	}
}

func TestRouteGrievanceUngroundedGoesToHITL(t *testing.T) {
	p := newPlatform(t)
	out := p.RouteGrievance(context.Background(), GrievanceInput{
		ID: "GRV-3", Citizen: "Cholan", Subject: "xyzzy unrelated nonsense with no governing policy",
	})
	// no governing policy → escalate to the directorate, NOT auto-filed: it waits in the HITL queue.
	if out.Tier != "directorate" || !out.RequiresApproval || !out.PendingApproval || out.RequestID == "" {
		t.Fatalf("an ungrounded grievance must be queued for a human, not auto-filed: %+v", out)
	}
	if out.Routed {
		t.Fatal("an ungrounded grievance must NOT be filed until a human approves")
	}
	// it is not yet in the civic tracker.
	if _, ok := p.ResolveGrievance("GRV-3"); ok {
		t.Fatal("a queued grievance must not exist in the tracker before approval")
	}
	// it appears in the pending-approval queue.
	if len(p.PendingGrievances()) != 1 {
		t.Fatalf("expected 1 pending grievance, got %d", len(p.PendingGrievances()))
	}
	// the tier officer confirms → the executor files it into the civic tracker.
	if _, err := p.DecideGrievance(context.Background(), out.RequestID, true, "DEO-Chennai"); err != nil {
		t.Fatalf("officer confirmation should succeed: %v", err)
	}
	g, ok := p.ResolveGrievance("GRV-3")
	if !ok || g.Tier != "directorate" {
		t.Fatalf("after approval the grievance must be filed at the directorate: %+v ok=%v", g, ok)
	}
}
