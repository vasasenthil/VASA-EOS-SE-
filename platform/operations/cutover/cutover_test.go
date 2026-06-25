package cutover

import (
	"context"
	"errors"
	"testing"
)

// a recording step builder backed by an in-memory "world".
type world struct {
	applied map[string]bool
	log     []string
}

func newWorld() *world { return &world{applied: map[string]bool{}} }

func (w *world) step(name string, failAction, failVerify bool) Step {
	return Step{
		Name: name,
		Action: func(context.Context) error {
			if failAction {
				return errors.New("boom")
			}
			w.applied[name] = true
			w.log = append(w.log, "do:"+name)
			return nil
		},
		Verify: func(context.Context) error {
			if failVerify || !w.applied[name] {
				return errors.New("not applied")
			}
			return nil
		},
		Rollback: func(context.Context) error {
			w.applied[name] = false
			w.log = append(w.log, "undo:"+name)
			return nil
		},
	}
}

type memAudit struct{ events []string }

func (m *memAudit) Record(event, step, detail string) { m.events = append(m.events, event) }

func TestHappyPathRunsAllSteps(t *testing.T) {
	w := newWorld()
	p, err := NewPlan([]Step{w.step("dns", false, false), w.step("traffic", false, false), w.step("scale", false, false)}, &memAudit{})
	if err != nil {
		t.Fatal(err)
	}
	res := p.Run(context.Background())
	if !res.Succeeded() {
		t.Fatalf("plan should succeed: %v", res.Err)
	}
	if len(res.Completed) != 3 {
		t.Fatalf("expected 3 completed, got %v", res.Completed)
	}
}

func TestActionFailureRollsBackInReverse(t *testing.T) {
	w := newWorld()
	// step 3 fails at action → steps 1,2 rolled back in reverse
	p, _ := NewPlan([]Step{w.step("a", false, false), w.step("b", false, false), w.step("c", true, false)}, &memAudit{})
	res := p.Run(context.Background())
	if res.Succeeded() {
		t.Fatal("plan should fail at step c")
	}
	if res.Failed != "c" {
		t.Fatalf("expected failure at c, got %q", res.Failed)
	}
	if len(res.RolledBack) != 2 || res.RolledBack[0] != "b" || res.RolledBack[1] != "a" {
		t.Fatalf("rollback must run completed steps in reverse: %v", res.RolledBack)
	}
	if w.applied["a"] || w.applied["b"] {
		t.Fatal("rolled-back steps must be undone in the world")
	}
}

func TestPreconditionGate(t *testing.T) {
	w := newWorld()
	s := w.step("guarded", false, false)
	s.Precondition = func(context.Context) error { return errors.New("infra not ready") }
	p, _ := NewPlan([]Step{w.step("first", false, false), s}, &memAudit{})
	res := p.Run(context.Background())
	if res.Succeeded() || res.Failed != "guarded" {
		t.Fatalf("a failing precondition must abort at that step: %+v", res)
	}
	if len(res.RolledBack) != 1 || res.RolledBack[0] != "first" {
		t.Fatalf("prior step must be rolled back: %v", res.RolledBack)
	}
}

func TestIdempotentResumeSkipsSatisfied(t *testing.T) {
	w := newWorld()
	steps := []Step{w.step("x", false, false), w.step("y", false, false)}
	p, _ := NewPlan(steps, &memAudit{})
	// first run completes everything
	if res := p.Run(context.Background()); !res.Succeeded() {
		t.Fatalf("first run should succeed: %v", res.Err)
	}
	// second run: both verifies already pass → both skipped, nothing re-applied
	w.log = nil
	res := p.Run(context.Background())
	if !res.Succeeded() {
		t.Fatal("resume should succeed")
	}
	if len(res.Skipped) != 2 || len(res.Completed) != 0 {
		t.Fatalf("a resume must skip already-satisfied steps: skipped=%v completed=%v", res.Skipped, res.Completed)
	}
	if len(w.log) != 0 {
		t.Fatalf("no actions should re-run on resume, got %v", w.log)
	}
}

func TestVerifyFailureTriggersRollback(t *testing.T) {
	w := newWorld()
	p, _ := NewPlan([]Step{w.step("a", false, false), w.step("b", false, true)}, &memAudit{}) // b's verify fails
	res := p.Run(context.Background())
	if res.Failed != "b" {
		t.Fatalf("verify failure should fail at b, got %q", res.Failed)
	}
	if len(res.RolledBack) != 1 || res.RolledBack[0] != "a" {
		t.Fatalf("a must be rolled back, got %v", res.RolledBack)
	}
}

func TestPlanValidation(t *testing.T) {
	if _, err := NewPlan(nil, nil); err == nil {
		t.Fatal("empty plan must error")
	}
	noAction := Step{Name: "x"}
	if _, err := NewPlan([]Step{noAction}, nil); err == nil {
		t.Fatal("a step without an action must error")
	}
	dup := Step{Name: "d", Action: func(context.Context) error { return nil }}
	if _, err := NewPlan([]Step{dup, dup}, nil); err == nil {
		t.Fatal("duplicate step names must error")
	}
}
