package loop

import (
	"context"
	"strings"
	"testing"
)

// scriptedPlanner returns actions in order, then done.
type scriptedPlanner struct {
	actions []string
	i       int
}

func (p *scriptedPlanner) Plan(_ string, _ []Trace) (string, bool) {
	if p.i >= len(p.actions) {
		return "", true
	}
	a := p.actions[p.i]
	p.i++
	return a, false
}

// echoTool succeeds unless the action contains "fail-once" the first time it sees it.
type echoTool struct{ failedOnce map[string]bool }

func (t *echoTool) Run(_ context.Context, action string) Observation {
	if strings.Contains(action, "flaky") && !t.failedOnce[action] {
		t.failedOnce[action] = true
		return Observation{Output: "", OK: false, Note: "transient"}
	}
	return Observation{Output: "did:" + action, OK: true}
}

// keywordCritic verifies the observation succeeded.
type keywordCritic struct{}

func (keywordCritic) Verify(_, _ string, obs Observation) (bool, string) {
	if obs.OK {
		return true, ""
	}
	return false, "retry: " + obs.Note
}

type memAudit struct{ events []string }

func (m *memAudit) Record(kind, action, detail string) { m.events = append(m.events, kind) }

func TestLoopCompletesGoal(t *testing.T) {
	a := &memAudit{}
	e, err := New(&scriptedPlanner{actions: []string{"research", "draft", "finalise"}}, &echoTool{failedOnce: map[string]bool{}}, keywordCritic{}, Config{MaxSteps: 10}, a)
	if err != nil {
		t.Fatal(err)
	}
	res := e.Run(context.Background(), "produce a remediation plan")
	if !res.Done {
		t.Fatalf("the loop should complete the goal: %+v", res)
	}
	// 3 act steps were executed and audited
	acts := 0
	for _, s := range res.Steps {
		if s.Kind == Act {
			acts++
		}
	}
	if acts != 3 {
		t.Fatalf("expected 3 executed actions, got %d", acts)
	}
}

func TestLoopReflectsOnFailureThenContinues(t *testing.T) {
	// the planner re-issues the flaky action until it is asked again; here the tool fails once then succeeds.
	e, _ := New(&scriptedPlanner{actions: []string{"flaky-step", "flaky-step", "done-step"}}, &echoTool{failedOnce: map[string]bool{}}, keywordCritic{}, Config{MaxSteps: 10}, nil)
	res := e.Run(context.Background(), "goal")
	// the first flaky attempt should produce a reflect trace
	reflects := 0
	for _, s := range res.Steps {
		if s.Kind == Reflect {
			reflects++
		}
	}
	if reflects == 0 {
		t.Fatal("a failed step must produce a reflect trace")
	}
	if !res.Done {
		t.Fatalf("the loop should recover and complete: %+v", res)
	}
}

func TestLoopHITLCheckpointPauses(t *testing.T) {
	cfg := Config{MaxSteps: 10, NeedsHITL: func(a string) bool { return strings.HasPrefix(a, "release-funds") }}
	e, _ := New(&scriptedPlanner{actions: []string{"research", "release-funds:NMMS"}}, &echoTool{failedOnce: map[string]bool{}}, keywordCritic{}, cfg, nil)
	res := e.Run(context.Background(), "disburse a scholarship")
	if !res.Pending || res.PendingAction != "release-funds:NMMS" {
		t.Fatalf("a consequential action must pause at the HITL checkpoint: %+v", res)
	}
	if res.Done {
		t.Fatal("a paused loop is not done")
	}
}

func TestLoopBounded(t *testing.T) {
	// a planner that never declares done, and a tool/critic that always fails → must stop at MaxSteps.
	always := &scriptedPlanner{actions: []string{}}
	_ = always
	e, _ := New(plannerFunc(func(string, []Trace) (string, bool) { return "loop-forever", false }), &echoTool{failedOnce: map[string]bool{}}, alwaysFail{}, Config{MaxSteps: 4}, nil)
	res := e.Run(context.Background(), "impossible")
	if res.Done || res.Reason != "max steps reached" || res.Iterations != 4 {
		t.Fatalf("the loop must be bounded by MaxSteps: %+v", res)
	}
}

func TestNewValidates(t *testing.T) {
	if _, err := New(nil, &echoTool{}, keywordCritic{}, Config{}, nil); err == nil {
		t.Fatal("nil planner must error")
	}
}

// helpers
type plannerFunc func(string, []Trace) (string, bool)

func (f plannerFunc) Plan(g string, h []Trace) (string, bool) { return f(g, h) }

type alwaysFail struct{}

func (alwaysFail) Verify(string, string, Observation) (bool, string) { return false, "nope" }
