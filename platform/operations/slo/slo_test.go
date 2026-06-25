package slo

import (
	"math"
	"testing"
	"time"
)

func approx(a, b float64) bool { return math.Abs(a-b) < 1e-9 }

func TestErrorBudget(t *testing.T) {
	if !approx(Availability().ErrorBudget(), 0.001) {
		t.Fatalf("99.9%% SLO budget should be 0.001, got %v", Availability().ErrorBudget())
	}
}

func TestAssessWithinBudget(t *testing.T) {
	s := Availability() // budget 0.001
	// 1,000,000 requests, 500 bad → bad rate 0.0005 = half the budget
	st, err := s.Assess(999_500, 1_000_000)
	if err != nil {
		t.Fatal(err)
	}
	if !approx(st.BudgetConsumed, 0.5) {
		t.Fatalf("half the budget should be consumed, got %v", st.BudgetConsumed)
	}
	if st.Breached || st.DeployFrozen {
		t.Fatal("within budget should not breach or freeze")
	}
	if !approx(st.BudgetRemaining, 0.5) {
		t.Fatalf("half remaining, got %v", st.BudgetRemaining)
	}
}

func TestAssessBudgetExhaustedFreezesDeploys(t *testing.T) {
	s := Availability() // budget 0.001
	// bad rate exactly 0.001 → budget fully consumed → freeze
	st, _ := s.Assess(999_000, 1_000_000)
	if !st.DeployFrozen {
		t.Fatalf("a fully-consumed budget must freeze deploys; consumed=%v", st.BudgetConsumed)
	}
	allowed, _ := s.DeployAllowed(999_000, 1_000_000)
	if allowed {
		t.Fatal("deploys must be blocked when the budget is exhausted")
	}
}

func TestAssessBreached(t *testing.T) {
	s := Availability()
	// bad rate 0.002 = 2× the budget → breached
	st, _ := s.Assess(998_000, 1_000_000)
	if !st.Breached || !st.DeployFrozen {
		t.Fatalf("over-budget must breach and freeze: %+v", st)
	}
	if st.BudgetRemaining != 0 {
		t.Fatalf("remaining should floor at 0, got %v", st.BudgetRemaining)
	}
}

func TestDeployAllowedWithinBudget(t *testing.T) {
	allowed, err := Availability().DeployAllowed(999_900, 1_000_000) // bad rate 0.0001, well within
	if err != nil {
		t.Fatal(err)
	}
	if !allowed {
		t.Fatal("a healthy budget should allow deploys")
	}
}

func TestBurnRateFast(t *testing.T) {
	s := Availability() // window 30d, budget 0.001
	// over a 1h lookback, bad rate 0.001 (== full budget burned in 1h)
	// burn = (0.001/0.001) × (30d / 1h) = 1 × 720 = 720× (very fast burn)
	rate, err := s.BurnRate(9_990, 10_000, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	if !approx(rate, 720) {
		t.Fatalf("expected a 720× burn rate, got %v", rate)
	}
}

func TestBurnRateSteady(t *testing.T) {
	s := Availability()
	// a steady burn that exactly exhausts the budget over the full 30d window → 1×
	// bad rate over a 30d lookback equal to the budget
	rate, _ := s.BurnRate(999_000, 1_000_000, 30*24*time.Hour)
	if !approx(rate, 1) {
		t.Fatalf("a budget-matching steady burn should be 1×, got %v", rate)
	}
}

func TestValidation(t *testing.T) {
	if _, err := (SLO{Name: "x", Target: 1.0, Window: time.Hour}).Assess(1, 1); err == nil {
		t.Fatal("target of 1.0 must error")
	}
	if _, err := Availability().Assess(10, 5); err == nil {
		t.Fatal("good>total must error")
	}
	if _, err := Availability().Assess(1, 0); err == nil {
		t.Fatal("zero total must error")
	}
}
