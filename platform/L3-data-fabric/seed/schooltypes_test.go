package seed

import "testing"

func TestSchoolTaxonomyMasterData(t *testing.T) {
	// 4 levels, ordered Primary → Higher-Secondary, with widening grade spans.
	if len(SchoolLevels) != 4 {
		t.Fatalf("expected 4 school levels, got %d", len(SchoolLevels))
	}
	if SchoolLevels[0].Code != "PS" || SchoolLevels[0].ToGrade != 5 {
		t.Fatalf("first level must be Primary (1–5), got %+v", SchoolLevels[0])
	}
	if SchoolLevels[3].Code != "HSS" || SchoolLevels[3].ToGrade != 12 {
		t.Fatalf("last level must be Higher-Secondary (1–12), got %+v", SchoolLevels[3])
	}
	for i := 1; i < len(SchoolLevels); i++ {
		if SchoolLevels[i].ToGrade <= SchoolLevels[i-1].ToGrade {
			t.Fatalf("grade spans must widen: %s then %s", SchoolLevels[i-1].Code, SchoolLevels[i].Code)
		}
	}
	// management categories include Government + the self-financing + central forms.
	cats := map[string]bool{}
	for _, c := range SchoolCategories {
		cats[c.Code] = true
	}
	for _, want := range []string{"GOVT", "AIDED", "MATRIC", "CBSE", "CENTRAL"} {
		if !cats[want] {
			t.Fatalf("missing management category %s", want)
		}
	}
	// medium has Tamil first; gender + residential carry the inclusive forms.
	if len(Mediums) == 0 || Mediums[0] != "Tamil" {
		t.Fatalf("Tamil must be the first medium, got %v", Mediums)
	}
	gset := map[string]bool{}
	for _, g := range GenderTypes {
		gset[g] = true
	}
	if !gset["Co-educational"] || !gset["Girls"] || !gset["Boys"] {
		t.Fatalf("gender types incomplete: %v", GenderTypes)
	}
	rset := map[string]bool{}
	for _, r := range ResidentialTypes {
		rset[r] = true
	}
	if !rset["Day"] || !rset["KGBV"] {
		t.Fatalf("residential types must include Day + KGBV, got %v", ResidentialTypes)
	}
}
