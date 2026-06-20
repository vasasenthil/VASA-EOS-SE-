package population

import (
	"strings"
	"testing"
)

func TestTreeHitsTargetsExactly(t *testing.T) {
	tr := BuildTree()
	d, b, c, s := Targets()
	if len(tr.Blocks) != b || len(tr.Clusters) != c || len(tr.Schools) != s {
		t.Fatalf("tree must hit §D targets exactly: blocks=%d/%d clusters=%d/%d schools=%d/%d",
			len(tr.Blocks), b, len(tr.Clusters), c, len(tr.Schools), s)
	}
	// every block is anchored to one of the real 38 districts.
	districts := map[string]bool{}
	for _, bl := range tr.Blocks {
		districts[bl.District] = true
	}
	if len(districts) != d {
		t.Fatalf("blocks must span all %d real districts, got %d", d, len(districts))
	}
	if !districts["Chennai"] || !districts["Madurai"] {
		t.Fatal("the tree must be anchored to the real district names")
	}
}

func TestTreeDeterministic(t *testing.T) {
	a, b := BuildTree(), BuildTree()
	if len(a.Schools) != len(b.Schools) {
		t.Fatal("non-deterministic tree size")
	}
	for i := range a.Schools {
		if a.Schools[i] != b.Schools[i] {
			t.Fatalf("tree must be byte-identical across builds; diverged at %d", i)
		}
	}
}

func TestSchoolCodesAndManagement(t *testing.T) {
	tr := BuildTree()
	for _, s := range tr.Schools[:50] {
		if !strings.HasPrefix(s.UDISE, "33") || len(s.UDISE) != 11 {
			t.Fatalf("UDISE should be an 11-digit TN (33…) code, got %q", s.UDISE)
		}
	}
	sum := Summarise(tr)
	if !sum.TreeValid {
		t.Fatalf("summary must validate the tree against targets: %+v", sum)
	}
	// the management mix must sum to the school count and be Government-majority.
	total := 0
	for _, n := range sum.Management {
		total += n
	}
	if total != len(tr.Schools) {
		t.Fatalf("management mix must cover every school: %d vs %d", total, len(tr.Schools))
	}
	if sum.Management["Government"]*2 < len(tr.Schools) {
		t.Fatalf("Government schools should be the majority, got %d of %d", sum.Management["Government"], len(tr.Schools))
	}
}

func TestSyntheticPopulationLabelled(t *testing.T) {
	tr := BuildTree()
	students := StudentSample(tr, 1000)
	if len(students) != 1000 {
		t.Fatalf("expected 1000 synthetic students, got %d", len(students))
	}
	for _, s := range students[:20] {
		if !s.Synthetic || !strings.HasPrefix(s.APAAR, "SYN-APAAR-") {
			t.Fatalf("every student must be labelled synthetic with a SYN- APAAR id: %+v", s)
		}
		if s.UDISE == "" || s.District == "" {
			t.Fatalf("a synthetic student must still be anchored to a real school/district: %+v", s)
		}
	}
	teachers := TeacherSample(tr, 400)
	teaching := 0
	for _, te := range teachers {
		if !strings.HasPrefix(te.ID, "SYN-TCH-") {
			t.Fatalf("teachers must be labelled synthetic: %+v", te)
		}
		if te.Teaching {
			teaching++
		}
	}
	if teaching == 0 || teaching == len(teachers) {
		t.Fatal("teacher sample should mix teaching and non-teaching staff")
	}
	parents := ParentSample(students)
	if len(parents) != len(students) || !strings.HasPrefix(parents[0].StudentAP, "SYN-APAAR-") {
		t.Fatal("each student must get one synthetic guardian linked by APAAR")
	}
}

func TestScalePlanMatchesBrief(t *testing.T) {
	sp := ScalePlanTN()
	if sp.Students != 12_700_000 || sp.Parents != 27_500_000 {
		t.Fatalf("scale plan must match §D.1: %+v", sp)
	}
	if sp.AvgStudentsPerSchool < 150 || sp.AvgStudentsPerSchool > 250 {
		t.Fatalf("avg students/school should be a realistic ~184, got %d", sp.AvgStudentsPerSchool)
	}
}
