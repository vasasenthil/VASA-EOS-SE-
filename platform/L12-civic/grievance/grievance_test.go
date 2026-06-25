package grievance

import (
	"testing"
	"time"
)

func clkAt(iso string) func() time.Time {
	t, _ := time.Parse(time.RFC3339, iso)
	return func() time.Time { return t }
}

func TestChainAndSLAByCategory(t *testing.T) {
	if got := ChainFor(Safety); len(got) != 3 || got[1].Role != "DEO" || got[2].Role != "DIRECTOR" {
		t.Fatalf("safety escalates school->DEO->director: %+v", got)
	}
	if got := ChainFor(Financial); len(got) != 3 || got[1].Role != "BEO" {
		t.Fatalf("financial: school->BEO->DEO: %+v", got)
	}
	if got := ChainFor(Academic); len(got) != 2 {
		t.Fatalf("default: school->BEO: %+v", got)
	}
	if slaDays(Safety) != 3 || slaDays(Academic) != 7 {
		t.Fatal("SLA days wrong")
	}
}

func TestFileSetsDeadlineAndFirstHandler(t *testing.T) {
	s := NewStoreWithClock(clkAt("2026-06-01T00:00:00Z"))
	if _, err := s.File("G0", "parent-1", "nope", "x", "S1"); err == nil {
		t.Fatal("invalid category must be rejected")
	}
	g, err := s.File("G1", "parent-1", "safety", "unsafe stairwell", "S1")
	if err != nil {
		t.Fatal(err)
	}
	if g.Status != Open || g.CurrentTier != 0 || g.Chain[0].Role != "HEAD_TEACHER" {
		t.Fatalf("first handler must be the head teacher: %+v", g)
	}
	if g.DueAt != "2026-06-04T00:00:00Z" { // filed + 3 days (safety SLA)
		t.Fatalf("SLA deadline wrong: %s", g.DueAt)
	}
}

func TestResolveFailClosedThenResolve(t *testing.T) {
	s := NewStoreWithClock(clkAt("2026-06-01T00:00:00Z"))
	s.File("G2", "parent-2", "academic", "marks error", "S1")
	// wrong handler rejected.
	if _, err := s.Resolve("G2", "BEO", "x", "fixed"); err == nil {
		t.Fatal("only the current handler (head teacher) may resolve")
	}
	g, err := s.Resolve("G2", "HEAD_TEACHER", "principal", "corrected the marks")
	if err != nil || g.Status != Resolved || g.Resolution == "" {
		t.Fatalf("resolve failed: %+v err=%v", g, err)
	}
}

func TestManualEscalationAdvancesTierAndResetsSLA(t *testing.T) {
	s := NewStoreWithClock(clkAt("2026-06-01T00:00:00Z"))
	s.File("G3", "parent-3", "financial", "fee misuse", "S1") // school->BEO->DEO, SLA 7
	g, err := s.Escalate("G3", "principal", "needs block review")
	if err != nil || g.CurrentTier != 1 || g.Chain[0].Decision != "escalated" {
		t.Fatalf("escalation to BEO failed: %+v err=%v", g, err)
	}
	if g.DueAt != "2026-06-08T00:00:00Z" {
		t.Fatalf("SLA must reset on escalation: %s", g.DueAt)
	}
	// escalate again to DEO, then once more → exhausts the chain → Escalated.
	s.Escalate("G3", "beo", "needs district review")
	final, _ := s.Escalate("G3", "deo", "unresolved at district")
	if final.Status != Escalated {
		t.Fatalf("exhausting the chain must mark Escalated: %+v", final)
	}
}

func TestOverdueDetection(t *testing.T) {
	s := NewStoreWithClock(clkAt("2026-06-01T00:00:00Z"))
	g, _ := s.File("G4", "parent-4", "service", "no response", "S1") // SLA 7 -> due 2026-06-08
	if Overdue(g, "2026-06-05T00:00:00Z") {
		t.Fatal("not overdue before the deadline")
	}
	if !Overdue(g, "2026-06-09T00:00:00Z") {
		t.Fatal("overdue after the deadline")
	}
	// a resolved grievance is never overdue.
	r, _ := s.Resolve("G4", "HEAD_TEACHER", "p", "done")
	if Overdue(r, "2026-07-01T00:00:00Z") {
		t.Fatal("a closed grievance cannot be overdue")
	}
}

func TestListFilter(t *testing.T) {
	s := NewStoreWithClock(clkAt("2026-06-01T00:00:00Z"))
	s.File("A", "p1", "safety", "x", "S1")
	s.File("B", "p2", "academic", "y", "S2")
	if got := s.List(Filter{Category: Safety}); len(got) != 1 || got[0].ID != "A" {
		t.Fatalf("category filter wrong: %+v", got)
	}
	if got := s.List(Filter{Orgs: map[string]bool{"S2": true}}); len(got) != 1 || got[0].ID != "B" {
		t.Fatalf("org filter wrong: %+v", got)
	}
}
