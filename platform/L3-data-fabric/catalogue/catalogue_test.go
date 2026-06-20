package catalogue

import (
	"crypto/ed25519"
	"testing"

	"github.com/vasa-eos-se-tn/platform/seed"
)

// loaded builds a catalogue over the real production inventory with lineage from a production load.
func loaded(t *testing.T) *Catalogue {
	t.Helper()
	inv := seed.Inventory()
	_, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	man := seed.BuildManifest(inv, "v1", "DSE", priv)
	l := seed.NewLoader(true)
	rep := l.Load(inv, man)
	if !rep.OK {
		t.Fatalf("seed must load for the catalogue: %+v", rep.Rejected)
	}
	// the catalogue covers every known asset (production + synthetic dev fixtures); only production loads.
	all := append(append([]seed.Item(nil), inv...), seed.SyntheticInventory()...)
	return Build(all, l.Lineage)
}

func TestCatalogueEnrichesAndClassifies(t *testing.T) {
	c := loaded(t)
	a, ok := c.Get("SEED-GEOGRAPHY")
	if !ok {
		t.Fatal("geography asset must be catalogued")
	}
	if a.Category != "A-master" || a.Domain != "master" {
		t.Fatalf("geography should be master-reference/master domain: %+v", a)
	}
	if a.PIIClass != 4 || a.PIISensitivity == "" {
		t.Fatalf("geography should be Class-4 with a label: %+v", a)
	}
	if len(a.SLAs) == 0 {
		t.Fatalf("master-domain asset must carry its §F.2 completeness SLA, got none")
	}
	if !a.Lineage.Loaded || a.Lineage.Version != "v1" || a.Lineage.Records == 0 {
		t.Fatalf("geography lineage should be populated from the load: %+v", a.Lineage)
	}
}

func TestCatalogueLineageEdges(t *testing.T) {
	c := loaded(t)
	// SEED-OFFICES depends on geography + directorates; trace must surface both upstream.
	up, _ := c.Trace("SEED-OFFICES")
	if !contains(up, "SEED-GEOGRAPHY") || !contains(up, "SEED-DIRECTORATES") {
		t.Fatalf("SEED-OFFICES upstream should include geography + directorates, got %v", up)
	}
	// geography is upstream of offices and schools → both must appear downstream of geography.
	_, down := c.Trace("SEED-GEOGRAPHY")
	if !contains(down, "SEED-OFFICES") || !contains(down, "SEED-SCHOOLS") {
		t.Fatalf("geography downstream should include offices + schools, got %v", down)
	}
}

func TestCatalogueQueriesAndSummary(t *testing.T) {
	c := loaded(t)
	if len(c.ByCategory("A-master")) == 0 {
		t.Fatal("there must be master-reference assets")
	}
	// production catalogue excludes synthetic (loader never loaded them) — but they are still inventoried.
	if len(c.ByPIIClass(4)) == 0 {
		t.Fatal("Class-4 reference assets must be present")
	}
	s := c.Summary()
	if s.Assets == 0 || s.Loaded == 0 || s.Records == 0 {
		t.Fatalf("summary must reflect a loaded catalogue: %+v", s)
	}
	if s.Loaded > s.Assets {
		t.Fatalf("loaded (%d) cannot exceed assets (%d)", s.Loaded, s.Assets)
	}
	// synthetic seeds are inventoried but never loaded in production.
	if s.Synthetic == 0 {
		t.Fatal("synthetic seeds should be visible in the catalogue (inventoried, not loaded)")
	}
	if s.ByCategory["A-master"] == 0 || s.Stewards == 0 || s.SLAsTracked == 0 {
		t.Fatalf("summary rollups missing: %+v", s)
	}
}

func TestUnknownAssetTraceEmpty(t *testing.T) {
	c := loaded(t)
	up, down := c.Trace("NOPE")
	if up != nil || down != nil {
		t.Fatalf("unknown asset trace should be empty, got %v / %v", up, down)
	}
}

func contains(xs []string, v string) bool {
	for _, x := range xs {
		if x == v {
			return true
		}
	}
	return false
}
