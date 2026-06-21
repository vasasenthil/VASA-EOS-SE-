package leave

import (
	"testing"
	"time"
)

func clk() func() time.Time {
	t, _ := time.Parse(time.RFC3339, "2026-06-01T00:00:00Z")
	return func() time.Time { return t }
}

func TestDaysAndDynamicChain(t *testing.T) {
	d, err := DaysBetween("2026-06-01", "2026-06-03")
	if err != nil || d != 3 {
		t.Fatalf("inclusive days wrong: %d err=%v", d, err)
	}
	if _, err := DaysBetween("2026-06-05", "2026-06-01"); err == nil {
		t.Fatal("reversed range must error")
	}
	// chain depth grows with days.
	if got := ChainFor(3); len(got) != 1 || got[0].Role != "HEAD_TEACHER" {
		t.Fatalf("<=5 days = principal only: %+v", got)
	}
	if got := ChainFor(10); len(got) != 2 || got[1].Role != "BEO" {
		t.Fatalf(">5 days = +BEO: %+v", got)
	}
	if got := ChainFor(20); len(got) != 3 || got[2].Role != "DEO" {
		t.Fatalf(">15 days = +DEO: %+v", got)
	}
}

func TestFileValidationAndMultiLevelApproval(t *testing.T) {
	s := NewStoreWithClock(clk())
	if _, err := s.File("L1", "T-100", "earned", "2026-07-10", "2026-07-01", "x", "S1"); err == nil {
		t.Fatal("reversed dates must be rejected")
	}
	// a 20-day earned leave needs all three levels.
	r, err := s.File("L2", "T-100", "earned", "2026-07-01", "2026-07-20", "family", "S1")
	if err != nil || r.Days != 20 || len(r.Chain) != 3 || r.Status != Pending {
		t.Fatalf("file failed: %+v err=%v", r, err)
	}
	// wrong role at level 1 rejected.
	if _, err := s.Decide("L2", true, "BEO", "u", ""); err == nil {
		t.Fatal("only the principal acts first")
	}
	// walk principal -> BEO -> DEO.
	for i, role := range []string{"HEAD_TEACHER", "BEO", "DEO"} {
		out, err := s.Decide("L2", true, role, "officer-"+role, "ok")
		if err != nil {
			t.Fatalf("level %d (%s): %v", i, role, err)
		}
		if i < 2 && out.Status != Pending {
			t.Fatalf("still pending after level %d: %+v", i, out)
		}
	}
	if r, _ := s.Get("L2"); !r.Approved() || r.CurrentStep != 3 {
		t.Fatalf("must be fully approved: %+v", r)
	}
}

func TestRejectStops(t *testing.T) {
	s := NewStoreWithClock(clk())
	s.File("L3", "T-200", "casual", "2026-07-01", "2026-07-08", "", "S1") // 8 days -> principal+BEO
	if _, err := s.Decide("L3", false, "HEAD_TEACHER", "p", "not enough cover"); err != nil {
		t.Fatalf("reject: %v", err)
	}
	if r, _ := s.Get("L3"); r.Status != Rejected {
		t.Fatalf("reject must stop the chain: %+v", r)
	}
}

func TestListFilter(t *testing.T) {
	s := NewStoreWithClock(clk())
	s.File("A", "T-1", "casual", "2026-07-01", "2026-07-02", "", "S1")
	s.File("B", "T-2", "casual", "2026-07-01", "2026-07-02", "", "S2")
	if got := s.List(Filter{Orgs: map[string]bool{"S1": true}}); len(got) != 1 || got[0].ID != "A" {
		t.Fatalf("org filter wrong: %+v", got)
	}
	if got := s.List(Filter{Employee: "T-2"}); len(got) != 1 || got[0].ID != "B" {
		t.Fatalf("employee filter wrong: %+v", got)
	}
}
