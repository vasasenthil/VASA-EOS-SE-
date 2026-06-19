package quality

import (
	"testing"
	"time"
)

func TestStewardRegister(t *testing.T) {
	s, ok := StewardFor("identity")
	if !ok || s.Name == "" {
		t.Fatalf("identity steward should be registered: %+v", s)
	}
	if _, ok := StewardFor("nope"); ok {
		t.Fatal("unknown domain has no steward")
	}
}

func TestSLAEvaluation(t *testing.T) {
	// master completeness SLA is >= 0.999
	if _, met, found := EvaluateSLA("master", "completeness", 0.9991); !found || !met {
		t.Fatal("0.9991 completeness should meet the master SLA")
	}
	if _, met, _ := EvaluateSLA("master", "completeness", 0.998); met {
		t.Fatal("0.998 completeness must breach the master SLA")
	}
	// identity duplicate rate SLA is <= 0.0001
	if _, met, _ := EvaluateSLA("identity", "duplicate_rate", 0.00005); !met {
		t.Fatal("a low duplicate rate should meet the SLA")
	}
	if _, met, _ := EvaluateSLA("identity", "duplicate_rate", 0.01); met {
		t.Fatal("a 1% duplicate rate must breach the SLA")
	}
	// audit integrity SLA is == 1.0
	if _, met, _ := EvaluateSLA("audit", "integrity", 1.0); !met {
		t.Fatal("full audit integrity should meet the SLA")
	}
	if _, met, _ := EvaluateSLA("audit", "integrity", 0.999); met {
		t.Fatal("any audit gap must breach the integrity SLA")
	}
}

func sampleSchools() Dataset {
	return Dataset{Name: "schools", Rows: []map[string]any{
		{"udise": "33010100101", "district": "Chennai", "category": "Government"},
		{"udise": "33010100102", "district": "Madurai", "category": "Aided"},
		{"udise": "33010100101", "district": "Chennai", "category": "Government"},  // duplicate udise
		{"udise": "", "district": "Salem", "category": "Government"},               // missing udise
		{"udise": "33010100104", "district": "Atlantis", "category": "Government"}, // bad district ref
		{"udise": "33010100105", "district": "Erode", "category": "Casino"},        // out-of-domain category
	}}
}

func TestQualityChecksQuarantine(t *testing.T) {
	ds := sampleSchools()
	validDistricts := map[string]bool{"Chennai": true, "Madurai": true, "Salem": true, "Erode": true}
	rep := Run(ds,
		Completeness("udise", "district"),
		Unique("udise"),
		ReferentialIntegrity("district", validDistricts),
		ValueIn("category", "Government", "Aided", "Matriculation", "Private-CBSE"),
	)
	if rep.Passed {
		t.Fatal("the dirty dataset must fail quality checks")
	}
	// quarantine bucket: rows 0,2 (dup), 3 (missing), 4 (bad district), 5 (bad category)
	want := map[int]bool{0: true, 2: true, 3: true, 4: true, 5: true}
	if len(rep.Quarantined) != len(want) {
		t.Fatalf("quarantine should hold %d rows, got %v", len(want), rep.Quarantined)
	}
	for _, i := range rep.Quarantined {
		if !want[i] {
			t.Fatalf("unexpected quarantined row %d", i)
		}
	}
}

func TestCleanDatasetPasses(t *testing.T) {
	ds := Dataset{Name: "x", Rows: []map[string]any{
		{"udise": "1", "district": "Chennai"}, {"udise": "2", "district": "Madurai"},
	}}
	rep := Run(ds, Completeness("udise", "district"), Unique("udise"), ReferentialIntegrity("district", map[string]bool{"Chennai": true, "Madurai": true}))
	if !rep.Passed || len(rep.Quarantined) != 0 || rep.CompletenessPct != 1 {
		t.Fatalf("a clean dataset should pass with 100%% completeness: %+v", rep)
	}
}

func TestFreshness(t *testing.T) {
	now := time.Date(2026, 6, 19, 12, 0, 0, 0, time.UTC)
	ds := Dataset{Name: "attendance", Rows: []map[string]any{
		{"ts": now.Add(-1 * time.Hour).Format(time.RFC3339)},  // fresh
		{"ts": now.Add(-48 * time.Hour).Format(time.RFC3339)}, // stale (> 24h)
		{"ts": "not-a-time"}, // unparseable → stale
	}}
	r := Freshness("ts", 24*time.Hour, now)(ds)
	if r.Passed || len(r.BadRows) != 2 || !r.BadRows[1] || !r.BadRows[2] {
		t.Fatalf("freshness should flag the two stale rows: %+v", r)
	}
}
