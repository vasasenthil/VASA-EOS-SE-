// Package cutover is the Phase-8 production go-live runbook engine (CC-SPEC-001 §24 Phase 8, §26.8).
//
// Going live is not a script you run and hope: it is an ordered set of steps, each with a PRECONDITION
// (refuse to start if the world is not ready), an idempotent ACTION, a VERIFY (prove the step took effect),
// and a ROLLBACK (a compensating action). The engine runs the steps in order; if any step's precondition,
// action, or verify fails, it ROLLS BACK the already-completed steps in reverse so the platform is never left
// half-cut-over. Idempotent: a step whose verify already passes is skipped, so a re-run resumes safely.
// Every transition is audited. Stdlib-only.
package cutover

import (
	"context"
	"errors"
	"fmt"
)

// Step is one cutover action with its guards and compensation.
type Step struct {
	Name         string
	Precondition func(context.Context) error // gate: nil means proceed
	Action       func(context.Context) error // idempotent side effect
	Verify       func(context.Context) error // nil means the step took effect
	Rollback     func(context.Context) error // compensating action (best-effort)
}

// AuditSink records cutover transitions (the L5 audit chain in production).
type AuditSink interface {
	Record(event, step, detail string)
}

type nopAudit struct{}

func (nopAudit) Record(string, string, string) {}

// Result is the outcome of a run.
type Result struct {
	Completed  []string // steps that succeeded (verify passed)
	Skipped    []string // steps already satisfied (idempotent resume)
	Failed     string   // the step that failed, if any
	RolledBack []string // steps rolled back, in the order rollback ran
	Err        error
}

// Succeeded reports whether the whole plan completed.
func (r Result) Succeeded() bool { return r.Err == nil && r.Failed == "" }

// Plan is an ordered cutover runbook.
type Plan struct {
	steps []Step
	audit AuditSink
}

// NewPlan builds a plan over an ordered step list and an optional audit sink.
func NewPlan(steps []Step, audit AuditSink) (*Plan, error) {
	if len(steps) == 0 {
		return nil, errors.New("cutover: a plan needs at least one step")
	}
	seen := map[string]bool{}
	for _, s := range steps {
		if s.Name == "" {
			return nil, errors.New("cutover: every step needs a name")
		}
		if seen[s.Name] {
			return nil, fmt.Errorf("cutover: duplicate step %q", s.Name)
		}
		seen[s.Name] = true
		if s.Action == nil {
			return nil, fmt.Errorf("cutover: step %q needs an action", s.Name)
		}
	}
	if audit == nil {
		audit = nopAudit{}
	}
	return &Plan{steps: steps, audit: audit}, nil
}

// verify runs a step's Verify (nil verify = success).
func verify(ctx context.Context, s Step) error {
	if s.Verify == nil {
		return nil
	}
	return s.Verify(ctx)
}

// Run executes the plan. On any failure it rolls back the completed steps in reverse order.
func (p *Plan) Run(ctx context.Context) Result {
	var res Result
	var done []Step // completed this run, for rollback (LIFO)

	for _, s := range p.steps {
		// idempotent resume: if the step's effect is already present, skip it
		if s.Verify != nil && verify(ctx, s) == nil {
			res.Skipped = append(res.Skipped, s.Name)
			p.audit.Record("cutover.skip", s.Name, "already satisfied")
			continue
		}
		if s.Precondition != nil {
			if err := s.Precondition(ctx); err != nil {
				res.Failed = s.Name
				res.Err = fmt.Errorf("precondition failed for %q: %w", s.Name, err)
				p.audit.Record("cutover.precondition_failed", s.Name, err.Error())
				p.rollback(ctx, done, &res)
				return res
			}
		}
		if err := s.Action(ctx); err != nil {
			res.Failed = s.Name
			res.Err = fmt.Errorf("action failed for %q: %w", s.Name, err)
			p.audit.Record("cutover.action_failed", s.Name, err.Error())
			p.rollback(ctx, done, &res)
			return res
		}
		if err := verify(ctx, s); err != nil {
			res.Failed = s.Name
			res.Err = fmt.Errorf("verify failed for %q: %w", s.Name, err)
			p.audit.Record("cutover.verify_failed", s.Name, err.Error())
			p.rollback(ctx, done, &res)
			return res
		}
		res.Completed = append(res.Completed, s.Name)
		done = append(done, s)
		p.audit.Record("cutover.step_complete", s.Name, "")
	}
	p.audit.Record("cutover.complete", "", fmt.Sprintf("%d steps", len(res.Completed)))
	return res
}

// rollback compensates the completed steps in reverse (best-effort; rollback errors are audited, not fatal).
func (p *Plan) rollback(ctx context.Context, done []Step, res *Result) {
	for i := len(done) - 1; i >= 0; i-- {
		s := done[i]
		if s.Rollback == nil {
			continue
		}
		if err := s.Rollback(ctx); err != nil {
			p.audit.Record("cutover.rollback_error", s.Name, err.Error())
		} else {
			p.audit.Record("cutover.rolled_back", s.Name, "")
		}
		res.RolledBack = append(res.RolledBack, s.Name)
	}
}
