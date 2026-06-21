package integration

import (
	"testing"

	"github.com/vasa-eos-se-tn/platform/directory"
)

func TestDirectorySummaryCoversEveryCategory(t *testing.T) {
	p := newPlatform(t)
	s := p.DirectorySummary()
	if s.Roles < 18 {
		t.Fatalf("the role catalogue must cover the whole hierarchy: %d", s.Roles)
	}
	if len(s.Models) != 5 {
		t.Fatalf("all five access models must be advertised: %+v", s.Models)
	}
	// a representative user of every seeded category must be present, bound to a real org unit.
	for _, role := range []string{"MINISTER", "SECRETARY", "DIRECTOR", "CEO", "DEO", "BEO", "CRC_COORDINATOR", "HEAD_TEACHER", "TEACHER", "STUDENT", "PARENT", "AUDITOR", "PIO", "CITIZEN"} {
		if s.RoleCensus[role] == 0 {
			t.Fatalf("directory must hold a %s bound to an org unit: census=%+v", role, s.RoleCensus)
		}
	}
	for _, u := range s.Sample {
		if u.OrgUnit == "" {
			t.Fatalf("every directory user must be bound to an org unit: %+v", u)
		}
	}
	if !s.Synthetic {
		t.Fatal("the directory must flag its identities as synthetic")
	}
}

func TestAccessExplainCombinesAllFiveModelsLive(t *testing.T) {
	p := newPlatform(t)
	// the DEO reads a school in their own district → permit, decided by RBAC within jurisdiction, with a
	// trace that names every model.
	chennaiSchool := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	dec, u, ok := p.AccessExplain("SYN-U-DEO", "read:school", directory.Resource{OrgUnit: chennaiSchool}, directory.Context{})
	if !ok || u.Role != "DEO" {
		t.Fatalf("the DEO must resolve from the directory: ok=%v user=%+v", ok, u)
	}
	if !dec.Permitted() {
		t.Fatalf("DEO should read a school in their district: %+v", dec)
	}
	seen := map[string]bool{}
	for _, ev := range dec.Trace {
		seen[ev.Model] = true
	}
	for _, m := range []string{"RBAC", "ABAC", "ReBAC", "PBAC", "CABAC"} {
		if !seen[m] {
			t.Fatalf("the live decision trace must include %s: %+v", m, dec.Trace)
		}
	}
}

func TestAccessExplainReBACDeniesOutOfJurisdiction(t *testing.T) {
	p := newPlatform(t)
	// a school in a DIFFERENT district must be denied to the Chennai DEO by ReBAC, even though RBAC grants
	// read:school. Find a school NOT under Chennai.
	var otherSchool string
	for _, dist := range []string{"Coimbatore", "Madurai", "Salem", "Trichy"} {
		if sc := p.SchoolsGovernedBy("TN-DIST-" + dist); sc.Exists && len(sc.Sample) > 0 {
			otherSchool = sc.Sample[0]
			break
		}
	}
	if otherSchool == "" {
		t.Skip("no second district available in the estate")
	}
	dec, _, ok := p.AccessExplain("SYN-U-DEO", "read:school", directory.Resource{OrgUnit: otherSchool}, directory.Context{})
	if !ok {
		t.Fatal("the DEO must resolve")
	}
	if dec.Effect != "deny" || dec.DecidingModel != "ReBAC" {
		t.Fatalf("a school outside the DEO's district must be denied by ReBAC: %+v", dec)
	}
}

func TestAccessExplainPBACAndCABAC(t *testing.T) {
	p := newPlatform(t)
	// SECRETARY releasing funds → RBAC grants it, but PBAC routes it to human approval.
	if dec, _, ok := p.AccessExplain("SYN-U-SEC", "release:fund", directory.Resource{}, directory.Context{}); !ok || dec.Effect != "require-approval" || dec.DecidingModel != "PBAC" {
		t.Fatalf("fund release must be PBAC require-approval: ok=%v dec=%+v", ok, dec)
	}
	// MINISTER declaring an emergency → denied normally (CABAC), permitted inside the emergency window.
	if dec, _, _ := p.AccessExplain("SYN-U-MIN", "declare:emergency", directory.Resource{}, directory.Context{}); dec.Effect != "deny" || dec.DecidingModel != "CABAC" {
		t.Fatalf("emergency declaration must be denied outside the window: %+v", dec)
	}
	if dec, _, _ := p.AccessExplain("SYN-U-MIN", "declare:emergency", directory.Resource{}, directory.Context{Emergency: true, ThreatLevel: "low"}); !dec.Permitted() || dec.DecidingModel != "CABAC" {
		t.Fatalf("emergency declaration must be permitted inside the window: %+v", dec)
	}
}

func TestDirectoryScopedByDownwardGovernance(t *testing.T) {
	p := newPlatform(t)
	// the sovereign node governs everyone in the directory.
	all := p.DirectorySummary().Users
	if got := len(p.DirectoryScopedBy("TN")); got != all {
		t.Fatalf("TN (sovereign) must see every directory user: %d of %d", got, all)
	}
	// the Chennai DEO's district scope sees the field chain below it (block/cluster/school staff) but never
	// the Secretary above it.
	scoped := p.DirectoryScopedBy("TN-DIST-Chennai")
	if len(scoped) == 0 || len(scoped) >= all {
		t.Fatalf("a district must see a strict, non-empty subset: %d of %d", len(scoped), all)
	}
	for _, u := range scoped {
		if u.Role == "SECRETARY" || u.Role == "MINISTER" {
			t.Fatalf("a district officer must not see users above it: %+v", u)
		}
	}
	// an unknown subject sees nobody (fail-closed).
	if got := p.DirectoryScopedBy("TN-DIST-Nowhere"); len(got) != 0 {
		t.Fatalf("an unknown subject must see nobody: %d", len(got))
	}
}
