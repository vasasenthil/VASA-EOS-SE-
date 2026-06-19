// Package loadmodel defines the L10 load-test scenarios (CC-SPEC-001 §10.8) and a deterministic arrival-shape
// model. The empirical 1-crore proof runs on the dedicated load rig (BLOCKERS B-032); these are the exact
// scenarios it executes — the 1-crore one-hour run, the 2-crore surge, and the 72-hour soak — expressed as
// staged ramps. The arrival model (active virtual users at any instant) lets the platform validate a
// scenario's shape and lets capacity planning consume the peak before the rig is provisioned. Stdlib-only.
package loadmodel

import (
	"errors"
	"time"
)

// Crore is 10,000,000 — the unit the scale targets are expressed in.
const Crore = 10_000_000

// Stage is one ramp segment: over Duration, the active virtual users move linearly from the previous stage's
// target to TargetVUs (the first stage ramps from 0).
type Stage struct {
	Duration  time.Duration
	TargetVUs int
}

// Scenario is a named staged load profile.
type Scenario struct {
	Name        string
	Description string
	Stages      []Stage
}

// Validate checks the scenario is well-formed (non-empty, positive durations, non-negative targets).
func (s Scenario) Validate() error {
	if s.Name == "" {
		return errors.New("loadmodel: scenario name required")
	}
	if len(s.Stages) == 0 {
		return errors.New("loadmodel: scenario needs at least one stage")
	}
	for i, st := range s.Stages {
		if st.Duration <= 0 {
			return errors.New("loadmodel: stage duration must be positive")
		}
		if st.TargetVUs < 0 {
			return errors.New("loadmodel: stage target must be non-negative")
		}
		_ = i
	}
	return nil
}

// TotalDuration is the sum of all stage durations.
func (s Scenario) TotalDuration() time.Duration {
	var total time.Duration
	for _, st := range s.Stages {
		total += st.Duration
	}
	return total
}

// PeakVUs is the highest target across stages.
func (s Scenario) PeakVUs() int {
	peak := 0
	for _, st := range s.Stages {
		if st.TargetVUs > peak {
			peak = st.TargetVUs
		}
	}
	return peak
}

// ActiveVUsAt returns the active virtual-user count at elapsed time t, linearly interpolating within the
// stage that contains t. Before the run it is 0; at/after the end it holds the final target.
func (s Scenario) ActiveVUsAt(t time.Duration) int {
	if t <= 0 {
		return 0
	}
	prevTarget := 0
	var elapsed time.Duration
	for _, st := range s.Stages {
		if t < elapsed+st.Duration {
			into := t - elapsed
			frac := float64(into) / float64(st.Duration)
			return prevTarget + int(float64(st.TargetVUs-prevTarget)*frac)
		}
		elapsed += st.Duration
		prevTarget = st.TargetVUs
	}
	return prevTarget // after the last stage, hold its target
}

// CroreHour is the 1-crore × 1-hour run: ramp to 1 Cr over 10m, hold 1h, ramp down 10m (§10.8).
func CroreHour() Scenario {
	return Scenario{
		Name:        "crore-hour",
		Description: "1 crore concurrent VUs sustained for one hour (the headline scale proof).",
		Stages: []Stage{
			{10 * time.Minute, 1 * Crore}, // ramp up
			{60 * time.Minute, 1 * Crore}, // steady state
			{10 * time.Minute, 0},         // ramp down
		},
	}
}

// Surge is the 2-crore surge: a steep ramp to 2 Cr held briefly, modelling an exam-result spike (§10.8).
func Surge() Scenario {
	return Scenario{
		Name:        "surge",
		Description: "2 crore concurrent VUs surge (exam-result / admission spike).",
		Stages: []Stage{
			{5 * time.Minute, 2 * Crore},  // steep ramp
			{15 * time.Minute, 2 * Crore}, // hold the surge
			{5 * time.Minute, 0},          // recover
		},
	}
}

// Soak is the 72-hour soak: a steady moderate load to surface leaks/degradation over time (§10.8).
func Soak() Scenario {
	return Scenario{
		Name:        "soak",
		Description: "72-hour soak at a sustained steady load (leak / degradation detection).",
		Stages: []Stage{
			{30 * time.Minute, 3 * Crore / 10}, // ramp to 30 lakh
			{72 * time.Hour, 3 * Crore / 10},   // hold for 72h
			{30 * time.Minute, 0},
		},
	}
}

// Suite is the canonical §10.8 load-test suite the rig executes.
func Suite() []Scenario { return []Scenario{CroreHour(), Surge(), Soak()} }
