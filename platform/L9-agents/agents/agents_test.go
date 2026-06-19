package agents

import (
	"strings"
	"testing"

	"github.com/vasa-eos-se-tn/platform/engines"
)

func TestTeacherProducesRemediation(t *testing.T) {
	rubric := []engines.RubricItem{
		{ID: "q1", Marks: 10, Objective: "fractions"},
		{ID: "q2", Marks: 10, Objective: "decimals"},
	}
	resp := []engines.Response{{ItemID: "q1", Awarded: 9}, {ItemID: "q2", Awarded: 2}} // decimals weak
	r := Teacher(rubric, resp, []string{"fractions", "decimals"})
	if r.Agent != "teacher" || r.HighStakes {
		t.Fatalf("teacher should be low-stakes: %+v", r)
	}
	if !strings.Contains(r.Summary, "decimals") {
		t.Fatalf("remediation should name the weak objective: %q", r.Summary)
	}
}

func TestPolicyAndComplianceAlwaysRequireApproval(t *testing.T) {
	pol := Policy(engines.Baseline{Population: 1000, CurrentCoverage: 0.6}, engines.Lever{Name: "midday-meal", CoverageDelta: 0.2, CostPerUnit: 30})
	if !pol.HighStakes || !pol.RequiresApproval {
		t.Fatalf("policy agent must be high-stakes + require approval: %+v", pol)
	}
	comp := Compliance(
		[]engines.Fact{{Key: "rte_quota", Value: "unmet"}},
		[]engines.Rule{{When: map[string]string{"rte_quota": "unmet"}, Then: engines.Fact{Key: "finding", Value: "RTE-12-shortfall"}}},
	)
	if !comp.HighStakes || !comp.RequiresApproval {
		t.Fatalf("compliance agent must be high-stakes + require approval: %+v", comp)
	}
	if !strings.Contains(comp.Summary, "finding") {
		t.Fatalf("compliance should surface the derived finding: %q", comp.Summary)
	}
}

func TestGrievanceUngroundedRoutesToHuman(t *testing.T) {
	r := Grievance("totally unrelated question", []engines.Doc{{ID: "RTE-12", Text: "reservation seats disadvantaged"}})
	if !r.RequiresApproval {
		t.Fatalf("an ungrounded (low-confidence) grievance must require approval: %+v", r)
	}
	r2 := Grievance("what about reservation of seats for disadvantaged groups", []engines.Doc{{ID: "RTE-12", Text: "reservation of seats for disadvantaged groups under section 12"}})
	if r2.RequiresApproval {
		t.Fatalf("a grounded grievance at high confidence should auto-proceed: %+v", r2)
	}
	if !strings.Contains(r2.Summary, "RTE-12") {
		t.Fatalf("grievance should cite the governing policy: %q", r2.Summary)
	}
}

func TestGovernanceFlagsAnomaly(t *testing.T) {
	r := Governance([]float64{10, 10, 11, 9, 40, 10})
	if !strings.Contains(r.Summary, "anomaly") {
		t.Fatalf("governance should flag the anomaly: %q", r.Summary)
	}
	clean := Governance([]float64{10, 10, 10, 10})
	if clean.RequiresApproval {
		t.Fatalf("a clean series at high confidence should not require approval: %+v", clean)
	}
}

func TestStudentGroundedAnswer(t *testing.T) {
	r := Student(map[string]float64{"frac": 0.3}, []string{"frac"}, "explain fractions please", []engines.Doc{{ID: "D1", Text: "fractions represent parts of a whole"}})
	if r.Agent != "student" {
		t.Fatal("wrong agent")
	}
	if !strings.Contains(r.Summary, "frac") {
		t.Fatalf("student should recommend the next objective: %q", r.Summary)
	}
}
