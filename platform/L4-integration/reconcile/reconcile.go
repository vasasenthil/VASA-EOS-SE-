// Package reconcile is the L4 federation drift-reconciliation engine (CC-SPEC-001 §10.6, §20).
//
// "Federate, never duplicate" only holds if the platform can TELL when its local copy has drifted from the
// national source of truth (APAAR, UDISE+/EMIS, PFMS). This is a faithful port of the reference engine
// (lib/federation/reconcile.ts, crosswalk verdict PORT). It compares an upstream record against the local
// record field-by-field, classifies each field, and produces an EXPLAINABLE advisory verdict —
// Reconciled / Review / Flagged. It is advisory only and never mutates anything: a human reconciler decides
// (HITL). Pure + deterministic.
package reconcile

import (
	"fmt"
	"math"
	"strings"
)

// Recommendation is the advisory verdict.
type Recommendation string

const (
	Reconciled Recommendation = "Reconciled" // local agrees with the source of truth
	Review     Recommendation = "Review"     // non-critical fields differ; reconcile to source
	Flagged    Recommendation = "Flagged"    // identity-critical drift; verify before trusting either copy
)

// ── String (field-level) reconciliation ─────────────────────────────────────

// FieldState classifies one string field.
type FieldState string

const (
	Match           FieldState = "match"
	Drift           FieldState = "drift"
	MissingUpstream FieldState = "missing-upstream"
	MissingLocal    FieldState = "missing-local"
)

// FieldComparison is one compared field.
type FieldComparison struct {
	Field    string
	Label    string
	Upstream string
	Local    string
	State    FieldState
	Critical bool // identity-critical (name, DOB) — a drift here escalates to Flagged
}

// Report is the string-reconciliation result.
type Report struct {
	Recommendation     Recommendation
	Rationale          string
	Fields             []FieldComparison
	Comparable         int
	Matches            int
	DriftCount         int
	CriticalDriftCount int
	MatchPct           int
}

func norm(v string) string { return strings.ToLower(strings.TrimSpace(v)) }

// ClassifyField classifies a string field from raw upstream/local values.
func ClassifyField(upstream, local string) FieldState {
	u, l := norm(upstream), norm(local)
	switch {
	case u == "" && l == "":
		return Match // nothing to compare → not a discrepancy
	case u == "":
		return MissingUpstream
	case l == "":
		return MissingLocal
	case u == l:
		return Match
	default:
		return Drift
	}
}

// Field is the raw input for one comparison.
type Field struct {
	Field    string
	Label    string
	Upstream string
	Local    string
	Critical bool
}

// Compare classifies each raw field and builds the report.
func Compare(rows []Field) Report {
	fields := make([]FieldComparison, len(rows))
	for i, r := range rows {
		fields[i] = FieldComparison{
			Field: r.Field, Label: r.Label, Upstream: r.Upstream, Local: r.Local,
			State: ClassifyField(r.Upstream, r.Local), Critical: r.Critical,
		}
	}
	return buildReport(fields)
}

func bothEmpty(f FieldComparison) bool { return norm(f.Upstream) == "" && norm(f.Local) == "" }

func buildReport(fields []FieldComparison) Report {
	comparable, matches := 0, 0
	var drifts, criticalDrifts []FieldComparison
	for _, f := range fields {
		if !bothEmpty(f) {
			comparable++
			if f.State == Match {
				matches++
			}
		}
		if f.State != Match {
			drifts = append(drifts, f)
			if f.Critical {
				criticalDrifts = append(criticalDrifts, f)
			}
		}
	}
	matchPct := 100
	if comparable > 0 {
		matchPct = int(math.Round(float64(matches) / float64(comparable) * 100))
	}

	var rec Recommendation
	var rationale string
	switch {
	case len(criticalDrifts) > 0:
		rec = Flagged
		rationale = fmt.Sprintf("Identity-critical drift on %s — verify before trusting either copy.", labels(criticalDrifts))
	case len(drifts) > 0:
		rec = Review
		rationale = fmt.Sprintf("%d non-critical field(s) differ (%s); reconcile the local record to the source of truth.", len(drifts), labels(drifts))
	default:
		rec = Reconciled
		if comparable == 0 {
			rationale = "No overlapping fields to compare."
		} else {
			rationale = "Local record agrees with the source of truth on every compared field."
		}
	}
	return Report{
		Recommendation: rec, Rationale: rationale, Fields: fields,
		Comparable: comparable, Matches: matches, DriftCount: len(drifts),
		CriticalDriftCount: len(criticalDrifts), MatchPct: matchPct,
	}
}

func labels(fs []FieldComparison) string {
	out := make([]string, len(fs))
	for i, f := range fs {
		out[i] = f.Label
	}
	return strings.Join(out, ", ")
}

// ── Numeric (count/money) reconciliation — tolerance-aware ──────────────────

// NumericState classifies one numeric field against a tolerance.
type NumericState string

const (
	NumMatch        NumericState = "match"
	MinorDrift      NumericState = "minor-drift" // within tolerance → counts as agreement
	NumDrift        NumericState = "drift"       // beyond tolerance → a real discrepancy
	NumMissingUp    NumericState = "missing-upstream"
	NumMissingLocal NumericState = "missing-local"
)

// DefaultTolerancePct: count deltas at/under this percentage are "minor", not a discrepancy.
const DefaultTolerancePct = 2.0

// DefaultMoneyTolerancePct: scheme funds reconcile tighter than head-counts.
const DefaultMoneyTolerancePct = 1.0

// NumericComparison is one numeric field; Upstream/Local nil means that side keeps no master.
type NumericComparison struct {
	Field    string
	Label    string
	Upstream *float64
	Local    *float64
	Delta    float64 // local − upstream (0 when a side is missing)
	PctDelta int     // |delta|/upstream as a whole percent
	State    NumericState
	Critical bool
}

// NumericReport is the numeric-reconciliation result.
type NumericReport struct {
	Recommendation     Recommendation
	Rationale          string
	Fields             []NumericComparison
	Comparable         int
	Matches            int
	DriftCount         int
	CriticalDriftCount int
	TolerancePct       float64
}

// ClassifyNumeric grades a numeric field against a tolerance.
func ClassifyNumeric(upstream, local *float64, tolerancePct float64) NumericState {
	switch {
	case upstream == nil && local == nil:
		return NumMatch
	case upstream == nil:
		return NumMissingUp
	case local == nil:
		return NumMissingLocal
	}
	delta := math.Abs(*local - *upstream)
	if delta == 0 {
		return NumMatch
	}
	pct := 100.0
	if *upstream != 0 {
		pct = delta / *upstream * 100
	}
	if pct <= tolerancePct {
		return MinorDrift
	}
	return NumDrift
}

// NumField is raw numeric input; nil pointers denote a missing master on that side.
type NumField struct {
	Field    string
	Label    string
	Upstream *float64
	Local    *float64
	Critical bool
}

// F is a helper to take the address of a float literal.
func F(v float64) *float64 { return &v }

// CompareNumeric classifies each numeric field and builds the report.
func CompareNumeric(rows []NumField, tolerancePct float64) NumericReport {
	fields := make([]NumericComparison, len(rows))
	for i, r := range rows {
		state := ClassifyNumeric(r.Upstream, r.Local, tolerancePct)
		both := r.Upstream != nil && r.Local != nil
		var delta float64
		pct := 0
		if both {
			delta = *r.Local - *r.Upstream
			if *r.Upstream != 0 {
				pct = int(math.Round(math.Abs(delta) / *r.Upstream * 100))
			} else {
				pct = 100
			}
		}
		fields[i] = NumericComparison{
			Field: r.Field, Label: r.Label, Upstream: r.Upstream, Local: r.Local,
			Delta: delta, PctDelta: pct, State: state, Critical: r.Critical,
		}
	}
	return buildNumericReport(fields, tolerancePct)
}

func buildNumericReport(fields []NumericComparison, tolerancePct float64) NumericReport {
	comparable, matches, driftCount := 0, 0, 0
	var realDrifts, criticalDrifts []NumericComparison
	for _, f := range fields {
		present := f.Upstream != nil || f.Local != nil
		if present {
			comparable++
			if f.State == NumMatch || f.State == MinorDrift {
				matches++
			}
		}
		if f.State == NumDrift || f.State == NumMissingUp || f.State == NumMissingLocal {
			driftCount++
		}
		if f.State == NumDrift {
			realDrifts = append(realDrifts, f)
			if f.Critical {
				criticalDrifts = append(criticalDrifts, f)
			}
		}
	}

	var rec Recommendation
	var rationale string
	switch {
	case len(criticalDrifts) > 0:
		rec = Flagged
		rationale = fmt.Sprintf("Count drift beyond %g%% tolerance on %s — investigate the local figure against the state master.", tolerancePct, numLabels(criticalDrifts))
	case len(realDrifts) > 0:
		rec = Review
		rationale = fmt.Sprintf("%d count(s) differ beyond tolerance (%s); reconcile with the state master.", len(realDrifts), numLabels(realDrifts))
	default:
		rec = Reconciled
		if comparable == 0 {
			rationale = "No overlapping counts to compare."
		} else {
			rationale = fmt.Sprintf("Local figures agree with the state master within the %g%% sync tolerance.", tolerancePct)
		}
	}
	return NumericReport{
		Recommendation: rec, Rationale: rationale, Fields: fields,
		Comparable: comparable, Matches: matches, DriftCount: driftCount,
		CriticalDriftCount: len(criticalDrifts), TolerancePct: tolerancePct,
	}
}

func numLabels(fs []NumericComparison) string {
	out := make([]string, len(fs))
	for i, f := range fs {
		out[i] = f.Label
	}
	return strings.Join(out, ", ")
}

// ── Concrete federation comparators ─────────────────────────────────────────

// MapJourneyToStatus maps an APAAR journeyStatus to the local student status.
func MapJourneyToStatus(journey string) string {
	switch norm(journey) {
	case "enrolled":
		return "Enrolled"
	case "transferred":
		return "Transferred"
	case "alumni":
		return "Graduated"
	case "dropout":
		return "Dropped"
	default:
		return ""
	}
}

// ApaarRecord / StudentRecord are the minimal shapes the APAAR comparator needs.
type ApaarRecord struct {
	ApaarID, Name, DateOfBirth, Gender, Category, JourneyStatus string
}
type StudentRecord struct {
	ApaarID, Name, DOB, Gender, Category, Status string
}

// CompareApaarToStudent reconciles an APAAR record (source of truth) against the local student master.
// Identity-critical: APAAR id, name, date of birth.
func CompareApaarToStudent(u ApaarRecord, l StudentRecord) Report {
	return Compare([]Field{
		{Field: "apaarId", Label: "APAAR id", Upstream: u.ApaarID, Local: l.ApaarID, Critical: true},
		{Field: "name", Label: "Name", Upstream: u.Name, Local: l.Name, Critical: true},
		{Field: "dob", Label: "Date of birth", Upstream: u.DateOfBirth, Local: l.DOB, Critical: true},
		{Field: "gender", Label: "Gender", Upstream: u.Gender, Local: l.Gender},
		{Field: "category", Label: "Category", Upstream: u.Category, Local: l.Category},
		{Field: "status", Label: "Journey / status", Upstream: MapJourneyToStatus(u.JourneyStatus), Local: l.Status},
	})
}

// PfmsExpenditure / FundLedger are the minimal shapes the PFMS comparator needs (in paisa/rupees).
type PfmsExpenditure struct{ Allocated, Released, Utilised float64 }
type FundLedger struct{ Allocated, Released, Utilised float64 }

// CompareFundFlowToPfms reconciles PFMS fund-flow figures (source of truth) against the local scheme ledger.
// Every money field is identity-critical; tolerance is tight (drift = potential leakage/mis-posting).
func CompareFundFlowToPfms(p PfmsExpenditure, l *FundLedger) NumericReport {
	var al, rl, ut *float64
	if l != nil {
		al, rl, ut = F(l.Allocated), F(l.Released), F(l.Utilised)
	}
	return CompareNumeric([]NumField{
		{Field: "allocated", Label: "Allocated", Upstream: F(p.Allocated), Local: al, Critical: true},
		{Field: "released", Label: "Released", Upstream: F(p.Released), Local: rl, Critical: true},
		{Field: "utilised", Label: "Utilised", Upstream: F(p.Utilised), Local: ut, Critical: true},
	}, DefaultMoneyTolerancePct)
}
