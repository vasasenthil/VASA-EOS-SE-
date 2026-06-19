// Package orchestrator is the L9 agent run state machine (CC-SPEC-001 §5, §6, §10.9).
//
// It RE-AUTHORS the reference agent orchestration as a deterministic router that enforces human authority.
// Given an agent's proposed tool call (with a confidence), it decides the disposition:
//
//	AUTO-EXECUTE     — only a low-risk, high-confidence proposal from a non-high-stakes agent may proceed
//	                   automatically (the platform's delegated authority for routine, read-only actions).
//	PENDING-APPROVAL — any high-risk tool, any high-stakes agent, or any low-confidence proposal is routed to
//	                   the human-in-the-loop queue; nothing executes until a scoped human approves it.
//
// The safety property: the system's delegated approver never holds the high-risk governance scopes
// (fund.release, compliance.sign, policy.sanction), so those ALWAYS require a human. Deterministic + stdlib.
package orchestrator

import (
	"context"
	"errors"

	registry "github.com/vasa-eos-se-tn/platform/agentregistry"
	"github.com/vasa-eos-se-tn/platform/hitl"
)

// DefaultConfidenceThreshold: proposals below this confidence always go to a human.
const DefaultConfidenceThreshold = 0.7

// State is the disposition of a proposal.
type State string

const (
	AutoExecuted    State = "auto-executed"
	PendingApproval State = "pending-approval"
)

// Proposal is an agent's proposed tool call.
type Proposal struct {
	Agent      registry.AgentID
	Tool       string
	Args       map[string]any
	Confidence float64
}

// Outcome is the orchestrator's decision.
type Outcome struct {
	State     State
	RequestID string   // set when PendingApproval (the queued request)
	Output    string   // set when AutoExecuted
	Reasons   []string // why a human is required (when PendingApproval)
}

// Orchestrator routes proposals through the registry + HITL queue.
type Orchestrator struct {
	reg       *registry.Registry
	queue     *hitl.Queue
	system    hitl.Approver // delegated authority for routine auto-approvals (no high-risk scopes)
	threshold float64
}

// New builds an orchestrator. systemApprover is the platform's delegated approver for routine actions; it
// must NOT hold any high-risk scope (that is the invariant that keeps high-risk tools human-gated).
func New(reg *registry.Registry, queue *hitl.Queue, systemApprover hitl.Approver) (*Orchestrator, error) {
	if reg == nil || queue == nil {
		return nil, errors.New("orchestrator: registry and queue required")
	}
	return &Orchestrator{reg: reg, queue: queue, system: systemApprover, threshold: DefaultConfidenceThreshold}, nil
}

// Run decides and executes the disposition of a proposal.
func (o *Orchestrator) Run(ctx context.Context, p Proposal) (Outcome, error) {
	spec, err := registry.Spec(p.Agent)
	if err != nil {
		return Outcome{}, err
	}
	tool, err := o.reg.Lookup(p.Tool)
	if err != nil {
		return Outcome{}, err
	}

	// Decide whether a human is required.
	var reasons []string
	if spec.HighStakes {
		reasons = append(reasons, "agent-high-stakes")
	}
	if tool.Risk == registry.High {
		reasons = append(reasons, "tool-high-risk")
	}
	if p.Confidence < o.threshold {
		reasons = append(reasons, "low-confidence")
	}
	// A medium-risk tool may auto-proceed only if the delegated approver actually holds its scope.
	autoEligibleScope := tool.Risk != registry.Medium || holds(o.system, tool.RequiredScope)
	if !autoEligibleScope && len(reasons) == 0 {
		reasons = append(reasons, "no-delegated-scope")
	}

	req, err := o.queue.Enqueue(string(p.Agent), p.Tool, p.Args, tool.RequiredScope)
	if err != nil {
		return Outcome{}, err
	}

	if len(reasons) > 0 {
		// route to a human; the request stays pending in the role-gated inbox
		return Outcome{State: PendingApproval, RequestID: req.ID, Reasons: reasons}, nil
	}

	// auto-approve via the delegated system approver and execute
	done, err := o.queue.Decide(ctx, req.ID, true, o.system)
	if err != nil {
		// the delegated approver could not authorise after all → leave it for a human
		return Outcome{State: PendingApproval, RequestID: req.ID, Reasons: []string{"auto-approval-failed"}}, nil
	}
	return Outcome{State: AutoExecuted, RequestID: req.ID, Output: done.Output}, nil
}

func holds(a hitl.Approver, scope string) bool {
	if scope == "" {
		return true
	}
	for _, s := range a.Scopes {
		if s == scope || s == "*" {
			return true
		}
	}
	return false
}
