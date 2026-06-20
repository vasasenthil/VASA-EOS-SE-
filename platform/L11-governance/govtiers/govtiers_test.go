package govtiers

import "testing"

func TestSevenTiersAndControlTower(t *testing.T) {
	ts := Tiers()
	if len(ts) != 7 {
		t.Fatalf("expected 7 governance tiers G1–G7, got %d", len(ts))
	}
	if ts[0].Code != "G1" || ts[0].Name != "State Cabinet" {
		t.Fatalf("G1 must be the State Cabinet, got %+v", ts[0])
	}
	if ts[6].Code != "G7" || ts[6].Name == "" {
		t.Fatalf("G7 must be external audit, got %+v", ts[6])
	}
	for i, tr := range ts {
		if tr.Code == "" || tr.Mandate == "" || tr.Authority == "" {
			t.Fatalf("tier %d incomplete: %+v", i, tr)
		}
	}
	if len(ControlTower()) != 3 {
		t.Fatalf("the AI Control Tower must have 3 permanent bodies, got %d", len(ControlTower()))
	}
}

func TestTierLookupAndEscalation(t *testing.T) {
	if g6, ok := TierFor("G6"); !ok || g6.Name == "" {
		t.Fatalf("G6 must resolve, got %+v ok=%v", g6, ok)
	}
	if _, ok := TierFor("G9"); ok {
		t.Fatal("a non-existent tier must not resolve")
	}
	// high-stakes decisions escalate to the Cabinet (G1).
	hi := EscalationPath(true)
	if hi[len(hi)-1] != "G1" {
		t.Fatalf("high-stakes escalation must terminate at G1, got %v", hi)
	}
	lo := EscalationPath(false)
	if lo[0] != "G4" {
		t.Fatalf("routine decisions act at G4 first, got %v", lo)
	}
}

func TestSummary(t *testing.T) {
	s := Summarise()
	if s.Tiers != 7 || s.ControlBodies != 3 || len(s.TierCodes) != 7 {
		t.Fatalf("summary wrong: %+v", s)
	}
}
