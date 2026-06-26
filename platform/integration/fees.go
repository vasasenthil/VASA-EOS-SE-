package integration

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/fees"
)

// Fee & Finance Ledger is an L6 money-grade vertical: it raises fee demands against students and records the
// payments collected, enforcing that every amount is in paise and that a payment can never overpay a demand.
// Durable to PostgreSQL.
var (
	feesOnce sync.Once
	feesBack feesStore
)

// feesStore is the persistence port (demands + payments).
type feesStore interface {
	RaiseDemand(fees.Demand) (fees.Demand, error)
	GetDemand(id string) (fees.Demand, bool)
	RecordPayment(fees.Payment) (fees.Payment, error)
	WaiveDemand(id string) (fees.Demand, error)
	Outstanding(id string) int64
	ListDemands(fees.DemandFilter) []fees.Demand
	ListPayments(fees.PaymentFilter) []fees.Payment
}

func feesState() feesStore {
	feesOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgFeesStore(dsn); err == nil {
				feesBack = pg
				log.Printf("fees: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("fees: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				feesBack = fees.NewStore()
			}
		} else {
			feesBack = fees.NewStore()
		}
		seedFees(feesBack)
	})
	return feesBack
}

// seedFees plants a small fee ledger at a real Chennai school: exam-fee demands across a synthetic cohort, most
// part- or fully-paid, a couple still outstanding (past due) and one waived as a concession — enough signal for
// the collection + defaulter analytics. Money in paise; synthetic SYN-S student ids, never real PII.
func seedFees(s feesStore) {
	// Raise the fee demands across several schools over more than one district so the collection / defaulter
	// roll-up aggregates the whole estate (bottom-up) while each school scopes to its own demands (top-down).
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	// six exam-fee demands of Rs 250.00 (25000 paise) each, due 1 June 2026.
	type plan struct {
		student string
		paid    int64 // paise already collected
		waive   bool
	}
	plans := []plan{
		{"SYN-S-001", 25000, false}, // fully paid
		{"SYN-S-002", 25000, false}, // fully paid
		{"SYN-S-003", 10000, false}, // partial
		{"SYN-S-004", 0, false},     // unpaid (defaulter)
		{"SYN-S-005", 0, false},     // unpaid (defaulter)
		{"SYN-S-006", 0, true},      // waived concession
	}
	for si, school := range schools {
		for i, pl := range plans {
			student := pl.student
			if si > 0 {
				student = fmt.Sprintf("%s-S%d", student, si)
			}
			id := fmt.Sprintf("FEE-EXAM-%d-%03d", si, i+1)
			s.RaiseDemand(fees.Demand{
				ID: id, OrgUnit: school, StudentID: student, Category: "exam", Term: "2026-T1",
				AmountPaise: 25000, Status: fees.Pending, DueOn: "2026-06-01",
			})
			if pl.waive {
				s.WaiveDemand(id)
				continue
			}
			if pl.paid > 0 {
				s.RecordPayment(fees.Payment{
					ID: id + "-PAY-1", DemandID: id, OrgUnit: school, StudentID: student,
					AmountPaise: pl.paid, Mode: fees.UPI, Reference: "UPI-" + id, PaidOn: "2026-05-28",
				})
			}
		}
	}
}

// RaiseFeeDemand raises a fee demand against a student. Audited.
func (p *Platform) RaiseFeeDemand(d fees.Demand) (fees.Demand, error) {
	out, err := feesState().RaiseDemand(d)
	if err != nil {
		p.appendAudit("fee-clerk", "fees.demand.denied", d.ID, "deny", err.Error())
		return fees.Demand{}, err
	}
	p.appendAudit("fee-clerk", "fees.demand", d.ID, out.Status, fmt.Sprintf("%s %dp due %s", d.Category, d.AmountPaise, d.DueOn))
	return out, nil
}

// CollectFeePayment records a payment against a demand (rejecting an overpayment). Audited.
func (p *Platform) CollectFeePayment(pay fees.Payment) (fees.Payment, error) {
	out, err := feesState().RecordPayment(pay)
	if err != nil {
		p.appendAudit("fee-clerk", "fees.payment.denied", pay.DemandID, "deny", err.Error())
		return fees.Payment{}, err
	}
	p.appendAudit("fee-clerk", "fees.payment", pay.ID, "executed", fmt.Sprintf("%dp via %s ref %s", pay.AmountPaise, pay.Mode, pay.Reference))
	return out, nil
}

// WaiveFeeDemand grants a concession on an open demand. Audited.
func (p *Platform) WaiveFeeDemand(id string) (fees.Demand, error) {
	out, err := feesState().WaiveDemand(id)
	if err != nil {
		p.appendAudit("fee-clerk", "fees.waive.denied", id, "deny", err.Error())
		return fees.Demand{}, err
	}
	p.appendAudit("fee-clerk", "fees.waive", id, "executed", "concession granted")
	return out, nil
}

// StudentFeeLedger returns a student's demands and the payments collected.
func (p *Platform) StudentFeeLedger(org, student string) ([]fees.Demand, []fees.Payment) {
	return feesState().ListDemands(fees.DemandFilter{OrgUnit: org, Student: student}),
		feesState().ListPayments(fees.PaymentFilter{OrgUnit: org, Student: student})
}

// FeeDefaulter is one outstanding demand past its due date in the dashboard.
type FeeDefaulter struct {
	DemandID     string `json:"demand_id"`
	StudentID    string `json:"student_id"`
	Category     string `json:"category"`
	OutstandingP int64  `json:"outstanding_paise"`
	DueOn        string `json:"due_on"`
}

// FeeDashboard is the jurisdiction-scoped collection picture: total demanded vs collected vs outstanding (all in
// paise), the demand-status breakdown, and the defaulter roster (open demands past due). Downward-governance
// scoped.
type FeeDashboard struct {
	Scope         string         `json:"scope"`
	AsOf          string         `json:"as_of"`
	Demands       int            `json:"demands"`
	DemandedP     int64          `json:"demanded_paise"`
	CollectedP    int64          `json:"collected_paise"`
	OutstandingP  int64          `json:"outstanding_paise"`
	WaivedP       int64          `json:"waived_paise"`
	CollectionPct float64        `json:"collection_pct"`
	ByStatus      map[string]int `json:"by_status"`
	Defaulters    []FeeDefaulter `json:"defaulters,omitempty"`
	Synthetic     bool           `json:"synthetic"`
}

// FeeDashboard rolls up fee collection for the schools a tenant node governs, as of today.
func (p *Platform) FeeDashboard(scopeOrg string) FeeDashboard {
	asOf := todayISO()
	d := FeeDashboard{Scope: scopeOrg, AsOf: asOf, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	payments := feesState().ListPayments(fees.PaymentFilter{})
	for _, dem := range feesState().ListDemands(fees.DemandFilter{}) {
		if !h.Governs(scopeOrg, dem.OrgUnit) {
			continue
		}
		d.Demands++
		d.ByStatus[dem.Status]++
		paid := fees.PaidSoFar(payments, dem.ID, "")
		switch dem.Status {
		case fees.Waived, fees.Cancelled:
			d.WaivedP += dem.AmountPaise
		default:
			d.DemandedP += dem.AmountPaise
			d.CollectedP += paid
			outstanding := dem.AmountPaise - paid
			if dem.Open() && outstanding > 0 {
				d.OutstandingP += outstanding
				if dem.DueOn < asOf {
					d.Defaulters = append(d.Defaulters, FeeDefaulter{
						DemandID: dem.ID, StudentID: dem.StudentID, Category: dem.Category,
						OutstandingP: outstanding, DueOn: dem.DueOn,
					})
				}
			}
		}
	}
	if d.DemandedP > 0 {
		d.CollectionPct = float64(d.CollectedP) * 100 / float64(d.DemandedP)
	}
	return d
}
