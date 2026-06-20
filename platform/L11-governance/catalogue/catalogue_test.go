package modulecatalogue

import "testing"

func TestCatalogueSumsTo391(t *testing.T) {
	c := Tally()
	if c.Core != CoreTotal {
		t.Fatalf("core modules must sum to %d, got %d", CoreTotal, c.Core)
	}
	if c.TN != TNTotal {
		t.Fatalf("TN-specific modules must sum to %d, got %d", TNTotal, c.TN)
	}
	if c.Total != GrandTotal {
		t.Fatalf("total modules must be %d (329 core + 62 TN), got %d", GrandTotal, c.Total)
	}
	if !c.HeadlineMatch {
		t.Fatalf("the computed totals must match the published headline: %+v", c)
	}
}

func TestCatalogueTiersComplete(t *testing.T) {
	c := Tally()
	for _, tier := range []string{"Platform", "National", "State", "Directorate", "District", "Block", "Cluster", "School"} {
		if c.ByTier[tier] == 0 {
			t.Fatalf("tier %q must carry modules", tier)
		}
	}
	// every family must have a positive count and a valid scope/status.
	for _, f := range Families() {
		if f.Count <= 0 || f.Name == "" {
			t.Fatalf("family incomplete: %+v", f)
		}
		if f.Scope != Core && f.Scope != TN {
			t.Fatalf("family %q has an invalid scope", f.Name)
		}
		if f.Status != Built && f.Status != Partial && f.Status != Pending {
			t.Fatalf("family %q has an invalid status", f.Name)
		}
	}
	if len(ByTier("School")) == 0 {
		t.Fatal("the School tier must enumerate families")
	}
}
