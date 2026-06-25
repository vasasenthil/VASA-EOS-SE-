package evaluation

import (
	"math"
	"testing"
)

func approx(a, b float64) bool { return math.Abs(a-b) < 1e-9 }

func TestPSIIdenticalIsZero(t *testing.T) {
	d := []float64{100, 200, 300, 400}
	psi, err := PSI(d, d)
	if err != nil {
		t.Fatal(err)
	}
	if !approx(psi, 0) {
		t.Fatalf("identical distributions must give PSI 0, got %v", psi)
	}
	if HasDrifted(psi) {
		t.Fatal("no drift on identical distributions")
	}
}

func TestPSIDetectsShift(t *testing.T) {
	base := []float64{250, 250, 250, 250}
	shifted := []float64{50, 100, 350, 500} // mass moved to later bins
	psi, err := PSI(base, shifted)
	if err != nil {
		t.Fatal(err)
	}
	if psi <= DriftThreshold {
		t.Fatalf("a large shift should exceed the drift threshold; PSI=%v", psi)
	}
	if !HasDrifted(psi) {
		t.Fatal("HasDrifted should be true")
	}
}

func TestPSINormalisesProportions(t *testing.T) {
	// same shape at different scale → PSI ~ 0
	psi, err := PSI([]float64{1, 2, 3}, []float64{100, 200, 300})
	if err != nil {
		t.Fatal(err)
	}
	if !approx(psi, 0) {
		t.Fatalf("scale-invariant distributions must give PSI 0, got %v", psi)
	}
}

func TestPSIRejectsBadInput(t *testing.T) {
	if _, err := PSI(nil, nil); err == nil {
		t.Fatal("empty must error")
	}
	if _, err := PSI([]float64{1, 2}, []float64{1}); err == nil {
		t.Fatal("mismatched lengths must error")
	}
}

func TestDisparateImpactParity(t *testing.T) {
	// equal selection rates → DI 1.0, passes 4/5ths
	r, err := EvaluateBias(80, 100, 80, 100)
	if err != nil {
		t.Fatal(err)
	}
	if !approx(r.DisparateImpact, 1.0) || !r.PassesFourFifths {
		t.Fatalf("equal rates → parity; got DI=%v pass=%v", r.DisparateImpact, r.PassesFourFifths)
	}
	if !approx(r.ParityDifference, 0) {
		t.Fatalf("parity difference should be 0, got %v", r.ParityDifference)
	}
}

func TestDisparateImpactAdverse(t *testing.T) {
	// privileged 80%, unprivileged 40% → DI 0.5 → fails the 80% rule
	r, err := EvaluateBias(80, 100, 40, 100)
	if err != nil {
		t.Fatal(err)
	}
	if !approx(r.DisparateImpact, 0.5) {
		t.Fatalf("expected DI 0.5, got %v", r.DisparateImpact)
	}
	if r.PassesFourFifths {
		t.Fatal("DI 0.5 must fail the four-fifths rule")
	}
	if !approx(r.ParityDifference, 0.4) {
		t.Fatalf("expected parity difference 0.4, got %v", r.ParityDifference)
	}
}

func TestDisparateImpactBoundary(t *testing.T) {
	// privileged 100%, unprivileged 80% → DI exactly 0.8 → passes (>=)
	r, _ := EvaluateBias(100, 100, 80, 100)
	if !r.PassesFourFifths {
		t.Fatalf("DI exactly 0.8 should pass the four-fifths rule, got DI=%v", r.DisparateImpact)
	}
}

func TestSelectionRateValidation(t *testing.T) {
	if _, err := SelectionRate(5, 0); err == nil {
		t.Fatal("zero total must error")
	}
	if _, err := SelectionRate(11, 10); err == nil {
		t.Fatal("favourable>total must error")
	}
}

func TestDisparateImpactBothZero(t *testing.T) {
	if di := DisparateImpact(0, 0); !approx(di, 1.0) {
		t.Fatalf("both-zero rates → no disparity (1.0), got %v", di)
	}
}
