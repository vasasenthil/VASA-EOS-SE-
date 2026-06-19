package engines

import (
	"math"
	"testing"
)

func approx(a, b float64) bool { return math.Abs(a-b) < 1e-6 }

func TestReasonForwardChains(t *testing.T) {
	facts := []Fact{{"attendance", "low"}, {"marks", "falling"}}
	rules := []Rule{
		{When: map[string]string{"attendance": "low"}, Then: Fact{"risk", "flagged"}, Because: "low attendance"},
		{When: map[string]string{"risk": "flagged", "marks": "falling"}, Then: Fact{"intervention", "required"}, Because: "risk + falling marks"},
	}
	d := Reason(facts, rules)
	got := map[string]string{}
	for _, x := range d {
		got[x.Fact.Key] = x.Fact.Value
	}
	if got["risk"] != "flagged" || got["intervention"] != "required" {
		t.Fatalf("forward chaining failed: %v", got)
	}
}

func TestReasonNoSpuriousDerivation(t *testing.T) {
	d := Reason([]Fact{{"a", "1"}}, []Rule{{When: map[string]string{"a": "2"}, Then: Fact{"b", "y"}}})
	if len(d) != 0 {
		t.Fatalf("no rule should fire, got %v", d)
	}
}

func TestAssessScoresAndDiagnoses(t *testing.T) {
	rubric := []RubricItem{
		{"q1", 10, "fractions"}, {"q2", 10, "fractions"},
		{"q3", 10, "decimals"}, {"q4", 10, "decimals"},
	}
	resp := []Response{{"q1", 9}, {"q2", 8}, {"q3", 2}, {"q4", 3}} // fractions strong, decimals weak
	r := Assess(rubric, resp)
	if r.Score != 22 || r.Max != 40 || !approx(r.Pct, 55) {
		t.Fatalf("score/pct wrong: %+v", r)
	}
	if r.Band != "C1" {
		t.Fatalf("55%% should be band C1, got %q", r.Band)
	}
	if len(r.Weak) != 1 || r.Weak[0] != "decimals" {
		t.Fatalf("decimals should be the weak objective, got %v", r.Weak)
	}
}

func TestAssessClampsOverAward(t *testing.T) {
	r := Assess([]RubricItem{{"q1", 10, "x"}}, []Response{{"q1", 50}}) // awarded > marks
	if r.Score != 10 {
		t.Fatalf("award must clamp to the item marks, got %v", r.Score)
	}
}

func TestNextBestWeakestFirst(t *testing.T) {
	steps := NextBest(map[string]float64{"a": 0.9, "b": 0.3, "c": 0.5}, []string{"a", "b", "c"}, 0.8)
	if len(steps) != 2 {
		t.Fatalf("a is above threshold; expected 2 pending, got %d", len(steps))
	}
	if steps[0].Objective != "b" || steps[1].Objective != "c" {
		t.Fatalf("weakest (b) should come first: %+v", steps)
	}
}

func TestProjectClampsCoverage(t *testing.T) {
	p := Project(Baseline{Population: 1000, CurrentCoverage: 0.7}, Lever{CoverageDelta: 0.2, CostPerUnit: 50, EquityWeight: 0.5})
	if !approx(p.NewCoverage, 0.9) {
		t.Fatalf("coverage should be 0.9, got %v", p.NewCoverage)
	}
	if p.NewlyCovered != 200 {
		t.Fatalf("200 newly covered expected, got %d", p.NewlyCovered)
	}
	if !approx(p.Cost, 10000) {
		t.Fatalf("cost 200×50=10000, got %v", p.Cost)
	}
	// coverage cannot exceed 1.0
	p2 := Project(Baseline{Population: 100, CurrentCoverage: 0.95}, Lever{CoverageDelta: 0.2})
	if !approx(p2.NewCoverage, 1.0) {
		t.Fatalf("coverage must cap at 1.0, got %v", p2.NewCoverage)
	}
}

func TestAnomaliesDetectsSpike(t *testing.T) {
	series := []float64{10, 10, 11, 9, 10, 40, 10, 11} // index 5 is a spike
	a := Anomalies(series, 2.0)
	if len(a) != 1 || a[0].Index != 5 {
		t.Fatalf("expected the spike at index 5, got %+v", a)
	}
}

func TestAnomaliesNoVariance(t *testing.T) {
	if a := Anomalies([]float64{5, 5, 5, 5}, 2); a != nil {
		t.Fatalf("a flat series has no anomalies, got %v", a)
	}
}

func TestConverseGrounded(t *testing.T) {
	corpus := []Doc{
		{"RTE-12", "Section 12 reserves 25 percent of entry class seats for disadvantaged groups."},
		{"POCSO-17", "Content surfaced to a minor must be age appropriate."},
	}
	ans := Converse("What is the RTE reservation percent for seats?", corpus)
	if !ans.Grounded {
		t.Fatal("a query overlapping the corpus must be grounded")
	}
	if len(ans.Citations) == 0 || ans.Citations[0] != "RTE-12" {
		t.Fatalf("should cite RTE-12 first, got %v", ans.Citations)
	}
}

func TestConverseRefusesUngrounded(t *testing.T) {
	ans := Converse("Who won the cricket match yesterday?", []Doc{{"RTE-12", "reservation seats disadvantaged"}})
	if ans.Grounded {
		t.Fatal("an ungrounded query must be refused, not answered")
	}
}
