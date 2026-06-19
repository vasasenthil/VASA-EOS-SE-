// Package loop is the L9 agent iteration controller (CC-SPEC-001 §5; the "Loop Engineering — the Wheel ·
// what runs" discipline). It runs a bounded Plan → Execute → Verify → Reflect loop (ReAct /
// Plan-Execute-Reflect): a planner proposes the next action, a tool executes it, a critic verifies the
// observation against the goal, and on failure the loop reflects (records the critic's hint and lets the
// planner adjust). The loop is BOUNDED (max steps) and respects HITL CHECKPOINTS — a consequential action
// pauses for a human rather than executing autonomously. Every step is audited. Deterministic + stdlib-only.
package loop

import (
	"context"
	"errors"
	"fmt"
)

// StepKind labels a trace entry.
type StepKind string

const (
	Plan    StepKind = "plan"
	Act     StepKind = "act"
	Verify  StepKind = "verify"
	Reflect StepKind = "reflect"
)

// Observation is the result of executing an action.
type Observation struct {
	Output string
	OK     bool
	Note   string
}

// Tool executes an action and returns an observation.
type Tool interface {
	Run(ctx context.Context, action string) Observation
}

// Critic verifies an observation against the goal; ok=false returns a reflection hint the planner can use.
type Critic interface {
	Verify(goal, action string, obs Observation) (ok bool, hint string)
}

// Planner proposes the next action given the goal and the trace so far; done=true ends the loop successfully.
type Planner interface {
	Plan(goal string, history []Trace) (action string, done bool)
}

// Trace is one recorded step.
type Trace struct {
	Kind   StepKind
	Action string
	Output string
	OK     bool
	Note   string
}

// AuditSink records each loop step (the L5 audit chain in production).
type AuditSink interface {
	Record(kind, action, detail string)
}

type nopAudit struct{}

func (nopAudit) Record(string, string, string) {}

// Config bounds the loop and defines the HITL checkpoint.
type Config struct {
	MaxSteps  int                      // hard bound on iterations
	NeedsHITL func(action string) bool // true if an action must pause for a human before executing
}

// Result is the loop outcome.
type Result struct {
	Goal          string
	Steps         []Trace
	Done          bool   // the planner declared the goal achieved
	Pending       bool   // paused at a HITL checkpoint
	PendingAction string // the action awaiting human approval
	Reason        string // why the loop stopped (when not Done)
	Iterations    int
}

// Engine runs the loop.
type Engine struct {
	planner Planner
	tool    Tool
	critic  Critic
	cfg     Config
	audit   AuditSink
}

// New builds a loop engine.
func New(planner Planner, tool Tool, critic Critic, cfg Config, audit AuditSink) (*Engine, error) {
	if planner == nil || tool == nil || critic == nil {
		return nil, errors.New("loop: planner, tool and critic are required")
	}
	if cfg.MaxSteps <= 0 {
		cfg.MaxSteps = 8
	}
	if cfg.NeedsHITL == nil {
		cfg.NeedsHITL = func(string) bool { return false }
	}
	if audit == nil {
		audit = nopAudit{}
	}
	return &Engine{planner: planner, tool: tool, critic: critic, cfg: cfg, audit: audit}, nil
}

// Run executes the bounded Plan→Execute→Verify→Reflect loop for a goal.
func (e *Engine) Run(ctx context.Context, goal string) Result {
	res := Result{Goal: goal}
	for i := 0; i < e.cfg.MaxSteps; i++ {
		res.Iterations = i + 1
		if err := ctx.Err(); err != nil {
			res.Reason = "context cancelled"
			return res
		}

		// PLAN
		action, done := e.planner.Plan(goal, res.Steps)
		if done {
			res.Done = true
			e.audit.Record(string(Plan), "", "goal achieved")
			return res
		}
		res.Steps = append(res.Steps, Trace{Kind: Plan, Action: action})
		e.audit.Record(string(Plan), action, "")

		// HITL CHECKPOINT — a consequential action pauses for a human.
		if e.cfg.NeedsHITL(action) {
			res.Pending, res.PendingAction = true, action
			res.Reason = "human-in-the-loop checkpoint"
			e.audit.Record("checkpoint", action, "awaiting human approval")
			return res
		}

		// EXECUTE
		obs := e.tool.Run(ctx, action)
		res.Steps = append(res.Steps, Trace{Kind: Act, Action: action, Output: obs.Output, OK: obs.OK, Note: obs.Note})
		e.audit.Record(string(Act), action, fmt.Sprintf("ok=%v", obs.OK))

		// VERIFY (critic)
		ok, hint := e.critic.Verify(goal, action, obs)
		res.Steps = append(res.Steps, Trace{Kind: Verify, Action: action, OK: ok, Note: hint})
		e.audit.Record(string(Verify), action, fmt.Sprintf("ok=%v %s", ok, hint))

		// REFLECT on failure so the planner can adjust next iteration.
		if !ok {
			res.Steps = append(res.Steps, Trace{Kind: Reflect, Action: action, Note: hint})
			e.audit.Record(string(Reflect), action, hint)
		}
	}
	res.Reason = "max steps reached"
	return res
}
