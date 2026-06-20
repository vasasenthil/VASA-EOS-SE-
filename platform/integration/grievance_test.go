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

func TestRouteGrievanceUngroundedRequiresHuman(t *testing.T) {
	p := newPlatform(t)
	out := p.RouteGrievance(context.Background(), GrievanceInput{
		ID: "GRV-3", Citizen: "Cholan", Subject: "xyzzy unrelated nonsense with no governing policy",
	})
	// no governing policy → escalate to the directorate for manual routing, flagged for a human.
	if out.Tier != "directorate" || !out.RequiresApproval {
		t.Fatalf("an ungrounded grievance must escalate + require human confirmation: %+v", out)
	}
	// the tier officer can resolve it in the tracker.
	if _, ok := p.ResolveGrievance("GRV-3"); !ok {
		t.Fatal("resolving a filed grievance must succeed")
	}
}
