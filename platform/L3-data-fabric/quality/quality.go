// Package quality implements the DAT-TN-001 §F data-governance framework: the data-steward register (§F.1),
// the data-quality SLAs (§F.2), and a Great-Expectations-style data-quality checker (§F.4) —
// completeness · uniqueness · referential-integrity · freshness · value-distribution — whose failing rows are
// routed to a quarantine bucket and whose breaches alert the domain steward + Compliance Lead.
// Deterministic + stdlib-only.
package quality

import (
	"fmt"
	"sort"
	"time"
)

// ── §F.1 · data stewards ──

// Steward is the accountable owner of a data domain.
type Steward struct {
	Domain string
	Name   string
}

// Stewards is the §F.1 steward register.
var Stewards = []Steward{
	{"geography+school", "DSE Programme Director + UDISE+ Nodal Officer"},
	{"curriculum+textbook", "SCERT Director"},
	{"scheme-catalogue", "Respective directorate; PMU coordinates"},
	{"identity", "APAAR Nodal + HRMS-TN + Secretariat"},
	{"attendance+marks", "DSE / DGE / DPSE per stage"},
	{"scheme-deliveries", "PFMS Nodal + Finance Lead"},
	{"knowledge-graph+ai-corpus", "Chief AI Architect (G5) + G6 Ethics Chair"},
	{"audit+governance-log", "G7 External Audit + CAG liaison"},
}

// slaDomainAlias maps an SLA domain (§F.2) to its steward-register domain (§F.1) where they differ.
var slaDomainAlias = map[string]string{
	"master":     "geography+school",
	"attendance": "attendance+marks",
	"marks":      "attendance+marks",
	"audit":      "audit+governance-log",
	"model_card": "knowledge-graph+ai-corpus",
}

// StewardFor returns the steward accountable for a domain (resolving SLA-domain aliases to §F.1 stewards).
func StewardFor(domain string) (Steward, bool) {
	if alias, ok := slaDomainAlias[domain]; ok {
		domain = alias
	}
	for _, s := range Stewards {
		if s.Domain == domain {
			return s, true
		}
	}
	return Steward{}, false
}

// ── §F.2 · data-quality SLAs ──

// Comparator is the SLA direction.
type Comparator string

const (
	GTE Comparator = ">=" // measured must be at least the threshold
	LTE Comparator = "<=" // measured must be at most the threshold
	EQ  Comparator = "==" // measured must equal the threshold
)

// SLA is a measurable data-quality objective for a domain metric.
type SLA struct {
	Domain    string
	Metric    string
	Threshold float64
	Cmp       Comparator
	Window    string
}

// SLAs is the §F.2 SLA register.
var SLAs = []SLA{
	{"master", "completeness", 0.999, GTE, "24h reconciliation vs UDISE+"},
	{"identity", "duplicate_rate", 0.0001, LTE, "rolling"},
	{"identity", "apaar_coverage", 0.99, GTE, "of enrolled cohort"},
	{"attendance", "daily_completeness", 0.95, GTE, "daily"},
	{"marks", "window_completeness", 0.99, GTE, "per assessment window"},
	{"audit", "integrity", 1.0, EQ, "100% zero gaps; Merkle-verified daily"},
	{"model_card", "coverage", 1.0, EQ, "no model in production without a signed card"},
}

// Met reports whether a measured value satisfies the SLA.
func (s SLA) Met(measured float64) bool {
	switch s.Cmp {
	case GTE:
		return measured >= s.Threshold
	case LTE:
		return measured <= s.Threshold
	case EQ:
		return measured == s.Threshold
	}
	return false
}

// EvaluateSLA grades a measured metric against the domain SLA.
func EvaluateSLA(domain, metric string, measured float64) (sla SLA, met, found bool) {
	for _, s := range SLAs {
		if s.Domain == domain && s.Metric == metric {
			return s, s.Met(measured), true
		}
	}
	return SLA{}, false, false
}

// ── §F.4 · data-quality checks ──

// Dataset is a tabular dataset under check.
type Dataset struct {
	Name string
	Rows []map[string]any
}

// CheckResult is one check's outcome; BadRows are the offending row indices.
type CheckResult struct {
	Name    string
	Passed  bool
	Detail  string
	BadRows map[int]bool
}

// Check is a data-quality expectation evaluated over a dataset.
type Check func(Dataset) CheckResult

func str(v any) string {
	if v == nil {
		return ""
	}
	return fmt.Sprintf("%v", v)
}

// Completeness checks that the required fields are present and non-empty in every row.
func Completeness(required ...string) Check {
	return func(ds Dataset) CheckResult {
		bad := map[int]bool{}
		for i, row := range ds.Rows {
			for _, f := range required {
				if str(row[f]) == "" {
					bad[i] = true
				}
			}
		}
		return CheckResult{Name: "completeness", Passed: len(bad) == 0, BadRows: bad,
			Detail: fmt.Sprintf("%d/%d rows complete", len(ds.Rows)-len(bad), len(ds.Rows))}
	}
}

// Unique checks that keyField has no duplicate values.
func Unique(keyField string) Check {
	return func(ds Dataset) CheckResult {
		seen := map[string]int{}
		bad := map[int]bool{}
		for i, row := range ds.Rows {
			k := str(row[keyField])
			if prev, dup := seen[k]; dup {
				bad[i] = true
				bad[prev] = true
			} else {
				seen[k] = i
			}
		}
		return CheckResult{Name: "uniqueness", Passed: len(bad) == 0, BadRows: bad,
			Detail: fmt.Sprintf("%d duplicate rows on %q", len(bad), keyField)}
	}
}

// ReferentialIntegrity checks that field's value exists in the valid reference set.
func ReferentialIntegrity(field string, valid map[string]bool) Check {
	return func(ds Dataset) CheckResult {
		bad := map[int]bool{}
		for i, row := range ds.Rows {
			if !valid[str(row[field])] {
				bad[i] = true
			}
		}
		return CheckResult{Name: "referential-integrity", Passed: len(bad) == 0, BadRows: bad,
			Detail: fmt.Sprintf("%d rows reference an unknown %q", len(bad), field)}
	}
}

// ValueIn checks that field is one of the allowed values.
func ValueIn(field string, allowed ...string) Check {
	set := map[string]bool{}
	for _, a := range allowed {
		set[a] = true
	}
	return func(ds Dataset) CheckResult {
		bad := map[int]bool{}
		for i, row := range ds.Rows {
			if !set[str(row[field])] {
				bad[i] = true
			}
		}
		return CheckResult{Name: "value-distribution", Passed: len(bad) == 0, BadRows: bad,
			Detail: fmt.Sprintf("%d rows have an out-of-domain %q", len(bad), field)}
	}
}

// Freshness checks that tsField (RFC3339) is within maxAge of now.
func Freshness(tsField string, maxAge time.Duration, now time.Time) Check {
	return func(ds Dataset) CheckResult {
		bad := map[int]bool{}
		for i, row := range ds.Rows {
			t, err := time.Parse(time.RFC3339, str(row[tsField]))
			if err != nil || now.Sub(t) > maxAge {
				bad[i] = true
			}
		}
		return CheckResult{Name: "freshness", Passed: len(bad) == 0, BadRows: bad,
			Detail: fmt.Sprintf("%d stale rows (> %s old)", len(bad), maxAge)}
	}
}

// ── report + quarantine bucket (§F.4) ──

// Report is the outcome of running the checks; failing rows are routed to the quarantine bucket.
type Report struct {
	Dataset         string
	Checks          []CheckResult
	Quarantined     []int // sorted unique offending row indices (the quarantine bucket)
	Passed          bool
	CompletenessPct float64
}

// Run executes the checks and collects the failing rows into the quarantine bucket.
func Run(ds Dataset, checks ...Check) Report {
	rep := Report{Dataset: ds.Name, Passed: true}
	quar := map[int]bool{}
	for _, c := range checks {
		r := c(ds)
		rep.Checks = append(rep.Checks, r)
		if !r.Passed {
			rep.Passed = false
		}
		for i := range r.BadRows {
			quar[i] = true
		}
	}
	for i := range quar {
		rep.Quarantined = append(rep.Quarantined, i)
	}
	sort.Ints(rep.Quarantined)
	if n := len(ds.Rows); n > 0 {
		rep.CompletenessPct = float64(n-len(rep.Quarantined)) / float64(n)
	} else {
		rep.CompletenessPct = 1
	}
	return rep
}
