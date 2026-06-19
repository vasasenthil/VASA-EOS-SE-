package orchestrator

import (
	"context"
	"testing"

	registry "github.com/vasa-eos-se-tn/platform/agentregistry"
	"github.com/vasa-eos-se-tn/platform/hitl"
)

type recExec struct{ calls int }

func (e *recExec) Execute(_ context.Context, tool string, _ map[string]any) (string, error) {
	e.calls++
	return "ran:" + tool, nil
}

// systemApprover holds only the routine delegated scope (grievance.route), never the high-risk scopes.
func newOrch(t *testing.T) (*Orchestrator, *recExec, *hitl.Queue) {
	t.Helper()
	exec := &recExec{}
	q, err := hitl.NewQueue(exec, nil)
	if err != nil {
		t.Fatal(err)
	}
	o, err := New(registry.NewRegistry(), q, hitl.Approver{ID: "system", Scopes: []string{"grievance.route"}})
	if err != nil {
		t.Fatal(err)
	}
	return o, exec, q
}

func TestLowRiskHighConfidenceAutoExecutes(t *testing.T) {
	o, exec, _ := newOrch(t)
	out, err := o.Run(context.Background(), Proposal{Agent: registry.Student, Tool: "answer_query", Confidence: 0.95})
	if err != nil {
		t.Fatal(err)
	}
	if out.State != AutoExecuted || out.Output != "ran:answer_query" {
		t.Fatalf("low-risk high-confidence should auto-execute: %+v", out)
	}
	if exec.calls != 1 {
		t.Fatalf("tool should run once, ran %d", exec.calls)
	}
}

func TestHighRiskToolAlwaysPending(t *testing.T) {
	o, exec, _ := newOrch(t)
	// even with maximum confidence, a high-risk financial tool must wait for a human
	out, err := o.Run(context.Background(), Proposal{Agent: registry.Student, Tool: "initiate_dbt", Confidence: 1.0})
	if err != nil {
		t.Fatal(err)
	}
	if out.State != PendingApproval || !contains(out.Reasons, "tool-high-risk") {
		t.Fatalf("high-risk tool must be pending approval: %+v", out)
	}
	if exec.calls != 0 {
		t.Fatal("a high-risk tool must not auto-execute")
	}
	if out.RequestID == "" {
		t.Fatal("a pending outcome must carry the queued request id")
	}
}

func TestHighStakesAgentAlwaysPending(t *testing.T) {
	o, _, _ := newOrch(t)
	// the policy agent is high-stakes; even a low-risk tool at high confidence routes to a human
	out, _ := o.Run(context.Background(), Proposal{Agent: registry.Policy, Tool: "answer_query", Confidence: 0.99})
	if out.State != PendingApproval || !contains(out.Reasons, "agent-high-stakes") {
		t.Fatalf("a high-stakes agent must always route to a human: %+v", out)
	}
}

func TestLowConfidencePending(t *testing.T) {
	o, _, _ := newOrch(t)
	out, _ := o.Run(context.Background(), Proposal{Agent: registry.Student, Tool: "answer_query", Confidence: 0.4})
	if out.State != PendingApproval || !contains(out.Reasons, "low-confidence") {
		t.Fatalf("a low-confidence proposal must route to a human: %+v", out)
	}
}

func TestMediumToolWithDelegatedScopeAutoExecutes(t *testing.T) {
	o, exec, _ := newOrch(t)
	// recommend_routing is medium-risk needing grievance.route, which the system approver holds → auto
	out, err := o.Run(context.Background(), Proposal{Agent: registry.Grievance, Tool: "recommend_routing", Confidence: 0.9})
	if err != nil {
		t.Fatal(err)
	}
	if out.State != AutoExecuted {
		t.Fatalf("medium tool with a delegated scope + high confidence should auto-execute: %+v", out)
	}
	if exec.calls != 1 {
		t.Fatal("tool should have run")
	}
}

func TestHighRiskPendingThenHumanApproves(t *testing.T) {
	o, exec, q := newOrch(t)
	out, _ := o.Run(context.Background(), Proposal{Agent: registry.Compliance, Tool: "flag_violation", Confidence: 0.9})
	if out.State != PendingApproval {
		t.Fatal("should be pending")
	}
	// a human with the right scope approves from the inbox
	officer := hitl.Approver{ID: "compliance-officer", Scopes: []string{"compliance.sign"}}
	done, err := q.Decide(context.Background(), out.RequestID, true, officer)
	if err != nil {
		t.Fatal(err)
	}
	if done.Status != hitl.Approved || exec.calls != 1 {
		t.Fatalf("a scoped human should be able to approve the pending request: %+v calls=%d", done, exec.calls)
	}
}

func TestUnknownAgentOrTool(t *testing.T) {
	o, _, _ := newOrch(t)
	if _, err := o.Run(context.Background(), Proposal{Agent: "ghost", Tool: "answer_query"}); err == nil {
		t.Fatal("unknown agent must error")
	}
	if _, err := o.Run(context.Background(), Proposal{Agent: registry.Student, Tool: "ghost_tool", Confidence: 0.9}); err == nil {
		t.Fatal("unknown tool must error")
	}
}

func contains(xs []string, s string) bool {
	for _, x := range xs {
		if x == s {
			return true
		}
	}
	return false
}
