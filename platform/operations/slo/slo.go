// Package slo is the Phase-8 SLO + error-budget engine (CC-SPEC-001 §10.8, §24 Phase 8, §26.8).
//
// Operations is governed by error budgets, not vibes. An SLO sets a target (e.g. 99.9% of requests succeed
// within latency) over a window; the error budget is the slack (1 − target). This package computes the
// realised success rate, how much budget has been burned, the burn rate (how fast the budget is being spent
// vs the rate that would exactly exhaust it over the window), and a DEPLOY-FREEZE verdict: when the budget is
// exhausted, change is frozen until reliability recovers (the spec's release gate). Deterministic + stdlib.
package slo

import (
	"errors"
	"time"
)

// SLO is a service-level objective.
type SLO struct {
	Name   string
	Target float64       // e.g. 0.999 (99.9% good)
	Window time.Duration // the rolling window the budget is measured over
}

// Validate checks the SLO is well-formed.
func (s SLO) Validate() error {
	if s.Name == "" {
		return errors.New("slo: name required")
	}
	if s.Target <= 0 || s.Target >= 1 {
		return errors.New("slo: target must be in (0,1)")
	}
	if s.Window <= 0 {
		return errors.New("slo: window must be positive")
	}
	return nil
}

// ErrorBudget is the allowed bad-event fraction (1 − target).
func (s SLO) ErrorBudget() float64 { return 1 - s.Target }

// Status is a point-in-time error-budget assessment.
type Status struct {
	SuccessRate     float64 // good / total
	BudgetFraction  float64 // the SLO's error budget (1 − target)
	BudgetConsumed  float64 // fraction of the budget spent, in [0, >1]; >1 means breached
	BudgetRemaining float64 // 1 − consumed, floored at 0 for reporting (can be negative internally)
	Breached        bool    // realised bad-rate exceeded the budget
	DeployFrozen    bool    // change freeze: budget exhausted
}

// Assess computes the error-budget status from good/total counts over the window.
func (s SLO) Assess(good, total int) (Status, error) {
	if err := s.Validate(); err != nil {
		return Status{}, err
	}
	if total <= 0 || good < 0 || good > total {
		return Status{}, errors.New("slo: require 0 <= good <= total and total > 0")
	}
	successRate := float64(good) / float64(total)
	badRate := 1 - successRate
	budget := s.ErrorBudget()
	consumed := badRate / budget // 1.0 == exactly exhausted
	remaining := 1 - consumed
	if remaining < 0 {
		remaining = 0
	}
	breached := consumed > 1
	return Status{
		SuccessRate:     successRate,
		BudgetFraction:  budget,
		BudgetConsumed:  consumed,
		BudgetRemaining: remaining,
		Breached:        breached,
		// Freeze deploys once the budget is fully consumed (or breached).
		DeployFrozen: consumed >= 1,
	}, nil
}

// DeployAllowed reports whether a change may ship given current good/total — false when the budget is spent.
func (s SLO) DeployAllowed(good, total int) (bool, error) {
	st, err := s.Assess(good, total)
	if err != nil {
		return false, err
	}
	return !st.DeployFrozen, nil
}

// BurnRate returns how fast the budget is being spent relative to the steady rate that would exactly exhaust
// it over the window, measured over a shorter lookback. A burn rate > 1 means the budget will be gone before
// the window ends; fast-burn alerts (e.g. 14.4×/1h) page on-call. good/total are over `lookback`.
func (s SLO) BurnRate(good, total int, lookback time.Duration) (float64, error) {
	if err := s.Validate(); err != nil {
		return 0, err
	}
	if total <= 0 || good < 0 || good > total {
		return 0, errors.New("slo: require 0 <= good <= total and total > 0")
	}
	if lookback <= 0 {
		return 0, errors.New("slo: lookback must be positive")
	}
	badRate := 1 - float64(good)/float64(total)
	// the budget burned in `lookback` as a fraction of the whole-window budget
	consumedInLookback := badRate / s.ErrorBudget()
	// scale to the full window: a steady 1× burn consumes exactly 1.0 over the window
	return consumedInLookback * (float64(s.Window) / float64(lookback)), nil
}

// Availability is a canonical 99.9% / 30-day availability SLO.
func Availability() SLO { return SLO{Name: "availability", Target: 0.999, Window: 30 * 24 * time.Hour} }

// LatencyP99 is a canonical 99% / 30-day latency-success SLO (fraction of requests under the latency target).
func LatencyP99() SLO { return SLO{Name: "latency-p99", Target: 0.99, Window: 30 * 24 * time.Hour} }
