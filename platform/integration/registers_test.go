package integration

import "testing"

func TestPlatformGovernanceAndPortals(t *testing.T) {
	p := newPlatform(t)
	if len(p.GovernanceTiers()) != 7 || len(p.ControlTower()) != 3 {
		t.Fatalf("L11 governance must expose 7 tiers + 3 control-tower bodies")
	}
	if len(p.Portals()) != 13 {
		t.Fatalf("L10 must expose the 13 stakeholder portals, got %d", len(p.Portals()))
	}
}

func TestPlatformModuleCatalogueAndNDEAR(t *testing.T) {
	p := newPlatform(t)
	c := p.ModuleCatalogue()
	if c.Total != 391 || c.Core != 329 || c.TN != 62 || !c.HeadlineMatch {
		t.Fatalf("the 391-module catalogue must compute to 329 core + 62 TN: %+v", c)
	}
	n := p.NDEARSummary()
	if n.Total != 29 {
		t.Fatalf("NDEAR-S must register 29 building blocks, got %d", n.Total)
	}
}

func TestPlatformAlignmentsAndCivic(t *testing.T) {
	p := newPlatform(t)
	if len(p.Alignments()) < 10 || p.AlignmentSummary().Instrumented == 0 {
		t.Fatalf("international alignments must be registered + instrumented: %+v", p.AlignmentSummary())
	}
	// L12 civic: the public dashboard is PII-suppressed and built from the real estate.
	d := p.PublicDashboard()
	if !d.PIISuppressed || d.Schools != 69000 || d.Districts != 38 {
		t.Fatalf("public dashboard wrong: %+v", d)
	}
	// live RTI + grievance state.
	p.FileRTI("RTI-9", "school toilets", "citizen-9")
	p.FileGrievance("G-9", "meal quality", "parent-9", "block")
	s := p.CivicSummary()
	if s.RTIOpen != 1 || s.GrievOpen != 1 || s.OpenDatasets == 0 {
		t.Fatalf("civic summary wrong: %+v", s)
	}
}
