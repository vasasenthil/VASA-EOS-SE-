package integration

import "testing"

func TestComplianceSweepRollsUp(t *testing.T) {
	p := newPlatform(t)
	rep := p.ComplianceSweep(1000)
	if rep.SchoolsChecked != 1000 {
		t.Fatalf("expected 1000 schools checked, got %d", rep.SchoolsChecked)
	}
	if !rep.Synthetic {
		t.Fatal("the sweep must declare its compliance facts synthetic (telemetry gated)")
	}
	// a meaningful minority must carry findings, and the roll-ups must be consistent.
	if rep.SchoolsWithFindings == 0 || rep.SchoolsWithFindings >= rep.SchoolsChecked {
		t.Fatalf("a realistic sweep flags some (not all) schools: %+v", rep)
	}
	if rep.TotalFindings < rep.SchoolsWithFindings {
		t.Fatalf("total findings (%d) must be >= schools with findings (%d)", rep.TotalFindings, rep.SchoolsWithFindings)
	}
	// the per-statute breakdown must cover the known regimes and sum sensibly.
	sumStatute := 0
	for _, n := range rep.ByStatute {
		sumStatute += n
	}
	if sumStatute != rep.TotalFindings {
		t.Fatalf("by-statute counts (%d) must sum to total findings (%d)", sumStatute, rep.TotalFindings)
	}
	if rep.ByStatute["RPwD Act 2016 §16"] == 0 {
		t.Fatal("the most common breach (accessibility) should appear")
	}
	// district roll-up: schools-with-findings per district must sum to the total flagged.
	sumDist := 0
	for _, n := range rep.ByDistrict {
		sumDist += n
	}
	if sumDist != rep.SchoolsWithFindings {
		t.Fatalf("by-district counts (%d) must sum to flagged schools (%d)", sumDist, rep.SchoolsWithFindings)
	}
	if len(rep.TopComplianceDistricts(5)) == 0 {
		t.Fatal("there must be at least one district needing attention")
	}
}

func TestComplianceSweepDeterministic(t *testing.T) {
	p := newPlatform(t)
	a := p.ComplianceSweep(500)
	b := p.ComplianceSweep(500)
	if a.SchoolsWithFindings != b.SchoolsWithFindings || a.TotalFindings != b.TotalFindings {
		t.Fatal("the sweep must be deterministic")
	}
}
