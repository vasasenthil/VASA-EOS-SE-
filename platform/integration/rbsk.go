package integration

import (
	"fmt"
	"hash/fnv"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/rbsk"
)

// RBSK (child-health screening) is an L12 welfare vertical: students are screened for the four Ds, any finding
// is auto-referred to the DEIC, and the referral is tracked to closure. Durable to PostgreSQL. Health findings
// are sensitive — the scoped dashboard surfaces aggregate counts; individual findings are visible only to the
// governing officer (downward governance). Synthetic data only.
var (
	rbskOnce sync.Once
	rbskBack rbskStore
)

// rbskStore is the persistence port.
type rbskStore interface {
	File(id, studentID, orgUnit, screenedOn string, findings []string) (rbsk.Screening, error)
	Get(id string) (rbsk.Screening, bool)
	Treat(id string) (rbsk.Screening, error)
	Close(id, outcome string) (rbsk.Screening, error)
	List(rbsk.Filter) []rbsk.Screening
}

func rbskState() rbskStore {
	rbskOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgRbskStore(dsn); err == nil {
				rbskBack = pg
				log.Printf("rbsk: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("rbsk: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				rbskBack = rbsk.NewStore()
			}
		} else {
			rbskBack = rbsk.NewStore()
		}
		seedRBSK(rbskBack)
	})
	return rbskBack
}

// seedRBSK plants a synthetic screening camp for a Chennai school cohort: most healthy, a few with findings
// auto-referred to the DEIC (so the referral analytics have signal). Synthetic SYN-STU ids only.
func seedRBSK(s rbskStore) {
	school := tenancyLeafUnder("TN-DIST-Chennai")
	if school == "" {
		return
	}
	ds := []string{rbsk.Defect, rbsk.Disease, rbsk.Deficiency, rbsk.Disability}
	for n := 0; n < 20; n++ {
		student := fmt.Sprintf("SYN-STU-%02d", n+1)
		h := fnv.New32a()
		h.Write([]byte(student))
		var findings []string
		if r := h.Sum32() % 100; r < 18 { // ~18% have a finding
			findings = []string{ds[int(r)%len(ds)]}
		}
		s.File("RBSK-"+student, student, school, "2026-06-05", findings)
	}
}

// RecordScreening files a new RBSK screening (auto-referring any finding). Audited.
func (p *Platform) RecordScreening(id, studentID, orgUnit, screenedOn string, findings []string) (rbsk.Screening, error) {
	sc, err := rbskState().File(id, studentID, orgUnit, screenedOn, findings)
	if err != nil {
		return rbsk.Screening{}, err
	}
	p.appendAudit("screener:rbsk", "rbsk.screen", studentID, sc.Status, fmt.Sprintf("%d finding(s)", len(findings)))
	return sc, nil
}

// AdvanceReferral moves a referral along the pipeline: action "treat" or "close". Audited.
func (p *Platform) AdvanceReferral(id, action, outcome string) (rbsk.Screening, error) {
	var out rbsk.Screening
	var err error
	switch action {
	case "treat":
		out, err = rbskState().Treat(id)
	case "close":
		out, err = rbskState().Close(id, outcome)
	default:
		return rbsk.Screening{}, fmt.Errorf("rbsk: action must be treat or close")
	}
	if err != nil {
		return rbsk.Screening{}, err
	}
	p.appendAudit("deic", "rbsk."+action, id, out.Status, outcome)
	return out, nil
}

// RBSKScreening returns one screening.
func (p *Platform) RBSKScreening(id string) (rbsk.Screening, bool) { return rbskState().Get(id) }

// RBSKDashboard is the jurisdiction-scoped child-health operating picture: screened coverage, findings by the
// four Ds, active referrals and the referral closure rate. Downward-governance scoped.
type RBSKDashboard struct {
	Scope           string         `json:"scope"`
	Screened        int            `json:"screened"`
	Healthy         int            `json:"healthy"`
	WithFindings    int            `json:"with_findings"`
	ByFinding       map[string]int `json:"by_finding"`
	ActiveReferrals int            `json:"active_referrals"`
	Closed          int            `json:"closed"`
	ClosureRate     float64        `json:"referral_closure_rate"`
	Synthetic       bool           `json:"synthetic"`
}

// RBSKDashboard rolls up child-health screening for the schools a tenant node governs.
func (p *Platform) RBSKDashboard(scopeOrg string) RBSKDashboard {
	d := RBSKDashboard{Scope: scopeOrg, ByFinding: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	referred := 0
	for _, sc := range rbskState().List(rbsk.Filter{}) {
		if !h.Governs(scopeOrg, sc.OrgUnit) {
			continue
		}
		d.Screened++
		if sc.Status == rbsk.Healthy {
			d.Healthy++
			continue
		}
		d.WithFindings++
		referred++
		for _, f := range sc.Findings {
			d.ByFinding[f]++
		}
		if sc.ActiveReferral() {
			d.ActiveReferrals++
		}
		if sc.Status == rbsk.Closed {
			d.Closed++
		}
	}
	if referred > 0 {
		d.ClosureRate = float64(d.Closed) * 100 / float64(referred)
	}
	return d
}

// RBSKReferralsScopedBy returns the active referrals a tenant node governs (the follow-up worklist).
func (p *Platform) RBSKReferralsScopedBy(scopeOrg string) []rbsk.Screening {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []rbsk.Screening
	for _, sc := range rbskState().List(rbsk.Filter{}) {
		if sc.ActiveReferral() && h.Governs(scopeOrg, sc.OrgUnit) {
			out = append(out, sc)
		}
	}
	return out
}
