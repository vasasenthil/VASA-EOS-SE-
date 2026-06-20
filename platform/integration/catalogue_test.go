package integration

import "testing"

func TestPlatformCatalogueBuiltAtBoot(t *testing.T) {
	p := newPlatform(t)
	sum := p.CatalogueSummary()
	if sum.Assets == 0 || sum.Loaded == 0 || sum.Records == 0 {
		t.Fatalf("the §F.3 catalogue must be assembled at boot with loaded lineage: %+v", sum)
	}
	if sum.ByCategory["A-master"] == 0 || sum.Stewards == 0 || sum.SLAsTracked == 0 {
		t.Fatalf("catalogue summary rollups missing: %+v", sum)
	}
	// every loaded asset must carry a steward and a classification label.
	for _, a := range p.CatalogueAssets() {
		if a.PIISensitivity == "" {
			t.Fatalf("asset %s missing classification label", a.ID)
		}
		if a.Lineage.Loaded && a.Steward == "" {
			t.Fatalf("loaded asset %s missing accountable steward", a.ID)
		}
	}
}

func TestPlatformCatalogueTrace(t *testing.T) {
	p := newPlatform(t)
	up, _ := p.CatalogueTrace("SEED-OFFICES")
	found := false
	for _, u := range up {
		if u == "SEED-GEOGRAPHY" {
			found = true
		}
	}
	if !found {
		t.Fatalf("SEED-OFFICES upstream lineage should include geography, got %v", up)
	}
	if _, ok := p.CatalogueAsset("SEED-GEOGRAPHY"); !ok {
		t.Fatal("geography must be catalogued")
	}
}
