package retrieval

import "testing"

// a tiny graph: frac's prerequisites are div + place.
type fakeGraph struct{}

func (fakeGraph) Related(concept string) []string {
	if concept == "frac" {
		return []string{"div", "place"}
	}
	return nil
}

func corpus() []Doc {
	return []Doc{
		{ID: "D1", Text: "fractions represent parts of a whole and are written as a numerator over a denominator", Tenant: "public", Class: Public, Concepts: []string{"frac"}},
		{ID: "D2", Text: "division splits a quantity into equal groups", Tenant: "public", Class: Public, Concepts: []string{"div"}},
		{ID: "D3", Text: "the weather in chennai is warm", Tenant: "public", Class: Public},
		{ID: "D4", Text: "student aadhaar and marks record", Tenant: "TN/Chennai", Class: Restricted, Concepts: []string{"frac"}},
		{ID: "D5", Text: "fractions practice worksheet", Tenant: "TN/Madurai", Class: Public, Concepts: []string{"frac"}}, // other tenant
	}
}

func ret() *Retriever { return New(corpus(), fakeGraph{}) }

func TestKeywordRanksRelevantFirst(t *testing.T) {
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: General}
	hits := Retrieve(ret(), "what are fractions", "", clr, 5)
	if len(hits) == 0 || hits[0].Doc.ID != "D1" {
		t.Fatalf("the fractions doc should rank first: %+v", hits)
	}
	// the unrelated weather doc must not appear for a fractions query
	for _, h := range hits {
		if h.Doc.ID == "D3" {
			t.Fatal("an unrelated doc should not be retrieved")
		}
	}
}

func TestGraphExpansionPullsPrerequisite(t *testing.T) {
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: General}
	// query mentions only fractions, but the concept "frac" expands to div+place → D2 (division) is boosted in.
	hits := Retrieve(ret(), "fractions", "frac", clr, 5)
	found := false
	for _, h := range hits {
		if h.Doc.ID == "D2" {
			found = true
		}
	}
	if !found {
		t.Fatalf("graph expansion should pull in the division prerequisite doc: %+v", hits)
	}
}

func TestPolicyBoundDropsOverClassified(t *testing.T) {
	// a learner cleared only to General must not retrieve the Restricted (class-1 PII) doc, even though it
	// matches the query + concept.
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: General}
	hits := Retrieve(ret(), "marks record fractions", "frac", clr, 10)
	for _, h := range hits {
		if h.Doc.ID == "D4" {
			t.Fatal("a restricted doc must be filtered out at retrieval by classification")
		}
	}
}

func TestTenantIsolation(t *testing.T) {
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: Restricted}
	hits := Retrieve(ret(), "fractions worksheet", "frac", clr, 10)
	for _, h := range hits {
		if h.Doc.ID == "D5" {
			t.Fatal("another tenant's doc must never be surfaced")
		}
	}
}

func TestClearanceAllowsOwnTenantRestricted(t *testing.T) {
	// with Restricted clearance for their own tenant, the learner may retrieve D4.
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: Restricted}
	hits := Retrieve(ret(), "aadhaar marks", "frac", clr, 10)
	found := false
	for _, h := range hits {
		if h.Doc.ID == "D4" {
			found = true
		}
	}
	if !found {
		t.Fatal("the own-tenant restricted doc should be retrievable at Restricted clearance")
	}
}

// fakeVector gives high similarity to a doc that keyword search would rank low.
type fakeVector struct{ scores map[string]float64 }

func (v fakeVector) Similarity(string) map[string]float64 { return v.scores }

func TestVectorLegBoostsSemanticMatch(t *testing.T) {
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: General}
	// the query has no keyword overlap with D2's text, but the vector leg says D2 is highly similar.
	docs := corpus()
	r := NewHybrid(docs, fakeGraph{}, fakeVector{scores: map[string]float64{"D2": 0.95}})
	hits := Retrieve(r, "splitting quantities into equal groups", "", clr, 5)
	found := false
	for _, h := range hits {
		if h.Doc.ID == "D2" {
			found = true
		}
	}
	if !found {
		t.Fatalf("the vector leg should surface a semantically-similar doc: %+v", hits)
	}
}

func TestVectorLegStillPolicyBound(t *testing.T) {
	// even a strong vector hit on a restricted doc must be filtered out by classification.
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: General}
	r := NewHybrid(corpus(), fakeGraph{}, fakeVector{scores: map[string]float64{"D4": 0.99}})
	hits := Retrieve(r, "anything", "", clr, 5)
	for _, h := range hits {
		if h.Doc.ID == "D4" {
			t.Fatal("the policy bound must apply to the vector leg too — restricted doc filtered")
		}
	}
}

func TestNilVectorDegradesCleanly(t *testing.T) {
	// New (no vector) behaves exactly as keyword+graph — the vector leg is optional/gated.
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: General}
	hits := Retrieve(New(corpus(), fakeGraph{}), "fractions", "frac", clr, 5)
	if len(hits) == 0 {
		t.Fatal("keyword+graph retrieval should still work without a vector leg")
	}
}

func TestTopK(t *testing.T) {
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: Public}
	if hits := Retrieve(ret(), "fractions division", "frac", clr, 1); len(hits) != 1 {
		t.Fatalf("top-k must cap results, got %d", len(hits))
	}
}
