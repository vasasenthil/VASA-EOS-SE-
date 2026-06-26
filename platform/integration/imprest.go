package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Petty Cash / Imprest is an L6 finance vertical under GFR (General Financial Rules): a school holds a sanctioned
// cash float (the imprest), spends it on small contingent expenses via vouchers, and is reimbursed
// (replenished) up to the float — and the book can only be settled when every rupee is accounted for. Money in
// paise. It is durable, audited, and enforces three hard invariants server-side:
//   - NO OVERSPEND: a voucher can never exceed the cash on hand (cash never goes negative).
//   - IMPREST CEILING: a replenishment can never push cash above the sanctioned float (you reimburse only what was
//     spent, never inflate the float).
//   - SETTLEMENT (RECONCILIATION) GATE: a book can be settled only when cash on hand equals the sanctioned float —
//     i.e. all spend has been reimbursed and the float is whole; you cannot close with unreimbursed spend.
// Vouchers are embedded on the book (like hostel residents). Downward-governance scoped. Synthetic SYN- ids only,
// never real PII.

// Book status.
const (
	ImprestOpen    = "open"
	ImprestSettled = "settled"
)

// Voucher is one contingent-expense entry drawn against the imprest.
type Voucher struct {
	ID          string `json:"id"`
	Payee       string `json:"payee"`
	Purpose     string `json:"purpose"`
	AmountPaise int64  `json:"amount_paise"`
	RecordedOn  string `json:"recorded_on"`
}

// ImprestBook is one school's petty-cash float with its vouchers and current cash position.
type ImprestBook struct {
	ID              string    `json:"id"`
	OrgUnit         string    `json:"org_unit"`
	SanctionedPaise int64     `json:"sanctioned_paise"`
	CashPaise       int64     `json:"cash_paise"`
	Vouchers        []Voucher `json:"vouchers,omitempty"`
	Status          string    `json:"status"`
	CreatedOn       string    `json:"created_on"`
	UpdatedAt       string    `json:"updated_at"`
}

// SpentPaise is the cumulative value of all vouchers booked against this imprest.
func (b ImprestBook) SpentPaise() int64 {
	var s int64
	for _, v := range b.Vouchers {
		s += v.AmountPaise
	}
	return s
}

// UnreimbursedPaise is the outstanding spend not yet replenished (sanctioned − cash).
func (b ImprestBook) UnreimbursedPaise() int64 { return b.SanctionedPaise - b.CashPaise }

// Validate checks a book's required fields.
func (b ImprestBook) Validate() error {
	if b.ID == "" || b.OrgUnit == "" {
		return errors.New("imprest: id and org_unit are required")
	}
	if b.SanctionedPaise < 1 {
		return errors.New("imprest: sanctioned_paise must be positive")
	}
	return nil
}

// applySpend books a voucher — rejecting an overspend beyond the cash on hand (no negative cash).
func applySpend(b ImprestBook, v Voucher, now string) (ImprestBook, error) {
	if b.Status != ImprestOpen {
		return ImprestBook{}, fmt.Errorf("imprest: %s is settled — cannot spend", b.ID)
	}
	if v.Payee == "" || v.Purpose == "" {
		return ImprestBook{}, errors.New("imprest: a voucher needs a payee and a purpose")
	}
	if v.AmountPaise <= 0 {
		return ImprestBook{}, errors.New("imprest: voucher amount must be positive")
	}
	if v.AmountPaise > b.CashPaise {
		return ImprestBook{}, fmt.Errorf("imprest: voucher %d exceeds cash on hand %d (no negative cash)", v.AmountPaise, b.CashPaise)
	}
	v.RecordedOn = "2026-06-25"
	b.Vouchers = append(b.Vouchers, v)
	b.CashPaise -= v.AmountPaise
	b.UpdatedAt = now
	return b, nil
}

// applyReplenish reimburses spent cash — rejecting any top-up beyond the sanctioned float.
func applyReplenish(b ImprestBook, amountPaise int64, now string) (ImprestBook, error) {
	if b.Status != ImprestOpen {
		return ImprestBook{}, fmt.Errorf("imprest: %s is settled — cannot replenish", b.ID)
	}
	if amountPaise <= 0 {
		return ImprestBook{}, errors.New("imprest: replenishment must be positive")
	}
	if b.CashPaise+amountPaise > b.SanctionedPaise {
		return ImprestBook{}, fmt.Errorf("imprest: replenishing %d on top of %d would exceed the sanctioned float %d (imprest ceiling)", amountPaise, b.CashPaise, b.SanctionedPaise)
	}
	b.CashPaise += amountPaise
	b.UpdatedAt = now
	return b, nil
}

// applySettle settles the book — rejected unless cash on hand equals the sanctioned float (book balances).
func applySettle(b ImprestBook, now string) (ImprestBook, error) {
	if b.Status != ImprestOpen {
		return ImprestBook{}, fmt.Errorf("imprest: %s is already settled", b.ID)
	}
	if b.CashPaise != b.SanctionedPaise {
		return ImprestBook{}, fmt.Errorf("imprest: cannot settle %s — cash %d does not equal sanctioned float %d (%d unreimbursed)", b.ID, b.CashPaise, b.SanctionedPaise, b.UnreimbursedPaise())
	}
	b.Status = ImprestSettled
	b.UpdatedAt = now
	return b, nil
}

type imprestFilter struct{ OrgUnit, Status string }

func matchImprest(f imprestFilter, b ImprestBook) bool {
	if f.OrgUnit != "" && b.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && b.Status != f.Status {
		return false
	}
	return true
}

// imprestStore is the persistence port. *memImprestStore and *pgImprestStore satisfy it.
type imprestStore interface {
	Upsert(ImprestBook) (ImprestBook, error)
	Get(id string) (ImprestBook, bool)
	List(imprestFilter) []ImprestBook
}

type memImprestStore struct {
	mu sync.Mutex
	m  map[string]ImprestBook
}

func newMemImprestStore() *memImprestStore { return &memImprestStore{m: map[string]ImprestBook{}} }

func (s *memImprestStore) Upsert(b ImprestBook) (ImprestBook, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[b.ID] = b
	return b, nil
}

func (s *memImprestStore) Get(id string) (ImprestBook, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.m[id]
	return b, ok
}

func (s *memImprestStore) List(f imprestFilter) []ImprestBook {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]ImprestBook, 0, len(s.m))
	for _, b := range s.m {
		if matchImprest(f, b) {
			out = append(out, b)
		}
	}
	return out
}

var (
	imprestOnce sync.Once
	imprestBack imprestStore
)

func imprestState() imprestStore {
	imprestOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgImprestStore(dsn); err == nil {
				imprestBack = pg
				log.Printf("imprest: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("imprest: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				imprestBack = newMemImprestStore()
			}
		} else {
			imprestBack = newMemImprestStore()
		}
		seedImprest(imprestBack)
	})
	return imprestBack
}

func imprestNow() string { return "2026-06-25T00:00:00Z" }

// OpenImprest records a new imprest book (cash == sanctioned float, status open). Audited.
func (p *Platform) OpenImprest(b ImprestBook) (ImprestBook, error) {
	b.Status = ImprestOpen
	b.Vouchers = nil
	b.CashPaise = b.SanctionedPaise
	if b.CreatedOn == "" {
		b.CreatedOn = "2026-06-25"
	}
	b.UpdatedAt = imprestNow()
	if err := b.Validate(); err != nil {
		p.appendAudit("ddo", "imprest.open.denied", b.OrgUnit, "deny", err.Error())
		return ImprestBook{}, err
	}
	out, err := imprestState().Upsert(b)
	if err != nil {
		return ImprestBook{}, err
	}
	p.appendAudit("ddo", "imprest.open", b.ID, "executed", fmt.Sprintf("float %d", b.SanctionedPaise))
	return out, nil
}

// SpendImprest books a voucher — rejecting an overspend. Audited.
func (p *Platform) SpendImprest(id string, v Voucher) (ImprestBook, error) {
	cur, ok := imprestState().Get(id)
	if !ok {
		return ImprestBook{}, errors.New("imprest: not found")
	}
	out, err := applySpend(cur, v, imprestNow())
	if err != nil {
		p.appendAudit("ddo", "imprest.spend.denied", id, "deny", err.Error())
		return ImprestBook{}, err
	}
	if _, err := imprestState().Upsert(out); err != nil {
		return ImprestBook{}, err
	}
	p.appendAudit("ddo", "imprest.spend", id, "executed", fmt.Sprintf("%s %d → cash %d", v.Payee, v.AmountPaise, out.CashPaise))
	return out, nil
}

// ReplenishImprest reimburses spent cash — rejecting a top-up beyond the float. Audited.
func (p *Platform) ReplenishImprest(id string, amountPaise int64) (ImprestBook, error) {
	cur, ok := imprestState().Get(id)
	if !ok {
		return ImprestBook{}, errors.New("imprest: not found")
	}
	out, err := applyReplenish(cur, amountPaise, imprestNow())
	if err != nil {
		p.appendAudit("ddo", "imprest.replenish.denied", id, "deny", err.Error())
		return ImprestBook{}, err
	}
	if _, err := imprestState().Upsert(out); err != nil {
		return ImprestBook{}, err
	}
	p.appendAudit("ddo", "imprest.replenish", id, "executed", fmt.Sprintf("+%d → cash %d", amountPaise, out.CashPaise))
	return out, nil
}

// SettleImprest settles a balanced book — rejecting settlement with unreimbursed spend. Audited.
func (p *Platform) SettleImprest(id string) (ImprestBook, error) {
	cur, ok := imprestState().Get(id)
	if !ok {
		return ImprestBook{}, errors.New("imprest: not found")
	}
	out, err := applySettle(cur, imprestNow())
	if err != nil {
		p.appendAudit("ddo", "imprest.settle.denied", id, "deny", err.Error())
		return ImprestBook{}, err
	}
	if _, err := imprestState().Upsert(out); err != nil {
		return ImprestBook{}, err
	}
	p.appendAudit("ddo", "imprest.settle", id, "executed", "settled")
	return out, nil
}

// ImprestBookRecord returns a single book by id.
func (p *Platform) ImprestBookRecord(id string) (ImprestBook, bool) { return imprestState().Get(id) }

// ImprestDashboard is the jurisdiction-scoped petty-cash picture (money in paise): books by status, the sanctioned
// float / cash-on-hand / cumulative-spent totals, the outstanding-to-reimburse total, and the unreimbursed
// worklist. Downward-governance scoped.
type ImprestDashboard struct {
	Scope             string         `json:"scope"`
	Books             int            `json:"books"`
	ByStatus          map[string]int `json:"by_status"`
	SanctionedPaise   int64          `json:"sanctioned_paise"`
	CashPaise         int64          `json:"cash_paise"`
	SpentPaise        int64          `json:"spent_paise"`
	UnreimbursedPaise int64          `json:"unreimbursed_paise"`
	Outstanding       []ImprestBook  `json:"outstanding,omitempty"`
	Synthetic         bool           `json:"synthetic"`
}

// ImprestDashboard rolls up books across the schools a tenant node governs (fail-closed for others).
func (p *Platform) ImprestDashboard(scopeOrg string) ImprestDashboard {
	d := ImprestDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, b := range imprestState().List(imprestFilter{}) {
		if !h.Governs(scopeOrg, b.OrgUnit) {
			continue
		}
		d.Books++
		d.ByStatus[b.Status]++
		d.SanctionedPaise += b.SanctionedPaise
		d.CashPaise += b.CashPaise
		d.SpentPaise += b.SpentPaise()
		if b.Status == ImprestOpen && b.UnreimbursedPaise() > 0 {
			d.Outstanding = append(d.Outstanding, b)
		}
	}
	d.UnreimbursedPaise = d.SanctionedPaise - d.CashPaise
	sort.Slice(d.Outstanding, func(i, j int) bool { return d.Outstanding[i].ID < d.Outstanding[j].ID })
	return d
}

// ScopedImprestBooks lists books a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedImprestBooks(scopeOrg, status string) []ImprestBook {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []ImprestBook
	for _, b := range imprestState().List(imprestFilter{Status: status}) {
		if h.Governs(scopeOrg, b.OrgUnit) {
			out = append(out, b)
		}
	}
	return out
}

// seedImprest plants an imprest book per school across more than one district: each a ₹10,000 float, partly spent
// (so there is unreimbursed contingent expenditure to reconcile). Money in paise. Synthetic SYN- ids only.
func seedImprest(s imprestStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	for si, school := range schools {
		tag := schoolTag(si)
		b := ImprestBook{
			ID: fmt.Sprintf("IMP-%s", tag), OrgUnit: school, SanctionedPaise: 10_000_00, Status: ImprestOpen,
			CashPaise: 10_000_00, CreatedOn: "2026-06-01", UpdatedAt: imprestNow(),
		}
		vouchers := []Voucher{
			{ID: "V-" + tag + "-01", Payee: "SYN-VEN-STAT", Purpose: "Stationery", AmountPaise: 1_200_00},
			{ID: "V-" + tag + "-02", Payee: "SYN-VEN-REPAIR", Purpose: "Fan repair", AmountPaise: 850_00},
		}
		for _, v := range vouchers {
			if out, err := applySpend(b, v, imprestNow()); err == nil {
				b = out
			}
		}
		s.Upsert(b)
	}
}
