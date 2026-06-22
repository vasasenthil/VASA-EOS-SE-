package integration

import (
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/scholarship"
)

// Scholarship/DBT is an L6 financial vertical: a scholarship is sanctioned through an amount-driven multi-level
// fund-approval chain (PFMS/GFR — larger amounts rise to higher authority), disbursed with a payment reference,
// then reconciled against the rail (unmatched = a leakage signal). Durable to PostgreSQL.
var (
	schoOnce sync.Once
	schoBack schoStore
)

// schoStore is the persistence port.
type schoStore interface {
	File(id, studentID, scheme string, amountPaise int64, orgUnit string) (scholarship.Disbursement, error)
	Get(id string) (scholarship.Disbursement, bool)
	Decide(id string, approve bool, actorRole, actorID, note string) (scholarship.Disbursement, error)
	Disburse(id, paymentRef string) (scholarship.Disbursement, error)
	Reconcile(id string, matched bool) (scholarship.Disbursement, error)
	List(scholarship.Filter) []scholarship.Disbursement
}

func schoState() schoStore {
	schoOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgSchoStore(dsn); err == nil {
				schoBack = pg
				log.Printf("scholarship: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("scholarship: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				schoBack = scholarship.NewStore()
			}
		} else {
			schoBack = scholarship.NewStore()
		}
	})
	return schoBack
}

// FileScholarship lodges a new scholarship/DBT disbursement (pending sanction). Audited.
func (p *Platform) FileScholarship(id, studentID, scheme string, amountPaise int64, orgUnit string) (scholarship.Disbursement, error) {
	d, err := schoState().File(id, studentID, scheme, amountPaise, orgUnit)
	if err != nil {
		return scholarship.Disbursement{}, err
	}
	p.appendAudit("student:"+studentID, "scholarship.file", id, "executed", scheme)
	return d, nil
}

// SanctionScholarship applies a sanctioning officer's decision at the current fund-approval tier (multi-level,
// fail-closed). This is the high-stakes PFMS/GFR fund-release control. Audited.
func (p *Platform) SanctionScholarship(id string, approve bool, actorRole, actorID, note string) (scholarship.Disbursement, error) {
	out, err := schoState().Decide(id, approve, actorRole, actorID, note)
	effect := "approved"
	if !approve {
		effect = "rejected"
	}
	if err != nil {
		p.appendAudit("role:"+actorRole, "scholarship.sanction.denied", id, "deny", err.Error())
		return scholarship.Disbursement{}, err
	}
	p.appendAudit("role:"+actorRole, "scholarship.sanction", id, effect, "status="+out.Status)
	return out, nil
}

// DisburseScholarship pays out a sanctioned disbursement with its payment reference. Audited.
func (p *Platform) DisburseScholarship(id, paymentRef string) (scholarship.Disbursement, error) {
	out, err := schoState().Disburse(id, paymentRef)
	if err != nil {
		return scholarship.Disbursement{}, err
	}
	p.appendAudit("system:pfms", "scholarship.disburse", id, "executed", paymentRef)
	return out, nil
}

// ReconcileScholarship reconciles a disbursed case against the payment rail (matched → reconciled; unmatched →
// flagged for leakage investigation). Audited.
func (p *Platform) ReconcileScholarship(id string, matched bool) (scholarship.Disbursement, error) {
	out, err := schoState().Reconcile(id, matched)
	if err != nil {
		return scholarship.Disbursement{}, err
	}
	effect := "reconciled"
	if !matched {
		effect = "flagged"
	}
	p.appendAudit("system:pfms", "scholarship.reconcile", id, effect, "status="+out.Status)
	return out, nil
}

// ScholarshipCase returns one disbursement.
func (p *Platform) ScholarshipCase(id string) (scholarship.Disbursement, bool) {
	return schoState().Get(id)
}

// ScholarshipDashboard is the jurisdiction-scoped DBT operating picture: counts by status/scheme, the pending
// sanction backlog, total amount disbursed, and the leakage (flagged) count. Downward-governance scoped.
type ScholarshipDashboard struct {
	Scope           string                     `json:"scope"`
	Total           int                        `json:"total"`
	ByStatus        map[string]int             `json:"by_status"`
	ByScheme        map[string]int             `json:"by_scheme"`
	PendingSanction int                        `json:"pending_sanction"`
	DisbursedRupees int64                      `json:"disbursed_rupees"`
	FlaggedLeakage  int                        `json:"flagged_leakage"`
	Pending         []scholarship.Disbursement `json:"pending,omitempty"`
	Synthetic       bool                       `json:"synthetic"`
}

// ScholarshipDashboard rolls up the disbursements a tenant node governs.
func (p *Platform) ScholarshipDashboard(scopeOrg string) ScholarshipDashboard {
	d := ScholarshipDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, ByScheme: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, x := range schoState().List(scholarship.Filter{}) {
		if !h.Governs(scopeOrg, x.OrgUnit) {
			continue
		}
		d.Total++
		d.ByStatus[x.Status]++
		d.ByScheme[x.Scheme]++
		switch x.Status {
		case scholarship.Pending:
			d.PendingSanction++
			d.Pending = append(d.Pending, x)
		case scholarship.Disbursed, scholarship.Reconciled:
			d.DisbursedRupees += x.Rupees()
		case scholarship.Flagged:
			d.DisbursedRupees += x.Rupees()
			d.FlaggedLeakage++
		}
	}
	return d
}

// ScholarshipScopedBy returns the disbursements a tenant node governs, filtered by status.
func (p *Platform) ScholarshipScopedBy(scopeOrg, status string) []scholarship.Disbursement {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []scholarship.Disbursement
	for _, x := range schoState().List(scholarship.Filter{Status: status}) {
		if h.Governs(scopeOrg, x.OrgUnit) {
			out = append(out, x)
		}
	}
	return out
}
