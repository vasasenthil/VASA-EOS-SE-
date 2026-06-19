// Package hitl is the L9 human-in-the-loop agent tool-approval queue (CC-SPEC-001 §5, §6, §17.6).
//
// Agents are advisory and never act autonomously. A side-effecting tool call an agent proposes is QUEUED
// here as a pending request and runs only after a human with the required governance scope approves it; a
// reject closes it without effect. Every transition (queued, approved+executed, rejected) is appended to the
// tamper-evident audit. This is a production RE-AUTHOR of the reference tool-approval queue
// (lib/agentflow/store.ts), with role-gating made explicit. Stdlib-only; safe for concurrent use.
package hitl

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

// Status is the lifecycle state of a request.
type Status string

const (
	Pending  Status = "pending"
	Approved Status = "approved"
	Rejected Status = "rejected"
)

// Request is one queued agent tool call awaiting a human decision.
type Request struct {
	ID            string
	Agent         string
	Tool          string
	Args          map[string]any
	RequiredScope string // the governance scope an approver must hold
	Status        Status
	RequestedAt   string
	DecidedBy     string
	DecidedAt     string
	Output        string
}

// Approver is the human acting on a request; Scopes are the governance scopes they hold ("*" = superscope).
type Approver struct {
	ID     string
	Scopes []string
}

func (a Approver) holds(scope string) bool {
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

// Executor runs an approved tool against its real seam.
type Executor interface {
	Execute(ctx context.Context, tool string, args map[string]any) (string, error)
}

// AuditSink records every queue transition (the audit hash-chain, L5).
type AuditSink interface {
	Record(event, actor, resource, detail string)
}

// nopAudit is used when no sink is supplied.
type nopAudit struct{}

func (nopAudit) Record(string, string, string, string) {}

// Queue is the approval queue.
type Queue struct {
	mu    sync.Mutex
	reqs  map[string]*Request
	order []string
	exec  Executor
	audit AuditSink
	now   func() time.Time
	seq   int
}

// NewQueue builds a queue over an executor (required) and an audit sink (optional).
func NewQueue(exec Executor, audit AuditSink) (*Queue, error) {
	if exec == nil {
		return nil, errors.New("hitl: executor required")
	}
	if audit == nil {
		audit = nopAudit{}
	}
	return &Queue{reqs: map[string]*Request{}, exec: exec, audit: audit, now: time.Now}, nil
}

func (q *Queue) nextID() string {
	q.seq++
	return fmt.Sprintf("TR-%04d", q.seq)
}

// Enqueue queues a proposed tool call and returns the pending request.
func (q *Queue) Enqueue(agent, tool string, args map[string]any, requiredScope string) (Request, error) {
	if agent == "" || tool == "" {
		return Request{}, errors.New("hitl: agent and tool required")
	}
	q.mu.Lock()
	defer q.mu.Unlock()
	r := &Request{
		ID: q.nextID(), Agent: agent, Tool: tool, Args: args, RequiredScope: requiredScope,
		Status: Pending, RequestedAt: q.now().UTC().Format(time.RFC3339Nano),
	}
	q.reqs[r.ID] = r
	q.order = append(q.order, r.ID)
	q.audit.Record("agent.tool.queued", "agent:"+agent, r.ID, "tool="+tool)
	return *r, nil
}

// Pending returns the pending requests in queue order (the role-gated inbox).
func (q *Queue) Pending() []Request {
	q.mu.Lock()
	defer q.mu.Unlock()
	var out []Request
	for _, id := range q.order {
		if r := q.reqs[id]; r.Status == Pending {
			out = append(out, *r)
		}
	}
	return out
}

// Decide approves or rejects a pending request. Approval requires the approver to hold the request's required
// scope; on approval the tool executes against its seam. A non-pending request, an unknown id, or an
// unauthorised approver is rejected with an error. Every outcome is audited.
func (q *Queue) Decide(ctx context.Context, id string, approve bool, approver Approver) (Request, error) {
	q.mu.Lock()
	r, ok := q.reqs[id]
	if !ok {
		q.mu.Unlock()
		return Request{}, fmt.Errorf("hitl: request %q not found", id)
	}
	if r.Status != Pending {
		q.mu.Unlock()
		return *r, fmt.Errorf("hitl: request %q already %s", id, r.Status)
	}
	if approve && !approver.holds(r.RequiredScope) {
		q.audit.Record("agent.tool.denied", "human:"+approver.ID, id, "missing scope "+r.RequiredScope)
		q.mu.Unlock()
		return *r, fmt.Errorf("hitl: approver %q lacks required scope %q", approver.ID, r.RequiredScope)
	}

	if !approve {
		r.Status = Rejected
		r.DecidedBy = approver.ID
		r.DecidedAt = q.now().UTC().Format(time.RFC3339Nano)
		q.audit.Record("agent.tool.rejected", "human:"+approver.ID, id, "")
		out := *r
		q.mu.Unlock()
		return out, nil
	}

	// snapshot what we need, then execute OUTSIDE the lock (the seam may do I/O)
	tool, args := r.Tool, r.Args
	q.mu.Unlock()

	output, err := q.exec.Execute(ctx, tool, args)

	q.mu.Lock()
	defer q.mu.Unlock()
	if err != nil {
		// execution failed — leave the request pending so it can be retried; audit the failure
		q.audit.Record("agent.tool.exec_failed", "human:"+approver.ID, id, err.Error())
		return *r, fmt.Errorf("hitl: tool execution failed: %w", err)
	}
	r.Status = Approved
	r.DecidedBy = approver.ID
	r.DecidedAt = q.now().UTC().Format(time.RFC3339Nano)
	r.Output = output
	q.audit.Record("agent.tool.approved", "human:"+approver.ID, id, "tool="+tool)
	return *r, nil
}

// Get returns a request by id.
func (q *Queue) Get(id string) (Request, bool) {
	q.mu.Lock()
	defer q.mu.Unlock()
	r, ok := q.reqs[id]
	if !ok {
		return Request{}, false
	}
	return *r, true
}
