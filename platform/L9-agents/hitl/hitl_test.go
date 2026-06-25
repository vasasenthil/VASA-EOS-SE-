package hitl

import (
	"context"
	"errors"
	"testing"
)

// recordExec records executed tool calls; failExec always errors.
type recordExec struct{ calls int }

func (e *recordExec) Execute(_ context.Context, tool string, _ map[string]any) (string, error) {
	e.calls++
	return "executed:" + tool, nil
}

type failExec struct{}

func (failExec) Execute(context.Context, string, map[string]any) (string, error) {
	return "", errors.New("seam down")
}

// memAudit captures audit events.
type memAudit struct{ events []string }

func (m *memAudit) Record(event, actor, resource, detail string) {
	m.events = append(m.events, event)
}

func newQ(t *testing.T, exec Executor) (*Queue, *memAudit) {
	t.Helper()
	a := &memAudit{}
	q, err := NewQueue(exec, a)
	if err != nil {
		t.Fatal(err)
	}
	return q, a
}

func TestEnqueueAndApproveExecutes(t *testing.T) {
	exec := &recordExec{}
	q, audit := newQ(t, exec)
	r, err := q.Enqueue("welfare", "initiate_dbt", map[string]any{"amount": 6000}, "fund.release")
	if err != nil {
		t.Fatal(err)
	}
	if r.Status != Pending {
		t.Fatal("new request should be pending")
	}
	deo := Approver{ID: "deo-chennai", Scopes: []string{"fund.release"}}
	done, err := q.Decide(context.Background(), r.ID, true, deo)
	if err != nil {
		t.Fatal(err)
	}
	if done.Status != Approved || done.Output != "executed:initiate_dbt" {
		t.Fatalf("approval should execute the tool: %+v", done)
	}
	if exec.calls != 1 {
		t.Fatalf("tool should run exactly once, ran %d", exec.calls)
	}
	if !hasEvent(audit, "agent.tool.queued") || !hasEvent(audit, "agent.tool.approved") {
		t.Fatalf("queue + approval must be audited: %v", audit.events)
	}
}

func TestApproverWithoutScopeRejected(t *testing.T) {
	exec := &recordExec{}
	q, _ := newQ(t, exec)
	r, _ := q.Enqueue("welfare", "initiate_dbt", nil, "fund.release")
	teacher := Approver{ID: "teacher-1", Scopes: []string{"marks.write"}} // lacks fund.release
	_, err := q.Decide(context.Background(), r.ID, true, teacher)
	if err == nil {
		t.Fatal("an approver without the required scope must not approve")
	}
	if exec.calls != 0 {
		t.Fatal("the tool must not run when approval is unauthorised")
	}
	got, _ := q.Get(r.ID)
	if got.Status != Pending {
		t.Fatal("an unauthorised decision must leave the request pending")
	}
}

func TestSuperscopeApproves(t *testing.T) {
	q, _ := newQ(t, &recordExec{})
	r, _ := q.Enqueue("compliance", "flag_violation", nil, "compliance.sign")
	super := Approver{ID: "secretary", Scopes: []string{"*"}}
	done, err := q.Decide(context.Background(), r.ID, true, super)
	if err != nil || done.Status != Approved {
		t.Fatalf("superscope should approve: %v %+v", err, done)
	}
}

func TestRejectDoesNotExecute(t *testing.T) {
	exec := &recordExec{}
	q, audit := newQ(t, exec)
	r, _ := q.Enqueue("welfare", "initiate_dbt", nil, "fund.release")
	done, err := q.Decide(context.Background(), r.ID, false, Approver{ID: "deo"})
	if err != nil {
		t.Fatal(err)
	}
	if done.Status != Rejected {
		t.Fatal("should be rejected")
	}
	if exec.calls != 0 {
		t.Fatal("a rejected request must not execute the tool")
	}
	if !hasEvent(audit, "agent.tool.rejected") {
		t.Fatal("rejection must be audited")
	}
}

func TestDoubleDecideRejected(t *testing.T) {
	q, _ := newQ(t, &recordExec{})
	r, _ := q.Enqueue("welfare", "initiate_dbt", nil, "fund.release")
	deo := Approver{ID: "deo", Scopes: []string{"fund.release"}}
	q.Decide(context.Background(), r.ID, true, deo)
	if _, err := q.Decide(context.Background(), r.ID, true, deo); err == nil {
		t.Fatal("an already-decided request must not be decided again")
	}
}

func TestExecFailureLeavesPending(t *testing.T) {
	q, audit := newQ(t, failExec{})
	r, _ := q.Enqueue("welfare", "initiate_dbt", nil, "fund.release")
	deo := Approver{ID: "deo", Scopes: []string{"fund.release"}}
	if _, err := q.Decide(context.Background(), r.ID, true, deo); err == nil {
		t.Fatal("a failed execution must surface an error")
	}
	got, _ := q.Get(r.ID)
	if got.Status != Pending {
		t.Fatal("a failed execution must leave the request pending for retry")
	}
	if !hasEvent(audit, "agent.tool.exec_failed") {
		t.Fatal("execution failure must be audited")
	}
}

func TestPendingInboxOrder(t *testing.T) {
	q, _ := newQ(t, &recordExec{})
	q.Enqueue("a", "t1", nil, "")
	r2, _ := q.Enqueue("b", "t2", nil, "")
	q.Enqueue("c", "t3", nil, "")
	q.Decide(context.Background(), r2.ID, false, Approver{ID: "x"}) // reject the middle one
	pending := q.Pending()
	if len(pending) != 2 || pending[0].Tool != "t1" || pending[1].Tool != "t3" {
		t.Fatalf("pending inbox should be ordered and exclude decided: %+v", pending)
	}
}

func TestNilExecutorRejected(t *testing.T) {
	if _, err := NewQueue(nil, nil); err == nil {
		t.Fatal("nil executor must error")
	}
}

func hasEvent(a *memAudit, e string) bool {
	for _, x := range a.events {
		if x == e {
			return true
		}
	}
	return false
}
