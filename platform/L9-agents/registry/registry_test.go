package agentregistry

import "testing"

func TestSixAgents(t *testing.T) {
	if len(Agents) != 6 {
		t.Fatalf("expected 6 agents, got %d", len(Agents))
	}
	for _, id := range []AgentID{Policy, Teacher, Student, Governance, Grievance, Compliance} {
		if _, err := Spec(id); err != nil {
			t.Errorf("missing agent %q: %v", id, err)
		}
	}
}

func TestHighStakesAgents(t *testing.T) {
	// policy + compliance are high-stakes (always require human approval)
	for _, id := range []AgentID{Policy, Compliance} {
		s, _ := Spec(id)
		if !s.HighStakes {
			t.Errorf("agent %q should be high-stakes", id)
		}
	}
	s, _ := Spec(Teacher)
	if s.HighStakes {
		t.Error("teacher agent should not be high-stakes")
	}
}

func TestUnknownAgent(t *testing.T) {
	if _, err := Spec("nope"); err == nil {
		t.Fatal("unknown agent must error")
	}
}

func TestToolRegistryDefaults(t *testing.T) {
	r := NewRegistry()
	dbt, err := r.Lookup("initiate_dbt")
	if err != nil {
		t.Fatal(err)
	}
	if dbt.Risk != High || dbt.RequiredScope != "fund.release" || !dbt.SideEffecting {
		t.Fatalf("initiate_dbt mis-registered: %+v", dbt)
	}
	ans, _ := r.Lookup("answer_query")
	if ans.Risk != Low || ans.SideEffecting {
		t.Fatalf("answer_query should be low-risk read-only: %+v", ans)
	}
}

func TestRegisterRejectsHighRiskWithoutScope(t *testing.T) {
	r := NewRegistry()
	if err := r.Register(Tool{Name: "wipe_records", Risk: High, SideEffecting: true}); err == nil {
		t.Fatal("a high-risk tool without a required scope must be rejected")
	}
	if err := r.Register(Tool{Name: "wipe_records", Risk: High, RequiredScope: "data.purge", SideEffecting: true}); err != nil {
		t.Fatalf("a high-risk tool with a scope should register: %v", err)
	}
}

func TestLookupUnknownTool(t *testing.T) {
	if _, err := NewRegistry().Lookup("ghost"); err == nil {
		t.Fatal("unknown tool must error")
	}
}

func TestRiskString(t *testing.T) {
	if Low.String() != "low" || Medium.String() != "medium" || High.String() != "high" {
		t.Fatal("risk strings wrong")
	}
}
