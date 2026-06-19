package integration

import (
	"context"
	"fmt"

	"github.com/vasa-eos-se-tn/platform/engines"
	"github.com/vasa-eos-se-tn/platform/loop"
)

// teacherTool executes the steps of a remediation run over a learner's assessment, accumulating state across
// the loop. It composes the L8 engines (Assessment + Personalisation) — the Teacher agent's cognition, run
// inside the bounded Plan→Execute→Verify→Reflect loop.
type teacherTool struct {
	rubric     []engines.RubricItem
	responses  []engines.Response
	candidates []string
	mastery    map[string]float64
	next       string
}

func (t *teacherTool) Run(_ context.Context, action string) loop.Observation {
	switch action {
	case "assess":
		r := engines.Assess(t.rubric, t.responses)
		t.mastery = map[string]float64{}
		for _, m := range r.Mastery {
			t.mastery[m.Objective] = m.Pct / 100
		}
		return loop.Observation{Output: fmt.Sprintf("%.0f%% band %s; weak %v", r.Pct, r.Band, r.Weak), OK: true}
	case "diagnose":
		steps := engines.NextBest(t.mastery, t.candidates, 0.5)
		if len(steps) > 0 {
			t.next = steps[0].Objective
		}
		return loop.Observation{Output: "next objective: " + t.next, OK: t.next != ""}
	case "plan-remediation":
		if t.next == "" {
			return loop.Observation{OK: false, Note: "no objective diagnosed"}
		}
		return loop.Observation{Output: "scheduled remediation for " + t.next, OK: true}
	}
	return loop.Observation{OK: false, Note: "unknown action"}
}

// seqPlanner walks a fixed remediation sequence, then declares done.
type seqPlanner struct {
	steps []string
	i     int
}

func (p *seqPlanner) Plan(string, []loop.Trace) (string, bool) {
	if p.i >= len(p.steps) {
		return "", true
	}
	a := p.steps[p.i]
	p.i++
	return a, false
}

// successCritic verifies each step produced a successful observation.
type successCritic struct{}

func (successCritic) Verify(_, _ string, obs loop.Observation) (bool, string) {
	if obs.OK {
		return true, ""
	}
	return false, "step did not succeed: " + obs.Note
}

// TeacherRemediationLoop runs an audited remediation loop for a learner: assess → diagnose the weakest
// objective → plan remediation. It returns the loop result and the recommended next objective. The whole run
// flows through the L9 loop controller (bounded, audited); no consequential action, so it runs to completion.
func (p *Platform) TeacherRemediationLoop(ctx context.Context, rubric []engines.RubricItem, responses []engines.Response, candidates []string) (loop.Result, string, error) {
	tool := &teacherTool{rubric: rubric, responses: responses, candidates: candidates}
	res, err := p.RunLoop(ctx, "remediate the learner's weakest objective",
		&seqPlanner{steps: []string{"assess", "diagnose", "plan-remediation"}},
		tool, successCritic{}, func(string) bool { return false })
	return res, tool.next, err
}
