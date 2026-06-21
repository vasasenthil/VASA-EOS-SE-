package integration

import "testing"

func TestRTILifecycle(t *testing.T) {
	p := newPlatform(t)
	before := p.Audit.Len()
	r := p.FileRTI("RTI-1", "school sanitation data", "Anbu")
	if r.Status != "filed" {
		t.Fatalf("a filed RTI should be in 'filed' state, got %q", r.Status)
	}
	// filing is audited.
	if p.Audit.Len() <= before {
		t.Fatal("filing an RTI must extend the audit chain")
	}
	// it appears in the register, not yet overdue, not yet answered.
	got, found, overdue := p.RTIStatus("RTI-1")
	if !found || overdue || got.Status != "filed" {
		t.Fatalf("fresh RTI status wrong: %+v found=%v overdue=%v", got, found, overdue)
	}
	if len(p.RTIRequests()) != 1 {
		t.Fatalf("expected 1 RTI in the register, got %d", len(p.RTIRequests()))
	}
	// PIO acknowledges, then answers.
	if _, ok := p.AcknowledgeRTI("RTI-1"); !ok {
		t.Fatal("acknowledging a filed RTI must succeed")
	}
	ans, ok := p.AnswerRTI("RTI-1", "published at /civic open-data")
	if !ok || ans.Status != "answered" || ans.Answer == "" {
		t.Fatalf("answering an RTI must record the answer + state: %+v ok=%v", ans, ok)
	}
	// an answered RTI is reflected in the civic summary.
	if s := p.CivicSummary(); s.RTIAnswered != 1 || s.RTIOpen != 0 {
		t.Fatalf("civic summary after answer wrong: %+v", s)
	}
}

func TestRTIUnknown(t *testing.T) {
	p := newPlatform(t)
	if _, ok := p.AcknowledgeRTI("ghost"); ok {
		t.Fatal("acknowledging an unknown RTI must fail")
	}
	if _, found, _ := p.RTIStatus("ghost"); found {
		t.Fatal("an unknown RTI must not be found")
	}
}
