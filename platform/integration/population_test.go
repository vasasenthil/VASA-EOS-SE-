package integration

import (
	"strings"
	"testing"
)

func TestPlatformPopulationMaterialised(t *testing.T) {
	p := newPlatform(t)
	sum := p.PopulationSummary()
	if !sum.TreeValid {
		t.Fatalf("the institutional estate must validate against §D targets: %+v", sum)
	}
	if sum.Blocks != 385 || sum.Clusters != 3800 || sum.Schools != 69000 || sum.Districts != 38 {
		t.Fatalf("estate counts must be the real §D figures: %+v", sum)
	}
	if sum.Scale.Students != 12_700_000 {
		t.Fatalf("scale plan must carry the §D.1 student figure: %+v", sum.Scale)
	}
	// the estate is anchored to the real districts.
	chennai := p.SchoolsInDistrict("Chennai")
	if len(chennai) == 0 {
		t.Fatal("Chennai must have materialised schools")
	}
	if !strings.HasPrefix(chennai[0].UDISE, "33") {
		t.Fatalf("school UDISE must be a TN (33…) code, got %q", chennai[0].UDISE)
	}
}

func TestPlatformSyntheticCohortLabelled(t *testing.T) {
	p := newPlatform(t)
	coh := p.SyntheticCohort(500, 30)
	if len(coh.Students) != 500 || len(coh.Parents) != 500 || len(coh.Teachers) != 30 {
		t.Fatalf("cohort sizes wrong: %d students, %d teachers, %d parents", len(coh.Students), len(coh.Teachers), len(coh.Parents))
	}
	// every materialised person is clearly synthetic — the production seed is never polluted.
	for _, s := range coh.Students[:20] {
		if !s.Synthetic || !strings.HasPrefix(s.APAAR, "SYN-APAAR-") {
			t.Fatalf("students must be labelled synthetic: %+v", s)
		}
	}
	// but anchored to a real district + a real school code.
	if coh.Students[0].District == "" || coh.Students[0].UDISE == "" {
		t.Fatal("synthetic students must still be anchored to the real estate")
	}
}
