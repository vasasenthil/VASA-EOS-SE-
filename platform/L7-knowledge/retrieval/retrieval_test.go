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

func TestTopK(t *testing.T) {
	clr := Clearance{Tenant: "TN/Chennai", MaxClass: Public}
	if hits := Retrieve(ret(), "fractions division", "frac", clr, 1); len(hits) != 1 {
		t.Fatalf("top-k must cap results, got %d", len(hits))
	}
}
