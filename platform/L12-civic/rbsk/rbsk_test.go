package rbsk

import (
	"testing"
	"time"
)

func clk() func() time.Time {
	t, _ := time.Parse(time.RFC3339, "2026-06-01T00:00:00Z")
	return func() time.Time { return t }
}

func TestHealthyVsReferred(t *testing.T) {
	s := NewStoreWithClock(clk())
	if _, err := s.File("X", "STU1", "SCH1", "2026-13-40", nil); err == nil {
		t.Fatal("bad date rejected")
	}
	if _, err := s.File("X", "STU1", "SCH1", "2026-06-01", []string{"alien-finding"}); err == nil {
		t.Fatal("invalid finding rejected")
	}
	// no finding → healthy, no referral.
	h, err := s.File("H1", "STU1", "SCH1", "2026-06-01", nil)
	if err != nil || h.Status != Healthy || h.ReferredTo != "" {
		t.Fatalf("healthy screening: %+v err=%v", h, err)
	}
	// a deficiency finding → auto-referred to the DEIC.
	r, err := s.File("R1", "STU2", "SCH1", "2026-06-01", []string{Deficiency})
	if err != nil || r.Status != Referred || r.ReferredTo != DEIC {
		t.Fatalf("finding must auto-refer to the DEIC: %+v err=%v", r, err)
	}
	if !r.ActiveReferral() {
		t.Fatal("a referred screening is an active referral")
	}
}

func TestReferralPipeline(t *testing.T) {
	s := NewStoreWithClock(clk())
	s.File("R2", "STU3", "SCH1", "2026-06-01", []string{Disability, Disease})
	// cannot close before it is open... it IS open (referred). close directly.
	// treat then close.
	if _, err := s.Treat("R2"); err != nil {
		t.Fatalf("treat: %v", err)
	}
	if sc, _ := s.Get("R2"); sc.Status != UnderTreatment {
		t.Fatalf("must be under treatment: %+v", sc)
	}
	// cannot treat again.
	if _, err := s.Treat("R2"); err == nil {
		t.Fatal("cannot re-treat")
	}
	if sc, err := s.Close("R2", "spectacles + nutrition supplements provided"); err != nil || sc.Status != Closed || sc.ClosedOutcome == "" {
		t.Fatalf("close: %+v err=%v", sc, err)
	}
	// a closed referral cannot be closed again.
	if _, err := s.Close("R2", "x"); err == nil {
		t.Fatal("cannot close a closed referral")
	}
}

func TestListFilter(t *testing.T) {
	s := NewStoreWithClock(clk())
	s.File("A", "S1", "SCH1", "2026-06-01", []string{Deficiency})
	s.File("B", "S2", "SCH2", "2026-06-02", nil)
	if got := s.List(Filter{Finding: Deficiency}); len(got) != 1 || got[0].ID != "A" {
		t.Fatalf("finding filter wrong: %+v", got)
	}
	if got := s.List(Filter{Status: Healthy}); len(got) != 1 || got[0].ID != "B" {
		t.Fatalf("status filter wrong: %+v", got)
	}
	if got := s.List(Filter{OrgUnit: "SCH1"}); len(got) != 1 || got[0].ID != "A" {
		t.Fatalf("org filter wrong: %+v", got)
	}
}
