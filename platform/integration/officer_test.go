package integration

import "testing"

func TestOfficerDashboardScopedToJurisdiction(t *testing.T) {
	p := newPlatform(t)
	// a district officer sees ONLY their district's schools (downward-governance scope).
	d := p.OfficerDashboard("TN-DIST-Chennai")
	if !d.Found {
		t.Fatalf("the district node must resolve: %+v", d)
	}
	if d.Tier != "District" {
		t.Fatalf("a district node must report the District tier: %q", d.Tier)
	}
	// the scope must match the canonical downward-governance count for the same subject.
	want := p.SchoolsGovernedBy("TN-DIST-Chennai").Schools
	if want == 0 || d.SchoolsGoverned != want {
		t.Fatalf("officer scope must equal the governance scope: dash=%d scope=%d", d.SchoolsGoverned, want)
	}
	// every taxonomy mix must account for exactly the governed schools (every school is classified).
	for name, mix := range map[string]map[string]int{
		"management": d.Management, "level": d.Level, "medium": d.Medium,
		"gender": d.Gender, "residential": d.Residential,
	} {
		sum := 0
		for _, n := range mix {
			sum += n
		}
		if sum != d.SchoolsGoverned {
			t.Fatalf("%s mix must sum to the governed schools: sum=%d schools=%d", name, sum, d.SchoolsGoverned)
		}
	}
	// the compliance sweep must surface findings cited to statutes, and never exceed the school count.
	if d.SchoolsWithFindings < 0 || d.SchoolsWithFindings > d.SchoolsGoverned {
		t.Fatalf("schools-with-findings out of range: %d of %d", d.SchoolsWithFindings, d.SchoolsGoverned)
	}
	if len(d.ComplianceByStatute) == 0 {
		t.Fatalf("the compliance sweep must cite at least one statute across a district: %+v", d.ComplianceByStatute)
	}
	if !d.Synthetic {
		t.Fatal("the dashboard must flag its compliance/device facts as illustrative (telemetry gated)")
	}
	if d.GovernancePath == "" {
		t.Fatal("the governance path (T0 → … → district) must be present")
	}
}

func TestOfficerDashboardUnknownNodeFailsClosed(t *testing.T) {
	p := newPlatform(t)
	d := p.OfficerDashboard("TN-DIST-Nowhere")
	if d.Found || d.SchoolsGoverned != 0 || len(d.ComplianceByStatute) != 0 {
		t.Fatalf("an unknown node must disclose nothing (fail-closed): %+v", d)
	}
}

func TestOfficerDashboardBlockNarrowerThanDistrict(t *testing.T) {
	p := newPlatform(t)
	district := p.OfficerDashboard("TN-DIST-Chennai")
	if !district.Found || district.SchoolsGoverned == 0 {
		t.Fatalf("district must resolve with schools: %+v", district)
	}
	// pick a block under the district and assert its scope is strictly narrower (a block never sees the
	// whole district) yet non-empty — downward governance narrows as you descend the T0–T6 chain.
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		t.Fatalf("hierarchy unavailable: %v", err)
	}
	var blockID string
	for _, id := range h.Descendants("TN-DIST-Chennai") {
		if n, ok := h.Get(id); ok && n.Level == 4 { // T4 block
			blockID = n.ID
			break
		}
	}
	if blockID == "" {
		t.Fatal("expected at least one block under the district")
	}
	block := p.OfficerDashboard(blockID)
	if !block.Found || block.Tier != "Block" {
		t.Fatalf("block node must resolve as the Block tier: %+v", block)
	}
	if block.SchoolsGoverned == 0 || block.SchoolsGoverned >= district.SchoolsGoverned {
		t.Fatalf("a block must govern fewer schools than its district: block=%d district=%d", block.SchoolsGoverned, district.SchoolsGoverned)
	}
}
