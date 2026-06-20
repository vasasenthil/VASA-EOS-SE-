package integration

import "testing"

func TestConformanceHeadlinesMatchLive(t *testing.T) {
	p := newPlatform(t)
	rep := p.Conformance()
	if !rep.HeadlinesMatch {
		// surface exactly which headline drifted.
		for _, it := range rep.Items {
			if !it.Match {
				t.Errorf("headline drift: %s claimed=%d live=%d (%s)", it.Area, it.Claimed, it.Live, it.Source)
			}
		}
		t.FailNow()
	}
	// spot-check the load-bearing figures are sourced live, not hard-coded to match.
	byArea := map[string]ConformanceItem{}
	for _, it := range rep.Items {
		byArea[it.Area] = it
	}
	if byArea["Functional modules"].Live != 391 {
		t.Fatalf("functional modules must compute to 391, got %d", byArea["Functional modules"].Live)
	}
	if byArea["Multi-tenancy tiers (T0–T6)"].Live != 7 || byArea["AI agents"].Live != 6 {
		t.Fatal("tenancy/agents live counts wrong")
	}
}

func TestPillarsRegister(t *testing.T) {
	p := newPlatform(t)
	ps := p.Pillars()
	if len(ps) != 8 {
		t.Fatalf("expected 8 Native-AI pillars, got %d", len(ps))
	}
	built := 0
	for _, pl := range ps {
		if pl.Status == "built" {
			built++
		}
	}
	if built != 6 {
		t.Fatalf("expected 6 pillars built (2 partial), got %d", built)
	}
}
