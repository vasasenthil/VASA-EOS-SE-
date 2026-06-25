package integration

import (
	"context"
	"testing"
	"testing/fstest"

	"github.com/vasa-eos-se-tn/platform/agents"
	"github.com/vasa-eos-se-tn/platform/engines"
	"github.com/vasa-eos-se-tn/platform/orchestrator"
)

// A teacher agent (low-stakes) recommending a low-risk tool at high confidence auto-executes through the
// orchestrator — the full engines → agent → orchestrator path.
func TestAdviseTeacherAutoExecutes(t *testing.T) {
	p := newPlatform(t)
	rec := agents.Teacher(
		[]engines.RubricItem{{ID: "q1", Marks: 10, Objective: "fractions"}},
		[]engines.Response{{ItemID: "q1", Awarded: 10}},
		[]string{"fractions"},
	)
	out, err := p.Advise(context.Background(), rec, "diagnose_mastery", nil)
	if err != nil {
		t.Fatal(err)
	}
	if out.State != orchestrator.AutoExecuted {
		t.Fatalf("a low-stakes, high-confidence teacher proposal should auto-execute: %+v", out)
	}
}

// A policy agent (high-stakes) recommending a high-risk tool must route to a human regardless of confidence.
func TestAdvisePolicyRoutesToHuman(t *testing.T) {
	p := newPlatform(t)
	rec := agents.Policy(engines.Baseline{Population: 1000, CurrentCoverage: 0.6}, engines.Lever{Name: "midday-meal", CoverageDelta: 0.2, CostPerUnit: 30})
	out, err := p.Advise(context.Background(), rec, "sanction_lever", nil)
	if err != nil {
		t.Fatal(err)
	}
	if out.State != orchestrator.PendingApproval || out.RequestID == "" {
		t.Fatalf("a high-stakes policy proposal must go to the HITL queue: %+v", out)
	}
	if !containsStr(out.Reasons, "agent-high-stakes") && !containsStr(out.Reasons, "tool-high-risk") {
		t.Fatalf("the routing reason should cite the stakes/risk: %v", out.Reasons)
	}
}

func TestEscrowManifestIsVerifiable(t *testing.T) {
	p := newPlatform(t)
	tree := fstest.MapFS{
		"src/main.go":    {Data: []byte("package main\nfunc main(){}\n")},
		"docs/READ.md":   {Data: []byte("# vasa\n")},
		"node_modules/x": {Data: []byte("junk")}, // must be skipped
	}
	m, err := p.EscrowManifest(tree, "vasa-eos-se-tn", "docs/DEPLOYMENT.md", "sbom:digest", "hsm:key-1")
	if err != nil {
		t.Fatal(err)
	}
	if len(m.Entries) != 2 {
		t.Fatalf("node_modules must be skipped; expected 2 entries, got %d", len(m.Entries))
	}
	if m.Root == "" {
		t.Fatal("the escrow manifest must have a Merkle root")
	}
}

func TestLoadScenariosSurfaced(t *testing.T) {
	p := newPlatform(t)
	s := p.LoadScenarios()
	if len(s) != 3 {
		t.Fatalf("the §10.8 suite has 3 scenarios, got %d", len(s))
	}
}

func containsStr(xs []string, s string) bool {
	for _, x := range xs {
		if x == s {
			return true
		}
	}
	return false
}
