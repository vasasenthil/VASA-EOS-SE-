package integration

import "testing"

func TestPlatformTenancyHierarchy(t *testing.T) {
	p := newPlatform(t)
	if len(p.TenancyTiers()) != 7 {
		t.Fatalf("the platform must expose the 7-tier T0–T6 catalogue, got %d", len(p.TenancyTiers()))
	}
	sum := p.TenancySummary()
	if !sum.Valid {
		t.Fatalf("the materialised T0–T6 hierarchy must validate against §D: %+v", sum.TierCounts)
	}
	if sum.Root != "TN" || sum.Nodes != 1+1+7+38+385+3800+69000 {
		t.Fatalf("hierarchy root/size wrong: root=%s nodes=%d", sum.Root, sum.Nodes)
	}
}

func TestPlatformTenancyDownwardGovernance(t *testing.T) {
	p := newPlatform(t)
	// TN (T0) governs a directorate; the secretariat governs Chennai district; a district governs its blocks.
	if !p.Governs("TN", "TN-DIR-DSE") {
		t.Fatal("the sovereign must govern a directorate")
	}
	if !p.Governs("TN-DIR-DSE", "TN-DIST-Chennai") {
		t.Fatal("DSE must govern the Chennai district")
	}
	// a district must NOT govern a sibling district (fail-closed jurisdiction).
	if p.Governs("TN-DIST-Chennai", "TN-DIST-Madurai") {
		t.Fatal("a district must not govern a sibling district")
	}
	// a real school leaf traces back to TN through all seven tiers.
	path, ok := p.TenancyPath("TN-DIST-Chennai")
	if !ok || path == "" {
		t.Fatalf("Chennai must have a governance path, got %q ok=%v", path, ok)
	}
	if !p.Governs("TN", "TN-DIST-Chennai") {
		t.Fatal("the sovereign governs every district")
	}
}

func TestPlatformJurisdictionScope(t *testing.T) {
	p := newPlatform(t)
	// the sovereign governs the whole estate.
	if got := p.SchoolsGovernedBy("TN"); !got.Exists || got.Schools != 69000 {
		t.Fatalf("TN must govern all 69,000 schools, got %+v", got)
	}
	// a district governs only a proper subset.
	chn := p.SchoolsGovernedBy("TN-DIST-Chennai")
	if !chn.Exists || chn.Schools == 0 || chn.Schools >= 69000 {
		t.Fatalf("Chennai must govern a proper subset of schools: %+v", chn)
	}
	if len(chn.Sample) == 0 {
		t.Fatal("a governed scope should surface a sample of schools")
	}
	// an unknown subject governs nothing (fail-closed).
	if got := p.SchoolsGovernedBy("GHOST"); got.Exists || got.Schools != 0 {
		t.Fatalf("an unknown subject must govern nothing, got %+v", got)
	}
}

func TestResolveTenancyNode(t *testing.T) {
	p := newPlatform(t)
	// a district name resolves to its canonical T3 node.
	if id, ok := p.ResolveTenancyNode(struct{ Node, District, Directorate string }{District: "Chennai"}); !ok || id != "TN-DIST-Chennai" {
		t.Fatalf("Chennai must resolve to TN-DIST-Chennai: id=%s ok=%v", id, ok)
	}
	// a directorate code resolves to its T2 node.
	if id, ok := p.ResolveTenancyNode(struct{ Node, District, Directorate string }{Directorate: "DSE"}); !ok || id != "TN-DIR-DSE" {
		t.Fatalf("DSE must resolve to TN-DIR-DSE: id=%s ok=%v", id, ok)
	}
	// an explicit existing node id passes through.
	if id, ok := p.ResolveTenancyNode(struct{ Node, District, Directorate string }{Node: "TN"}); !ok || id != "TN" {
		t.Fatalf("TN must resolve: id=%s ok=%v", id, ok)
	}
	// an unknown hint fails closed.
	if _, ok := p.ResolveTenancyNode(struct{ Node, District, Directorate string }{District: "Atlantis"}); ok {
		t.Fatal("an unknown district must not resolve")
	}
}
