package integration

import (
	"hash/fnv"
	"sort"
)

// ComplianceSweepReport is the estate-wide compliance roll-up: how many sampled schools have findings, and the
// findings broken down by statute and by district — the directorate's single operating picture.
type ComplianceSweepReport struct {
	SchoolsChecked      int            `json:"schools_checked"`
	SchoolsWithFindings int            `json:"schools_with_findings"`
	TotalFindings       int            `json:"total_findings"`
	ByStatute           map[string]int `json:"by_statute"`
	ByDistrict          map[string]int `json:"by_district"` // schools with >=1 finding, per district
	Synthetic           bool           `json:"synthetic"`   // compliance facts are illustrative (telemetry gated)
}

// syntheticComplianceFacts derives a deterministic compliance fact base for a school. The estate (UDISE/
// district) is real; the compliance facts are SYNTHETIC/illustrative (live inspection data is gated, B-022).
// Most schools are compliant; a deterministic minority carry specific breaches keyed off the UDISE hash.
func syntheticComplianceFacts(udise string) map[string]string {
	h := fnv.New32a()
	_, _ = h.Write([]byte(udise))
	n := h.Sum32()
	yn := func(bad bool) string {
		if bad {
			return "no"
		}
		return "yes"
	}
	return map[string]string{
		"ews_quota_met":       yn(n%7 == 0),  // ~14% breach RTE §12
		"ptr_compliant":       yn(n%11 == 0), // ~9%  breach RTE Schedule
		"accessible_infra":    yn(n%5 == 0),  // ~20% breach RPwD §16
		"consent_recorded":    yn(n%13 == 0), // ~8%  breach DPDP §6
		"child_safety_policy": yn(n%17 == 0), // ~6%  breach POCSO
		"detention_practiced": map[bool]string{true: "yes", false: "no"}[n%19 == 0],
	}
}

// ComplianceSweep runs the Compliance rule base over a deterministic sample of schools spread across the whole
// estate and rolls up the findings by statute and district. Read-only + analytical (no per-school HITL): it is
// the directorate's early-picture of where compliance attention is needed across the State.
func (p *Platform) ComplianceSweep(sample int) ComplianceSweepReport {
	schools := tree().Schools
	rep := ComplianceSweepReport{ByStatute: map[string]int{}, ByDistrict: map[string]int{}, Synthetic: true}
	if sample <= 0 || len(schools) == 0 {
		return rep
	}
	if sample > len(schools) {
		sample = len(schools)
	}
	step := len(schools) / sample
	if step < 1 {
		step = 1
	}
	for i := 0; i < sample; i++ {
		sc := schools[(i*step)%len(schools)]
		findings := deriveComplianceFindings(syntheticComplianceFacts(sc.UDISE))
		rep.SchoolsChecked++
		if len(findings) == 0 {
			continue
		}
		rep.SchoolsWithFindings++
		rep.TotalFindings += len(findings)
		rep.ByDistrict[sc.District]++
		for _, f := range findings {
			rep.ByStatute[f.Statute]++
		}
	}
	return rep
}

// TopComplianceDistricts returns the districts with the most schools carrying findings (descending), capped.
func (r ComplianceSweepReport) TopComplianceDistricts(limit int) []string {
	type kv struct {
		d string
		n int
	}
	var xs []kv
	for d, n := range r.ByDistrict {
		xs = append(xs, kv{d, n})
	}
	sort.Slice(xs, func(i, j int) bool {
		if xs[i].n != xs[j].n {
			return xs[i].n > xs[j].n
		}
		return xs[i].d < xs[j].d
	})
	var out []string
	for i, x := range xs {
		if limit > 0 && i >= limit {
			break
		}
		out = append(out, x.d)
	}
	return out
}
