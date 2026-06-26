package integration

import "testing"

// Unit tests for the School Health Clinic invariants: pure outcome/referral gates plus the statewide
// single-open-visit cross-store invariant (exercised through a real Platform).

func baseVisit() ClinicVisit {
	return ClinicVisit{ID: "CLN-T", OrgUnit: "SCH-T", StudentID: "SYN-S-T", Complaint: "Headache", Status: ClinicOpen}
}

func TestClinicOutcomeGate(t *testing.T) {
	// Closing without a valid outcome is rejected.
	if _, err := applyCloseVisit(baseVisit(), "", "", "now"); err == nil {
		t.Fatal("expected closing without an outcome to be rejected")
	}
	if _, err := applyCloseVisit(baseVisit(), "banana", "", "now"); err == nil {
		t.Fatal("expected an unknown outcome to be rejected")
	}
	// A valid outcome closes the visit.
	out, err := applyCloseVisit(baseVisit(), "recovered", "", "now")
	if err != nil || out.Status != ClinicClosed {
		t.Fatalf("expected recovered to close the visit, status=%s err=%v", out.Status, err)
	}
}

func TestClinicReferralNeedsDestination(t *testing.T) {
	if _, err := applyCloseVisit(baseVisit(), "referred", "", "now"); err == nil {
		t.Fatal("expected a referral without a destination to be rejected")
	}
	out, err := applyCloseVisit(baseVisit(), "referred", "PHC-CHN", "now")
	if err != nil || out.Destination != "PHC-CHN" {
		t.Fatalf("expected a referral with a destination to succeed, dest=%q err=%v", out.Destination, err)
	}
}

func TestClinicNoTreatOrCloseWhenClosed(t *testing.T) {
	closed, _ := applyCloseVisit(baseVisit(), "recovered", "", "now")
	if _, err := applyTreat(closed, "more meds", "now"); err == nil {
		t.Fatal("expected recording a treatment on a closed visit to be rejected")
	}
	if _, err := applyCloseVisit(closed, "sent_home", "", "now"); err == nil {
		t.Fatal("expected closing an already-closed visit to be rejected")
	}
}

func TestClinicSingleOpenVisit(t *testing.T) {
	p := newPlatform(t)
	mk := func(id string) ClinicVisit {
		return ClinicVisit{ID: id, OrgUnit: "TN", StudentID: "SYN-S-UNIQCLN", Complaint: "Fever"}
	}
	if _, err := p.OpenClinicVisit(mk("CLN-UT-1")); err != nil {
		t.Fatalf("first visit should open: %v", err)
	}
	if _, err := p.OpenClinicVisit(mk("CLN-UT-2")); err == nil {
		t.Fatal("expected a second concurrent open visit for the same student to be rejected")
	}
	// After closing, a fresh visit is allowed again.
	if _, err := p.CloseClinicVisit("CLN-UT-1", "recovered", ""); err != nil {
		t.Fatalf("close should succeed: %v", err)
	}
	if _, err := p.OpenClinicVisit(mk("CLN-UT-3")); err != nil {
		t.Fatalf("a fresh visit after closing should succeed: %v", err)
	}
}
