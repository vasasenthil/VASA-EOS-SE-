package integration

import "testing"

// Unit tests for the WASH register invariants (pure transitions — no DB, no global state).

func baseWash() WashRegister {
	w := WashRegister{ID: "WASH-T", OrgUnit: "SCH-T", SchoolName: "Test School", Status: WashRegistered}
	lines := []WashFacility{
		{Category: "girls_toilet", SanctionedUnits: 6, FunctionalUnits: 6},
		{Category: "drinking_water", SanctionedUnits: 3, FunctionalUnits: 3},
		{Category: "handwash_station", SanctionedUnits: 8, FunctionalUnits: 8},
	}
	for _, ln := range lines {
		out, err := applyRecordFacility(w, ln, "now")
		if err != nil {
			panic(err)
		}
		w = out
	}
	return w
}

func TestWashOverReportRejected(t *testing.T) {
	w := baseWash()
	if _, err := applyRecordFacility(w, WashFacility{Category: "girls_toilet", SanctionedUnits: 6, FunctionalUnits: 9}, "now"); err == nil {
		t.Fatal("expected over-report (9 > 6) to be rejected")
	}
}

func TestWashCertifyGate(t *testing.T) {
	// All critical fully functional → certify succeeds.
	w := baseWash()
	out, err := applyCertifySwachh(w, "now")
	if err != nil || !out.Certified {
		t.Fatalf("expected Swachh certification to succeed, err=%v certified=%v", err, out.Certified)
	}
	// Break a critical line → certify rejected, blockers non-empty.
	broken, _ := applyRecordFacility(baseWash(), WashFacility{Category: "drinking_water", SanctionedUnits: 3, FunctionalUnits: 1}, "now")
	if len(broken.criticalBlockers()) == 0 {
		t.Fatal("expected a critical blocker for partly-functional drinking water")
	}
	if _, err := applyCertifySwachh(broken, "now"); err == nil {
		t.Fatal("expected certification to be rejected while drinking water is non-functional")
	}
}

func TestWashCriticalRegressionAutoRevokes(t *testing.T) {
	w := baseWash()
	certified, err := applyCertifySwachh(w, "now")
	if err != nil || !certified.Certified {
		t.Fatalf("setup: expected certified, err=%v", err)
	}
	// Recording a regression on a critical line must auto-revoke the certificate.
	regressed, err := applyRecordFacility(certified, WashFacility{Category: "drinking_water", SanctionedUnits: 3, FunctionalUnits: 0}, "now")
	if err != nil {
		t.Fatalf("recording the regression should succeed, got %v", err)
	}
	if regressed.Certified {
		t.Fatal("expected the Swachh certificate to be auto-revoked on a critical regression")
	}
}
