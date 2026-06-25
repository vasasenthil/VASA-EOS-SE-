package modelregistry

import (
	"testing"

	"github.com/vasa-eos-se-tn/platform/evaluation"
)

// fairCard is a model card that passes bias + drift + signature (deployable once red-teamed).
func fairCard(name, version, signer string) evaluation.ModelCard {
	bias, _ := evaluation.EvaluateBias(80, 100, 78, 100) // DI ~0.975 → passes four-fifths
	return evaluation.ModelCard{
		Name: name, Version: version, IntendedUse: "classroom safety classification",
		Owner: "G6 Ethics Chair", Bias: bias, PSI: 0.05, AttestationBy: signer,
	}
}

// clock returns a deterministic monotonically-increasing timestamp source.
func clock() func() string {
	n := 0
	return func() string { n++; return "t" + string(rune('0'+n)) }
}

func TestDeployRequiresGateRedTeamAndHuman(t *testing.T) {
	r := New(clock())
	c := fairCard("safety-classifier", "v1", "G6 Ethics Chair")
	e := r.Register(c, "G5")
	if e.State != Registered {
		t.Fatalf("a deployable card should register as Registered, got %s (%v)", e.State, e.Reasons)
	}
	// cannot request deploy without red-team evidence.
	if _, err := r.RequestDeploy("safety-classifier", "v1", "G5"); err != ErrNoRedTeam {
		t.Fatalf("expected ErrNoRedTeam without red-team evidence, got %v", err)
	}
	if _, err := r.AddRedTeam("safety-classifier", "v1", "RT-2026-001 jailbreak suite passed", "G6"); err != nil {
		t.Fatal(err)
	}
	if _, err := r.RequestDeploy("safety-classifier", "v1", "G5"); err != nil {
		t.Fatalf("deploy request should succeed once red-teamed: %v", err)
	}
	// a human must approve — and the model is not servable until then.
	if r.IsServable("safety-classifier", "v1") {
		t.Fatal("a pending model must not be servable")
	}
	if _, err := r.Approve("safety-classifier", "v1", ""); err == nil {
		t.Fatal("approval with no named human must fail")
	}
	got, err := r.Approve("safety-classifier", "v1", "Secretary, School Education")
	if err != nil {
		t.Fatal(err)
	}
	if got.State != Deployed || got.Approver != "Secretary, School Education" {
		t.Fatalf("approved model should be Deployed with the approver recorded: %+v", got)
	}
	if !r.IsServable("safety-classifier", "v1") {
		t.Fatal("an approved model must be servable")
	}
}

func TestUnsignedOrBiasedCardIsBlocked(t *testing.T) {
	r := New(clock())
	// unsigned attestation → blocked.
	unsigned := fairCard("m", "v1", "")
	if e := r.Register(unsigned, "G5"); e.State != Blocked {
		t.Fatalf("unsigned card must be Blocked, got %s", e.State)
	}
	// biased card (DI well below four-fifths) → blocked even when signed.
	bias, _ := evaluation.EvaluateBias(90, 100, 40, 100) // DI ~0.44
	biased := evaluation.ModelCard{Name: "b", Version: "v1", Owner: "G6", Bias: bias, PSI: 0.05, AttestationBy: "G6"}
	e := r.Register(biased, "G5")
	if e.State != Blocked {
		t.Fatalf("biased card must be Blocked, got %s", e.State)
	}
	found := false
	for _, reason := range e.Reasons {
		if reason != "" {
			found = true
		}
	}
	if !found {
		t.Fatal("blocked card must carry failure reasons")
	}
}

func TestDriftTripsAutomaticRollback(t *testing.T) {
	r := New(clock())
	c := fairCard("indic-asr", "v2", "G5")
	r.Register(c, "G5")
	r.AddRedTeam("indic-asr", "v2", "RT pass", "G6")
	r.RequestDeploy("indic-asr", "v2", "G5")
	r.Approve("indic-asr", "v2", "Director DTERT")
	if !r.IsServable("indic-asr", "v2") {
		t.Fatal("model should be live before drift")
	}
	// drift past the PSI threshold → automatic rollback to blocked.
	got, err := r.RefreshDrift("indic-asr", "v2", 0.9, "drift-monitor")
	if err != nil {
		t.Fatal(err)
	}
	if got.State != Blocked {
		t.Fatalf("drifted live model must roll back to Blocked, got %s", got.State)
	}
	if r.IsServable("indic-asr", "v2") {
		t.Fatal("a rolled-back model must not be servable")
	}
}

func TestSummaryCardCoverageAndHistory(t *testing.T) {
	r := New(clock())
	// one model fully deployed.
	r.Register(fairCard("safety", "v1", "G6"), "G5")
	r.AddRedTeam("safety", "v1", "RT", "G6")
	r.RequestDeploy("safety", "v1", "G5")
	r.Approve("safety", "v1", "Secretary")
	// one model registered-only (gated GPU model awaiting evidence/substrate).
	r.Register(fairCard("llama-70b", "v1", "G5"), "G5")

	s := r.Summary()
	if s.Total != 2 || s.Deployed != 1 {
		t.Fatalf("summary totals wrong: %+v", s)
	}
	if len(s.UnsignedInProd) != 0 || s.CardCoverage != 1 {
		t.Fatalf("card coverage must be 1.0 with no unsigned model in production: %+v", s)
	}
	e, _ := r.Get("safety", "v1")
	if len(e.History) < 4 {
		t.Fatalf("a deployed model should have a full transition history, got %d events", len(e.History))
	}
}

func TestUnknownModelErrors(t *testing.T) {
	r := New(clock())
	if _, err := r.AddRedTeam("nope", "v1", "x", "y"); err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
	if r.IsServable("nope", "v1") {
		t.Fatal("an unregistered model must never be servable (fail-closed)")
	}
}
