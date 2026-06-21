package integration

import (
	"strings"
	"testing"

	"github.com/vasa-eos-se-tn/platform/population"
)

func TestPopulationSummaryHasFullTaxonomy(t *testing.T) {
	p := newPlatform(t)
	sum := p.PopulationSummary()
	// every dimension's mix must cover all 69,000 schools.
	for name, mix := range map[string]map[string]int{
		"management": sum.Management, "level": sum.Level, "medium": sum.Medium,
		"gender": sum.Gender, "residential": sum.Residential,
	} {
		total := 0
		for _, n := range mix {
			total += n
		}
		if total != sum.Schools {
			t.Fatalf("%s mix must cover all %d schools, got %d", name, sum.Schools, total)
		}
	}
}

func TestSchoolsMatchingTaxonomy(t *testing.T) {
	p := newPlatform(t)
	// a deep query: Girls Higher-Secondary schools in Chennai.
	got := p.SchoolsMatching(population.SchoolFilter{District: "Chennai", Level: "Higher Secondary School", Gender: "Girls"})
	if len(got) == 0 {
		t.Fatal("there must be at least one Girls Higher-Secondary school in Chennai")
	}
	for _, s := range got {
		if s.District != "Chennai" || s.Level != "Higher Secondary School" || s.Gender != "Girls" {
			t.Fatalf("filter leaked a non-matching school: %+v", s)
		}
	}
	// narrowing always shrinks (or holds) the result.
	all := p.SchoolsMatching(population.SchoolFilter{District: "Chennai"})
	if len(got) >= len(all) {
		t.Fatalf("a narrower filter must not return more schools (%d vs %d)", len(got), len(all))
	}
}

func TestSchoolsByTypeExport(t *testing.T) {
	p := newPlatform(t)
	body, filename, ok := p.ExportDataset("schools-by-type", 0, 0)
	if !ok || filename != "schools-by-type.csv" {
		t.Fatalf("schools-by-type must export: ok=%v filename=%q", ok, filename)
	}
	if !strings.HasPrefix(body, "level,schools,") {
		t.Fatalf("schools-by-type CSV header wrong: %q", body[:40])
	}
	if !strings.Contains(body, "Higher Secondary School,") || !strings.Contains(body, "Primary School,") {
		t.Fatal("the CSV must list the school levels")
	}
}
