package integration

import "testing"

func TestCohortAnomaliesFlagsOutlierDistricts(t *testing.T) {
	p := newPlatform(t)
	rep := p.CohortAnomalies("dropout-risk", 2.0)
	if len(rep.Districts) != 38 {
		t.Fatalf("the cohort report must cover all 38 districts, got %d", len(rep.Districts))
	}
	if !rep.Synthetic {
		t.Fatal("the report must declare its indicator values synthetic (telemetry gated)")
	}
	// the planted spike (Nilgiris) and dip (Ramanathapuram) must be flagged as early-warning anomalies.
	flagged := map[string]DistrictIndicator{}
	for _, d := range rep.Districts {
		if d.Flagged {
			flagged[d.District] = d
		}
	}
	if len(flagged) == 0 {
		t.Fatal("the detector must surface at least one early-warning district")
	}
	if nlg, ok := flagged["Nilgiris"]; !ok || nlg.Direction != "high" {
		t.Fatalf("Nilgiris (spike) must be flagged high, got %+v ok=%v", nlg, ok)
	}
	if rmd, ok := flagged["Ramanathapuram"]; !ok || rmd.Direction != "low" {
		t.Fatalf("Ramanathapuram (dip) must be flagged low, got %+v ok=%v", rmd, ok)
	}
	// the flagged list matches the per-district flags.
	if len(rep.Flagged) != len(flagged) {
		t.Fatalf("flagged summary (%d) must match per-district flags (%d)", len(rep.Flagged), len(flagged))
	}
}

func TestCohortAnomaliesStableDefault(t *testing.T) {
	p := newPlatform(t)
	a := p.CohortAnomalies("", 0) // defaults: dropout-risk, DefaultZ
	b := p.CohortAnomalies("dropout-risk", 0)
	if a.Indicator != "dropout-risk" || a.Z != b.Z {
		t.Fatalf("defaults must resolve deterministically: %+v vs %+v", a.Z, b.Z)
	}
	// deterministic: the same district carries the same value across runs.
	if a.Districts[0].Value != b.Districts[0].Value {
		t.Fatal("the indicator series must be deterministic")
	}
}
