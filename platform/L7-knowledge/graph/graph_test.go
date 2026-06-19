package knowledgegraph

import "testing"

func mustGraph(t *testing.T) *Graph {
	t.Helper()
	g, err := New(DefaultCurriculum())
	if err != nil {
		t.Fatal(err)
	}
	return g
}

func TestTransitivePrerequisites(t *testing.T) {
	g := mustGraph(t)
	prereqs, err := g.TransitivePrerequisites("div")
	if err != nil {
		t.Fatal(err)
	}
	got := map[string]bool{}
	for _, c := range prereqs {
		got[c.ID] = true
	}
	// div needs sub, mul → count, add (transitively)
	for _, want := range []string{"sub", "mul", "count", "add"} {
		if !got[want] {
			t.Errorf("missing transitive prerequisite %q for div; got %v", want, keys(got))
		}
	}
}

func TestLearningPathIsTopological(t *testing.T) {
	g := mustGraph(t)
	path, err := g.LearningPath("frac")
	if err != nil {
		t.Fatal(err)
	}
	pos := map[string]int{}
	for i, c := range path {
		pos[c.ID] = i
	}
	// every prerequisite must appear before the concept that needs it
	for _, c := range path {
		for _, p := range c.Prerequisites {
			if pos[p] >= pos[c.ID] {
				t.Fatalf("prerequisite %q must come before %q in the path %v", p, c.ID, ids(path))
			}
		}
	}
	if path[len(path)-1].ID != "frac" {
		t.Fatalf("target should be last in the path, got %q", path[len(path)-1].ID)
	}
}

func TestReady(t *testing.T) {
	g := mustGraph(t)
	// to start "add" you need "count"
	ready, missing, err := g.Ready(map[string]bool{}, "add")
	if err != nil {
		t.Fatal(err)
	}
	if ready || len(missing) != 1 || missing[0] != "count" {
		t.Fatalf("add should need count; ready=%v missing=%v", ready, missing)
	}
	ready, _, _ = g.Ready(map[string]bool{"count": true}, "add")
	if !ready {
		t.Fatal("with count mastered, add should be ready")
	}
}

func TestCycleRejected(t *testing.T) {
	_, err := New([]Concept{
		{ID: "a", Prerequisites: []string{"b"}},
		{ID: "b", Prerequisites: []string{"a"}},
	})
	if err == nil {
		t.Fatal("a prerequisite cycle must be rejected")
	}
}

func TestUnknownPrerequisiteRejected(t *testing.T) {
	_, err := New([]Concept{{ID: "a", Prerequisites: []string{"ghost"}}})
	if err == nil {
		t.Fatal("an edge to an unknown concept must be rejected")
	}
}

func TestDuplicateRejected(t *testing.T) {
	_, err := New([]Concept{{ID: "a"}, {ID: "a"}})
	if err == nil {
		t.Fatal("duplicate concept ids must be rejected")
	}
}

func keys(m map[string]bool) []string {
	var ks []string
	for k := range m {
		ks = append(ks, k)
	}
	return ks
}
func ids(cs []Concept) []string {
	var out []string
	for _, c := range cs {
		out = append(out, c.ID)
	}
	return out
}
