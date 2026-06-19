// Package workflow is the L6 multi-tier approval workflow engine (CC-SPEC-001 §6, §10.5). It is a Go PORT of
// the reference governance workflow (lib/workflow): a definition is an ordered list of approval STEPS, each
// gated to an approver role and a governance scope (the G1–G7 tiers). An instance advances one step per
// approval; a rejection terminates it; the last approval marks it approved. Every action is recorded for the
// audit. Deterministic + stdlib-only.
package workflow

import (
	"errors"
	"fmt"
)

// Decision is an approver's verdict at a step.
type Decision string

const (
	Approve Decision = "approve"
	Reject  Decision = "reject"
)

// Status is an instance's lifecycle state.
type Status string

const (
	InProgress Status = "in_progress"
	Approved   Status = "approved"
	Rejected   Status = "rejected"
)

// Step is one approval gate.
type Step struct {
	Name          string // e.g. "G3 District Officer"
	ApproverRole  string // the role that may act at this step
	RequiredScope string // the governance scope the approver must hold (optional)
}

// Definition is an ordered multi-tier approval flow.
type Definition struct {
	Name  string
	Steps []Step
}

// Validate checks the definition is well-formed.
func (d Definition) Validate() error {
	if d.Name == "" {
		return errors.New("workflow: definition name required")
	}
	if len(d.Steps) == 0 {
		return errors.New("workflow: a definition needs at least one step")
	}
	for i, s := range d.Steps {
		if s.Name == "" || s.ApproverRole == "" {
			return fmt.Errorf("workflow: step %d needs a name and approver role", i)
		}
	}
	return nil
}

// ActionRecord is one recorded decision (the audit trail).
type ActionRecord struct {
	Step     string
	Decision Decision
	Actor    string
	TS       string
	Note     string
}

// Instance is a running workflow.
type Instance struct {
	ID      string
	Def     string
	StepIdx int
	Status  Status
	History []ActionRecord
}

// Start creates an in-progress instance at the first step.
func Start(d Definition, id string) (*Instance, error) {
	if err := d.Validate(); err != nil {
		return nil, err
	}
	if id == "" {
		return nil, errors.New("workflow: instance id required")
	}
	return &Instance{ID: id, Def: d.Name, StepIdx: 0, Status: InProgress}, nil
}

// CurrentStep returns the step awaiting a decision, or false if the instance is terminal.
func (d Definition) CurrentStep(i *Instance) (Step, bool) {
	if i.Status != InProgress || i.StepIdx >= len(d.Steps) {
		return Step{}, false
	}
	return d.Steps[i.StepIdx], true
}

func holds(scopes []string, required string) bool {
	if required == "" {
		return true
	}
	for _, s := range scopes {
		if s == required || s == "*" {
			return true
		}
	}
	return false
}

// CanAct reports whether an actor with the given role + scopes may act on the current step.
func (d Definition) CanAct(i *Instance, role string, scopes []string) bool {
	step, ok := d.CurrentStep(i)
	if !ok {
		return false
	}
	return step.ApproverRole == role && holds(scopes, step.RequiredScope)
}

// Act applies a decision to the current step. Approve advances to the next step (or completes the workflow on
// the last step); reject terminates it. Errors if the instance is terminal or the actor is not authorised.
func (d Definition) Act(i *Instance, decision Decision, actor, role string, scopes []string, note string, now func() string) error {
	step, ok := d.CurrentStep(i)
	if !ok {
		return fmt.Errorf("workflow: instance %q is already %s", i.ID, i.Status)
	}
	if step.ApproverRole != role {
		return fmt.Errorf("workflow: step %q requires role %q, not %q", step.Name, step.ApproverRole, role)
	}
	if !holds(scopes, step.RequiredScope) {
		return fmt.Errorf("workflow: actor lacks required scope %q for step %q", step.RequiredScope, step.Name)
	}
	if decision != Approve && decision != Reject {
		return fmt.Errorf("workflow: invalid decision %q", decision)
	}
	ts := ""
	if now != nil {
		ts = now()
	}
	i.History = append(i.History, ActionRecord{Step: step.Name, Decision: decision, Actor: actor, TS: ts, Note: note})
	if decision == Reject {
		i.Status = Rejected
		return nil
	}
	i.StepIdx++
	if i.StepIdx >= len(d.Steps) {
		i.Status = Approved
	}
	return nil
}

// Progress reports how many steps are complete out of the total.
func (d Definition) Progress(i *Instance) (done, total int) {
	total = len(d.Steps)
	switch i.Status {
	case Approved:
		return total, total
	case Rejected, InProgress:
		return i.StepIdx, total
	}
	return i.StepIdx, total
}

// Terminal reports whether the instance has finished (approved or rejected).
func (i *Instance) Terminal() bool { return i.Status == Approved || i.Status == Rejected }
