package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/engines"
)

func TestTeacherRemediationLoopDiagnosesWeakObjective(t *testing.T) {
	p := newPlatform(t)
	rubric := []engines.RubricItem{
		{ID: "q1", Marks: 10, Objective: "fractions"},
		{ID: "q2", Marks: 10, Objective: "decimals"},
	}
	responses := []engines.Response{{ItemID: "q1", Awarded: 9}, {ItemID: "q2", Awarded: 2}} // decimals weak
	before := p.Audit.Len()

	res, next, err := p.TeacherRemediationLoop(context.Background(), rubric, responses, []string{"fractions", "decimals"})
	if err != nil {
		t.Fatal(err)
	}
	if !res.Done {
		t.Fatalf("the remediation loop should complete: %+v", res)
	}
	if next != "decimals" {
		t.Fatalf("the loop should diagnose decimals as the weakest objective, got %q", next)
	}
	// the loop's steps were audited through the platform chain
	if p.Audit.Len() <= before {
		t.Fatal("remediation loop steps must be audited")
	}
	// the assess → diagnose → plan steps each ran and verified
	acts := 0
	for _, s := range res.Steps {
		if s.Kind == "act" {
			acts++
		}
	}
	if acts != 3 {
		t.Fatalf("expected 3 executed remediation steps, got %d", acts)
	}
}
