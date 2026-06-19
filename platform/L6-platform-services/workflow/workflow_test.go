package workflow

import "testing"

// a G3→G5→G7 sanction flow.
func sanctionDef() Definition {
	return Definition{
		Name: "scheme-sanction",
		Steps: []Step{
			{Name: "G3 District Officer", ApproverRole: "DEO", RequiredScope: "scheme.recommend"},
			{Name: "G5 Director", ApproverRole: "DIRECTOR", RequiredScope: "scheme.approve"},
			{Name: "G7 Secretary", ApproverRole: "SECRETARY", RequiredScope: "fund.release"},
		},
	}
}

func clk() func() string { return func() string { return "2026-06-19T00:00:00Z" } }

func TestMultiTierApproveToCompletion(t *testing.T) {
	d := sanctionDef()
	in, err := Start(d, "WF-1")
	if err != nil {
		t.Fatal(err)
	}
	steps := []struct {
		role, scope string
	}{
		{"DEO", "scheme.recommend"},
		{"DIRECTOR", "scheme.approve"},
		{"SECRETARY", "fund.release"},
	}
	for i, s := range steps {
		if !d.CanAct(in, s.role, []string{s.scope}) {
			t.Fatalf("step %d: %s should be able to act", i, s.role)
		}
		if err := d.Act(in, Approve, s.role+"-1", s.role, []string{s.scope}, "", clk()); err != nil {
			t.Fatalf("step %d act: %v", i, err)
		}
	}
	if in.Status != Approved {
		t.Fatalf("after all tiers approve, status should be approved, got %s", in.Status)
	}
	done, total := d.Progress(in)
	if done != 3 || total != 3 {
		t.Fatalf("progress should be 3/3, got %d/%d", done, total)
	}
	if len(in.History) != 3 {
		t.Fatalf("history should record 3 actions, got %d", len(in.History))
	}
}

func TestRejectTerminates(t *testing.T) {
	d := sanctionDef()
	in, _ := Start(d, "WF-2")
	d.Act(in, Approve, "deo", "DEO", []string{"scheme.recommend"}, "", clk()) // G3 ok
	if err := d.Act(in, Reject, "dir", "DIRECTOR", []string{"scheme.approve"}, "insufficient docs", clk()); err != nil {
		t.Fatal(err)
	}
	if in.Status != Rejected {
		t.Fatalf("a reject must terminate the workflow, got %s", in.Status)
	}
	// no further action possible
	if err := d.Act(in, Approve, "sec", "SECRETARY", []string{"fund.release"}, "", clk()); err == nil {
		t.Fatal("acting on a rejected instance must error")
	}
}

func TestWrongRoleBlocked(t *testing.T) {
	d := sanctionDef()
	in, _ := Start(d, "WF-3")
	// the SECRETARY cannot act at the G3 step (DEO's)
	if d.CanAct(in, "SECRETARY", []string{"*"}) {
		t.Fatal("a non-current-role must not be able to act")
	}
	if err := d.Act(in, Approve, "sec", "SECRETARY", []string{"*"}, "", clk()); err == nil {
		t.Fatal("acting out of role must error")
	}
}

func TestScopeGating(t *testing.T) {
	d := sanctionDef()
	in, _ := Start(d, "WF-4")
	// DEO without the required scope is blocked
	if d.CanAct(in, "DEO", []string{"marks.write"}) {
		t.Fatal("the required scope must gate the action")
	}
	if err := d.Act(in, Approve, "deo", "DEO", []string{"marks.write"}, "", clk()); err == nil {
		t.Fatal("missing scope must error")
	}
	// superscope works
	if err := d.Act(in, Approve, "deo", "DEO", []string{"*"}, "", clk()); err != nil {
		t.Fatalf("superscope should authorise: %v", err)
	}
}

func TestValidation(t *testing.T) {
	if _, err := Start(Definition{Name: "x"}, "i"); err == nil {
		t.Fatal("a definition with no steps must error")
	}
	if _, err := Start(sanctionDef(), ""); err == nil {
		t.Fatal("an empty instance id must error")
	}
}
