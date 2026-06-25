package integration

import (
	"context"
	"strings"
	"testing"

	"github.com/vasa-eos-se-tn/platform/loop"
	"github.com/vasa-eos-se-tn/platform/retrieval"
)

// scripted loop pieces
type planr struct {
	acts []string
	i    int
}

func (p *planr) Plan(string, []loop.Trace) (string, bool) {
	if p.i >= len(p.acts) {
		return "", true
	}
	a := p.acts[p.i]
	p.i++
	return a, false
}

type okTool struct{}

func (okTool) Run(context.Context, string) loop.Observation {
	return loop.Observation{Output: "ok", OK: true}
}

type okCritic struct{}

func (okCritic) Verify(string, string, loop.Observation) (bool, string) { return true, "" }

func TestRunLoopCompletesAndAudits(t *testing.T) {
	p := newPlatform(t)
	before := p.Audit.Len()
	res, err := p.RunLoop(context.Background(), "remediate a weak objective",
		&planr{acts: []string{"diagnose", "recommend", "schedule"}}, okTool{}, okCritic{},
		func(string) bool { return false })
	if err != nil {
		t.Fatal(err)
	}
	if !res.Done {
		t.Fatalf("the loop should complete: %+v", res)
	}
	if p.Audit.Len() <= before {
		t.Fatal("loop steps must be audited through the platform chain")
	}
}

func TestRunLoopHITLCheckpoint(t *testing.T) {
	p := newPlatform(t)
	res, _ := p.RunLoop(context.Background(), "disburse a scholarship",
		&planr{acts: []string{"verify-eligibility", "release-funds"}}, okTool{}, okCritic{},
		func(a string) bool { return strings.HasPrefix(a, "release-funds") })
	if !res.Pending || res.PendingAction != "release-funds" {
		t.Fatalf("a consequential loop action must pause at a HITL checkpoint: %+v", res)
	}
}

// tutor grounding via the policy-bound retriever
type tutorGraph struct{}

func (tutorGraph) Related(c string) []string {
	if c == "frac" {
		return []string{"div", "place"}
	}
	return nil
}

func TestTutorGroundsInPolicyBoundSources(t *testing.T) {
	p := newPlatform(t)
	p.SetRetriever(retrieval.New([]retrieval.Doc{
		{ID: "PUB1", Text: "fractions are parts of a whole", Tenant: "public", Class: retrieval.Public, Concepts: []string{"frac"}},
		{ID: "PII1", Text: "fractions student aadhaar marks", Tenant: "TN/Chennai", Class: retrieval.Restricted, Concepts: []string{"frac"}},
		{ID: "OTHER", Text: "fractions worksheet", Tenant: "TN/Madurai", Class: retrieval.Public, Concepts: []string{"frac"}},
	}, tutorGraph{}))

	res, err := p.AskTutor(context.Background(), TutorRequest{
		Tenant: "TN/Chennai", UserID: "stu-1", Question: "explain fractions", AgeAppropriate: true,
		Mastered: map[string]bool{"div": true, "place": true}, Target: "frac",
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Sources) == 0 || res.Sources[0] != "PUB1" {
		t.Fatalf("the tutor should ground in the public doc first: %v", res.Sources)
	}
	for _, s := range res.Sources {
		if s == "PII1" {
			t.Fatal("a restricted (class-1) doc must NOT ground a learner answer (policy-bound at retrieval)")
		}
		if s == "OTHER" {
			t.Fatal("another tenant's doc must NOT be retrieved (tenant isolation)")
		}
	}
}
