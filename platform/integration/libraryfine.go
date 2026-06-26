package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Library Fine Ledger is an L6 library-finance vertical (money in paise): each member has a ledger of overdue
// fines, pays or has them waived, and is BLOCKED from borrowing while their outstanding dues exceed a threshold —
// the lever that keeps books circulating. It is durable, audited, and enforces three hard invariants server-side:
//   - NO OVERPAY: a payment can never exceed a fine's outstanding amount.
//   - NO RE-SETTLE: a fine already paid or waived cannot be paid or waived again.
//   - BORROW-BLOCK GATE: a member whose outstanding dues exceed the block threshold cannot be issued a new book.
// Fines are embedded on the member's ledger (like hostel residents). Downward-governance scoped. Synthetic SYN-
// ids only, never real PII.

// Fine status.
const (
	FineOpen   = "open"
	FinePaid   = "paid"
	FineWaived = "waived"
)

// Fine is one overdue charge against a member's ledger.
type Fine struct {
	ID          string `json:"id"`
	Book        string `json:"book"`
	DaysOverdue int    `json:"days_overdue"`
	AmountPaise int64  `json:"amount_paise"`
	PaidPaise   int64  `json:"paid_paise"`
	Status      string `json:"status"`
	AccruedOn   string `json:"accrued_on"`
}

// OutstandingPaise is the unpaid balance of an open fine (zero once paid/waived).
func (f Fine) OutstandingPaise() int64 {
	if f.Status != FineOpen {
		return 0
	}
	return f.AmountPaise - f.PaidPaise
}

// MemberFines is one member's fine ledger with its block threshold.
type MemberFines struct {
	ID                  string `json:"id"`
	OrgUnit             string `json:"org_unit"`
	MemberID            string `json:"member_id"`
	BlockThresholdPaise int64  `json:"block_threshold_paise"`
	Fines               []Fine `json:"fines,omitempty"`
	CreatedOn           string `json:"created_on"`
	UpdatedAt           string `json:"updated_at"`
}

// OutstandingPaise is the member's total unpaid fine balance.
func (m MemberFines) OutstandingPaise() int64 {
	var s int64
	for _, f := range m.Fines {
		s += f.OutstandingPaise()
	}
	return s
}

// BorrowEligible reports whether the member is within the block threshold.
func (m MemberFines) BorrowEligible() bool { return m.OutstandingPaise() <= m.BlockThresholdPaise }

// Validate checks a ledger's required fields.
func (m MemberFines) Validate() error {
	if m.ID == "" || m.OrgUnit == "" {
		return errors.New("libraryfine: id and org_unit are required")
	}
	if m.MemberID == "" {
		return errors.New("libraryfine: a member_id is required")
	}
	if m.BlockThresholdPaise < 0 {
		return errors.New("libraryfine: block_threshold_paise must be non-negative")
	}
	return nil
}

func (m MemberFines) fineIndex(fineID string) int {
	for i := range m.Fines {
		if m.Fines[i].ID == fineID {
			return i
		}
	}
	return -1
}

// applyAccrue books an overdue fine (amount = days × daily rate).
func applyAccrue(m MemberFines, fineID, book string, days int, ratePaise int64, now string) (MemberFines, error) {
	if fineID == "" || book == "" {
		return MemberFines{}, errors.New("libraryfine: fine id and book are required")
	}
	if days < 1 {
		return MemberFines{}, errors.New("libraryfine: days_overdue must be at least 1")
	}
	if ratePaise < 1 {
		return MemberFines{}, errors.New("libraryfine: daily rate must be positive")
	}
	if m.fineIndex(fineID) >= 0 {
		return MemberFines{}, fmt.Errorf("libraryfine: fine %s already exists", fineID)
	}
	m.Fines = append(m.Fines, Fine{
		ID: fineID, Book: book, DaysOverdue: days, AmountPaise: int64(days) * ratePaise, Status: FineOpen, AccruedOn: "2026-06-25",
	})
	m.UpdatedAt = now
	return m, nil
}

// applyPayFine books a payment against a fine — rejecting an overpay or a re-settlement.
func applyPayFine(m MemberFines, fineID string, amountPaise int64, now string) (MemberFines, error) {
	idx := m.fineIndex(fineID)
	if idx < 0 {
		return MemberFines{}, fmt.Errorf("libraryfine: fine %s not found", fineID)
	}
	f := m.Fines[idx]
	if f.Status != FineOpen {
		return MemberFines{}, fmt.Errorf("libraryfine: fine %s is already %s", fineID, f.Status)
	}
	if amountPaise <= 0 {
		return MemberFines{}, errors.New("libraryfine: payment must be positive")
	}
	if amountPaise > f.OutstandingPaise() {
		return MemberFines{}, fmt.Errorf("libraryfine: payment %d exceeds outstanding %d on fine %s (no overpay)", amountPaise, f.OutstandingPaise(), fineID)
	}
	f.PaidPaise += amountPaise
	if f.PaidPaise >= f.AmountPaise {
		f.Status = FinePaid
	}
	m.Fines[idx] = f
	m.UpdatedAt = now
	return m, nil
}

// applyWaiveFine waives a fine — rejecting a re-settlement.
func applyWaiveFine(m MemberFines, fineID, now string) (MemberFines, error) {
	idx := m.fineIndex(fineID)
	if idx < 0 {
		return MemberFines{}, fmt.Errorf("libraryfine: fine %s not found", fineID)
	}
	if m.Fines[idx].Status != FineOpen {
		return MemberFines{}, fmt.Errorf("libraryfine: fine %s is already %s", fineID, m.Fines[idx].Status)
	}
	m.Fines[idx].Status = FineWaived
	m.UpdatedAt = now
	return m, nil
}

type fineFilter struct{ OrgUnit string }

func matchFine(f fineFilter, m MemberFines) bool {
	if f.OrgUnit != "" && m.OrgUnit != f.OrgUnit {
		return false
	}
	return true
}

// fineStore is the persistence port. *memFineStore and *pgFineStore satisfy it.
type fineStore interface {
	Upsert(MemberFines) (MemberFines, error)
	Get(id string) (MemberFines, bool)
	List(fineFilter) []MemberFines
}

type memFineStore struct {
	mu sync.Mutex
	m  map[string]MemberFines
}

func newMemFineStore() *memFineStore { return &memFineStore{m: map[string]MemberFines{}} }

func (s *memFineStore) Upsert(m MemberFines) (MemberFines, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[m.ID] = m
	return m, nil
}

func (s *memFineStore) Get(id string) (MemberFines, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	m, ok := s.m[id]
	return m, ok
}

func (s *memFineStore) List(f fineFilter) []MemberFines {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]MemberFines, 0, len(s.m))
	for _, m := range s.m {
		if matchFine(f, m) {
			out = append(out, m)
		}
	}
	return out
}

var (
	fineOnce sync.Once
	fineBack fineStore
)

func fineState() fineStore {
	fineOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgFineStore(dsn); err == nil {
				fineBack = pg
				log.Printf("libraryfine: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("libraryfine: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				fineBack = newMemFineStore()
			}
		} else {
			fineBack = newMemFineStore()
		}
		seedFine(fineBack)
	})
	return fineBack
}

func fineNow() string { return "2026-06-25T00:00:00Z" }

// OpenFineLedger records a new member fine ledger. Audited.
func (p *Platform) OpenFineLedger(m MemberFines) (MemberFines, error) {
	m.Fines = nil
	if m.BlockThresholdPaise == 0 {
		m.BlockThresholdPaise = 100_00 // ₹100 default block threshold
	}
	if m.CreatedOn == "" {
		m.CreatedOn = "2026-06-25"
	}
	m.UpdatedAt = fineNow()
	if err := m.Validate(); err != nil {
		p.appendAudit("librarian", "libraryfine.open.denied", m.OrgUnit, "deny", err.Error())
		return MemberFines{}, err
	}
	out, err := fineState().Upsert(m)
	if err != nil {
		return MemberFines{}, err
	}
	p.appendAudit("librarian", "libraryfine.open", m.ID, "executed", m.MemberID)
	return out, nil
}

// AccrueFine books an overdue fine. Audited.
func (p *Platform) AccrueFine(id, fineID, book string, days int, ratePaise int64) (MemberFines, error) {
	cur, ok := fineState().Get(id)
	if !ok {
		return MemberFines{}, errors.New("libraryfine: ledger not found")
	}
	out, err := applyAccrue(cur, fineID, book, days, ratePaise, fineNow())
	if err != nil {
		p.appendAudit("librarian", "libraryfine.accrue.denied", id, "deny", err.Error())
		return MemberFines{}, err
	}
	if _, err := fineState().Upsert(out); err != nil {
		return MemberFines{}, err
	}
	p.appendAudit("librarian", "libraryfine.accrue", id, "executed", fmt.Sprintf("%s %dd → %d", book, days, int64(days)*ratePaise))
	return out, nil
}

// PayFine books a payment — rejecting an overpay or re-settlement. Audited.
func (p *Platform) PayFine(id, fineID string, amountPaise int64) (MemberFines, error) {
	cur, ok := fineState().Get(id)
	if !ok {
		return MemberFines{}, errors.New("libraryfine: ledger not found")
	}
	out, err := applyPayFine(cur, fineID, amountPaise, fineNow())
	if err != nil {
		p.appendAudit("librarian", "libraryfine.pay.denied", id, "deny", err.Error())
		return MemberFines{}, err
	}
	if _, err := fineState().Upsert(out); err != nil {
		return MemberFines{}, err
	}
	p.appendAudit("librarian", "libraryfine.pay", id, "executed", fmt.Sprintf("%s +%d → outstanding %d", fineID, amountPaise, out.OutstandingPaise()))
	return out, nil
}

// WaiveFine waives a fine — rejecting a re-settlement. Audited.
func (p *Platform) WaiveFine(id, fineID string) (MemberFines, error) {
	cur, ok := fineState().Get(id)
	if !ok {
		return MemberFines{}, errors.New("libraryfine: ledger not found")
	}
	out, err := applyWaiveFine(cur, fineID, fineNow())
	if err != nil {
		p.appendAudit("librarian", "libraryfine.waive.denied", id, "deny", err.Error())
		return MemberFines{}, err
	}
	if _, err := fineState().Upsert(out); err != nil {
		return MemberFines{}, err
	}
	p.appendAudit("librarian", "libraryfine.waive", id, "executed", fineID)
	return out, nil
}

// RequestBorrow enforces the borrow-block gate — rejecting an issue while the member is over the threshold.
// Audited. (The library catalogue holds the books; this is the dues clearance the issue desk must consult.)
func (p *Platform) RequestBorrow(id, book string) (MemberFines, error) {
	cur, ok := fineState().Get(id)
	if !ok {
		return MemberFines{}, errors.New("libraryfine: ledger not found")
	}
	if !cur.BorrowEligible() {
		err := fmt.Errorf("libraryfine: %s is blocked — outstanding %d exceeds threshold %d", cur.MemberID, cur.OutstandingPaise(), cur.BlockThresholdPaise)
		p.appendAudit("librarian", "libraryfine.borrow.denied", id, "deny", err.Error())
		return MemberFines{}, err
	}
	p.appendAudit("librarian", "libraryfine.borrow", id, "executed", fmt.Sprintf("%s cleared for %s", cur.MemberID, book))
	return cur, nil
}

// FineLedgerRecord returns a single ledger by id.
func (p *Platform) FineLedgerRecord(id string) (MemberFines, bool) { return fineState().Get(id) }

// LibraryFineDashboard is the jurisdiction-scoped fines picture (money in paise): ledgers, outstanding/collected/
// waived totals, blocked-member count and the blocked worklist. Downward-governance scoped.
type LibraryFineDashboard struct {
	Scope            string        `json:"scope"`
	Ledgers          int           `json:"ledgers"`
	OutstandingPaise int64         `json:"outstanding_paise"`
	CollectedPaise   int64         `json:"collected_paise"`
	WaivedPaise      int64         `json:"waived_paise"`
	Blocked          int           `json:"blocked"`
	BlockedList      []MemberFines `json:"blocked_list,omitempty"`
	Synthetic        bool          `json:"synthetic"`
}

// LibraryFineDashboard rolls up ledgers across the schools a tenant node governs (fail-closed for others).
func (p *Platform) LibraryFineDashboard(scopeOrg string) LibraryFineDashboard {
	d := LibraryFineDashboard{Scope: scopeOrg, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, m := range fineState().List(fineFilter{}) {
		if !h.Governs(scopeOrg, m.OrgUnit) {
			continue
		}
		d.Ledgers++
		d.OutstandingPaise += m.OutstandingPaise()
		for _, f := range m.Fines {
			d.CollectedPaise += f.PaidPaise
			if f.Status == FineWaived {
				d.WaivedPaise += f.AmountPaise - f.PaidPaise
			}
		}
		if !m.BorrowEligible() {
			d.Blocked++
			d.BlockedList = append(d.BlockedList, m)
		}
	}
	sort.Slice(d.BlockedList, func(i, j int) bool { return d.BlockedList[i].ID < d.BlockedList[j].ID })
	return d
}

// ScopedFineLedgers lists ledgers a tenant node governs.
func (p *Platform) ScopedFineLedgers(scopeOrg string) []MemberFines {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []MemberFines
	for _, m := range fineState().List(fineFilter{}) {
		if h.Governs(scopeOrg, m.OrgUnit) {
			out = append(out, m)
		}
	}
	return out
}

// seedFine plants a member fine ledger per school across more than one district: one within the threshold
// (eligible) and one over it (blocked). Money in paise. Synthetic SYN- ids only.
func seedFine(s fineStore) {
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

		// Eligible member — a small, mostly paid fine.
		ok := MemberFines{
			ID: fmt.Sprintf("FINE-%s-M1", tag), OrgUnit: school, MemberID: fmt.Sprintf("SYN-S-%s-M1", tag),
			BlockThresholdPaise: 100_00, CreatedOn: "2026-06-01", UpdatedAt: fineNow(),
		}
		ok, _ = applyAccrue(ok, "F-"+tag+"-1", "Wings of Fire", 5, 2_00, fineNow()) // ₹10
		ok, _ = applyPayFine(ok, "F-"+tag+"-1", 10_00, fineNow())                   // paid in full
		s.Upsert(ok)

		// Blocked member — outstanding above the threshold.
		blocked := MemberFines{
			ID: fmt.Sprintf("FINE-%s-M2", tag), OrgUnit: school, MemberID: fmt.Sprintf("SYN-S-%s-M2", tag),
			BlockThresholdPaise: 100_00, CreatedOn: "2026-06-01", UpdatedAt: fineNow(),
		}
		blocked, _ = applyAccrue(blocked, "F-"+tag+"-2", "Atlas of India", 80, 2_00, fineNow()) // ₹160 > ₹100
		s.Upsert(blocked)
	}
}
