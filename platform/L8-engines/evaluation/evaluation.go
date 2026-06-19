// Package evaluation is the L8 model fairness + drift evaluation harness (CC-SPEC-001 §5.1, §17.6).
//
// It computes the metrics that the Rego AI gates adjudicate:
//   - DRIFT: the Population Stability Index (PSI) between a baseline (training/serving) distribution and a
//     live distribution. policies/ai/drift.rego refuses continued serving when PSI > 0.2 (canary rollback).
//   - BIAS: the disparate-impact ratio across a privileged vs unprivileged group and the four-fifths (80%)
//     rule, plus demographic-parity difference. A failing ratio blocks a model.deploy until a fresh
//     bias attestation is signed (policies/ai/bias.rego).
//
// Deterministic + stdlib-only, so a model's fairness/drift posture is reproducible and auditable (G7).
package evaluation

import (
	"errors"
	"math"
)

// DriftThreshold is the PSI level above which serving must roll back (matches policies/ai/drift.rego).
const DriftThreshold = 0.2

// FourFifthsThreshold is the disparate-impact floor of the 80% rule (matches the bias attestation regime).
const FourFifthsThreshold = 0.8

// PSI computes the Population Stability Index between an expected (baseline) and actual distribution given
// as per-bin counts or proportions (they are normalised internally). Bins must align and be non-empty. A
// small epsilon floors empty bins so the log is finite.
func PSI(expected, actual []float64) (float64, error) {
	if len(expected) == 0 || len(expected) != len(actual) {
		return 0, errors.New("evaluation: expected and actual must be non-empty and the same length")
	}
	const eps = 1e-6
	se, sa := sum(expected), sum(actual)
	if se <= 0 || sa <= 0 {
		return 0, errors.New("evaluation: distributions must have positive mass")
	}
	psi := 0.0
	for i := range expected {
		e := expected[i] / se
		a := actual[i] / sa
		if e < eps {
			e = eps
		}
		if a < eps {
			a = eps
		}
		psi += (a - e) * math.Log(a/e)
	}
	return psi, nil
}

// HasDrifted reports whether a PSI value crosses the drift threshold (i.e., serving should roll back).
func HasDrifted(psi float64) bool { return psi > DriftThreshold }

// SelectionRate is favourable_outcomes / group_size in [0,1].
func SelectionRate(favourable, total int) (float64, error) {
	if total <= 0 {
		return 0, errors.New("evaluation: group size must be positive")
	}
	if favourable < 0 || favourable > total {
		return 0, errors.New("evaluation: favourable must be within [0,total]")
	}
	return float64(favourable) / float64(total), nil
}

// DisparateImpact is the ratio of the unprivileged group's selection rate to the privileged group's. A value
// of 1.0 is parity; below FourFifthsThreshold indicates adverse impact on the unprivileged group.
func DisparateImpact(privilegedRate, unprivilegedRate float64) float64 {
	if privilegedRate == 0 {
		if unprivilegedRate == 0 {
			return 1.0 // both zero → no disparity
		}
		return math.Inf(1)
	}
	return unprivilegedRate / privilegedRate
}

// PassesFourFifths reports whether a disparate-impact ratio satisfies the 80% rule.
func PassesFourFifths(di float64) bool { return di >= FourFifthsThreshold }

// DemographicParityDifference is |privilegedRate − unprivilegedRate|; 0 is parity.
func DemographicParityDifference(privilegedRate, unprivilegedRate float64) float64 {
	return math.Abs(privilegedRate - unprivilegedRate)
}

// BiasReport summarises a fairness evaluation across two groups.
type BiasReport struct {
	PrivilegedRate   float64
	UnprivilegedRate float64
	DisparateImpact  float64
	ParityDifference float64
	PassesFourFifths bool
}

// EvaluateBias builds a BiasReport from raw counts for the privileged and unprivileged groups.
func EvaluateBias(privFav, privTotal, unprivFav, unprivTotal int) (BiasReport, error) {
	pr, err := SelectionRate(privFav, privTotal)
	if err != nil {
		return BiasReport{}, err
	}
	ur, err := SelectionRate(unprivFav, unprivTotal)
	if err != nil {
		return BiasReport{}, err
	}
	di := DisparateImpact(pr, ur)
	return BiasReport{
		PrivilegedRate:   pr,
		UnprivilegedRate: ur,
		DisparateImpact:  di,
		ParityDifference: DemographicParityDifference(pr, ur),
		PassesFourFifths: PassesFourFifths(di),
	}, nil
}

func sum(xs []float64) float64 {
	t := 0.0
	for _, x := range xs {
		t += x
	}
	return t
}
