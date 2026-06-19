package reconcile

import "testing"

func TestClassifyField(t *testing.T) {
	cases := []struct {
		u, l string
		want FieldState
	}{
		{"", "", Match},
		{"Anbu", "anbu", Match}, // case/space-insensitive
		{"Anbu", "Bala", Drift},
		{"", "Anbu", MissingUpstream},
		{"Anbu", "", MissingLocal},
	}
	for _, c := range cases {
		if got := ClassifyField(c.u, c.l); got != c.want {
			t.Errorf("ClassifyField(%q,%q) = %q, want %q", c.u, c.l, got, c.want)
		}
	}
}

func TestApaarReconciled(t *testing.T) {
	u := ApaarRecord{ApaarID: "A1", Name: "Anbu", DateOfBirth: "2014-05-01", Gender: "M", Category: "OBC", JourneyStatus: "enrolled"}
	l := StudentRecord{ApaarID: "A1", Name: "anbu", DOB: "2014-05-01", Gender: "M", Category: "OBC", Status: "Enrolled"}
	r := CompareApaarToStudent(u, l)
	if r.Recommendation != Reconciled {
		t.Fatalf("identical records should reconcile, got %q (%s)", r.Recommendation, r.Rationale)
	}
	if r.MatchPct != 100 {
		t.Fatalf("expected 100%% match, got %d", r.MatchPct)
	}
}

func TestApaarCriticalDriftFlagged(t *testing.T) {
	u := ApaarRecord{ApaarID: "A1", Name: "Anbu Selvan", DateOfBirth: "2014-05-01", JourneyStatus: "enrolled"}
	l := StudentRecord{ApaarID: "A1", Name: "Anbu", DOB: "2014-05-01", Status: "Enrolled"} // name differs (critical)
	r := CompareApaarToStudent(u, l)
	if r.Recommendation != Flagged {
		t.Fatalf("a name drift is identity-critical → Flagged, got %q", r.Recommendation)
	}
	if r.CriticalDriftCount != 1 {
		t.Fatalf("expected 1 critical drift, got %d", r.CriticalDriftCount)
	}
}

func TestApaarNonCriticalDriftReview(t *testing.T) {
	u := ApaarRecord{ApaarID: "A1", Name: "Anbu", DateOfBirth: "2014-05-01", Category: "OBC", JourneyStatus: "enrolled"}
	l := StudentRecord{ApaarID: "A1", Name: "Anbu", DOB: "2014-05-01", Category: "SC", Status: "Enrolled"} // category differs (non-critical)
	r := CompareApaarToStudent(u, l)
	if r.Recommendation != Review {
		t.Fatalf("a non-critical drift → Review, got %q", r.Recommendation)
	}
}

func TestJourneyMapping(t *testing.T) {
	cases := map[string]string{"enrolled": "Enrolled", "transferred": "Transferred", "alumni": "Graduated", "dropout": "Dropped", "weird": ""}
	for in, want := range cases {
		if got := MapJourneyToStatus(in); got != want {
			t.Errorf("MapJourneyToStatus(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestNumericMinorDriftWithinTolerance(t *testing.T) {
	// upstream 1000, local 1015 → 1.5% delta, under the 2% count tolerance → minor → Reconciled
	r := CompareNumeric([]NumField{{Field: "students", Label: "Students on roll", Upstream: F(1000), Local: F(1015), Critical: true}}, DefaultTolerancePct)
	if r.Recommendation != Reconciled {
		t.Fatalf("a 1.5%% delta is within the 2%% tolerance → Reconciled, got %q (%s)", r.Recommendation, r.Rationale)
	}
}

func TestNumericDriftBeyondToleranceFlagged(t *testing.T) {
	// upstream 1000, local 1200 → 20% delta on a critical field → Flagged
	r := CompareNumeric([]NumField{{Field: "students", Label: "Students on roll", Upstream: F(1000), Local: F(1200), Critical: true}}, DefaultTolerancePct)
	if r.Recommendation != Flagged {
		t.Fatalf("a 20%% delta on a critical count → Flagged, got %q", r.Recommendation)
	}
	if r.Fields[0].PctDelta != 20 {
		t.Fatalf("expected 20%% pctDelta, got %d", r.Fields[0].PctDelta)
	}
}

func TestPfmsMoneyDriftIsTighter(t *testing.T) {
	// 1.5% delta on funds: under count tolerance (2%) but OVER money tolerance (1%) → real drift → Flagged
	p := PfmsExpenditure{Allocated: 1_000_000, Released: 1_000_000, Utilised: 1_000_000}
	l := &FundLedger{Allocated: 1_000_000, Released: 1_015_000, Utilised: 1_000_000}
	r := CompareFundFlowToPfms(p, l)
	if r.Recommendation != Flagged {
		t.Fatalf("a 1.5%% money delta exceeds the 1%% money tolerance → Flagged, got %q (%s)", r.Recommendation, r.Rationale)
	}
}

func TestPfmsMissingLocalLedger(t *testing.T) {
	p := PfmsExpenditure{Allocated: 500, Released: 400, Utilised: 300}
	r := CompareFundFlowToPfms(p, nil)
	// no local ledger → all missing-local → drift count 3, but not "real drift" (NumDrift) → Review path?
	// missing-local is a discrepancy but not a NumDrift, so recommendation is Reconciled-with-no-real-drift.
	if r.DriftCount != 3 {
		t.Fatalf("expected 3 missing-local discrepancies, got %d", r.DriftCount)
	}
}
