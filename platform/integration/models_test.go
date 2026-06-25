package integration

import "testing"

func TestPlatformModelRegistryAtBoot(t *testing.T) {
	p := newPlatform(t)
	sum := p.ModelRegistry()
	if sum.Total < 4 {
		t.Fatalf("expected the classifier + gated GPU models registered, got %d", sum.Total)
	}
	// the deterministic safety classifier is genuinely in production.
	if !p.ModelServable("safety-classifier", "v1") {
		t.Fatal("the in-production safety classifier must be deployed + servable")
	}
	// the gated generative models are registered but NOT serving.
	if p.ModelServable("llama-3.x-70b", "v1") {
		t.Fatal("the GPU model is gated on substrate/evidence and must not be servable")
	}
	// no model may be in production without a signed card → coverage is fully compliant.
	if len(sum.UnsignedInProd) != 0 || p.ModelCardCoverage() != 1 {
		t.Fatalf("model-card coverage SLA must be 1.0 with no unsigned production model: %+v", sum)
	}
}

func TestPlatformModelEntryHistory(t *testing.T) {
	p := newPlatform(t)
	e, ok := p.ModelEntry("safety-classifier", "v1")
	if !ok {
		t.Fatal("classifier must be registered")
	}
	if e.Approver != "Secretary, School Education" {
		t.Fatalf("the deployed classifier should record its human approver, got %q", e.Approver)
	}
	if len(e.RedTeam) == 0 {
		t.Fatal("the deployed classifier must carry red-team evidence")
	}
	if len(e.History) < 4 {
		t.Fatalf("the classifier should have a full lifecycle history, got %d events", len(e.History))
	}
}
