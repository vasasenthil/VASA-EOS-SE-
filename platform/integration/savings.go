package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// School Bank / Student Savings is an L6 financial-literacy vertical (money in paise): each student holds a
// savings passbook with a running balance and an embedded transaction ledger. It is durable, audited, and
// enforces three hard invariants server-side:
//   - NO NEGATIVE BALANCE: a withdrawal can never exceed the balance on hand.
//   - NO TRANSACTION ON A FROZEN/CLOSED ACCOUNT: deposits and withdrawals are rejected once an account is frozen
//     (guardian/admin hold) or closed.
//   - NO CLOSE WITH A BALANCE: an account can only be closed once its balance is zero (funds settled first).
// Transactions are embedded on the passbook (like hostel residents). Downward-governance scoped. Synthetic SYN-
// ids only, never real PII.

// Account status.
const (
	AcctActive = "active"
	AcctClosed = "closed"
)

// Txn is one passbook entry (deposit or withdrawal) with the resulting balance.
type Txn struct {
	ID           string `json:"id"`
	Kind         string `json:"kind"` // deposit | withdrawal
	AmountPaise  int64  `json:"amount_paise"`
	BalanceAfter int64  `json:"balance_after"`
	RecordedOn   string `json:"recorded_on"`
}

// SavingsAccount is one student's savings passbook.
type SavingsAccount struct {
	ID           string `json:"id"`
	OrgUnit      string `json:"org_unit"`
	StudentID    string `json:"student_id"`
	BalancePaise int64  `json:"balance_paise"`
	Frozen       bool   `json:"frozen"`
	Transactions []Txn  `json:"transactions,omitempty"`
	Status       string `json:"status"`
	CreatedOn    string `json:"created_on"`
	UpdatedAt    string `json:"updated_at"`
}

// Validate checks an account's required fields.
func (a SavingsAccount) Validate() error {
	if a.ID == "" || a.OrgUnit == "" {
		return errors.New("savings: id and org_unit are required")
	}
	if a.StudentID == "" {
		return errors.New("savings: a student_id is required")
	}
	return nil
}

// applyDeposit credits the passbook — rejected on a frozen/closed account.
func applyDeposit(a SavingsAccount, txnID string, amountPaise int64, now string) (SavingsAccount, error) {
	if a.Status != AcctActive {
		return SavingsAccount{}, fmt.Errorf("savings: %s is closed — cannot deposit", a.ID)
	}
	if a.Frozen {
		return SavingsAccount{}, fmt.Errorf("savings: %s is frozen — cannot deposit", a.ID)
	}
	if amountPaise <= 0 {
		return SavingsAccount{}, errors.New("savings: deposit must be positive")
	}
	a.BalancePaise += amountPaise
	a.Transactions = append(a.Transactions, Txn{ID: txnID, Kind: "deposit", AmountPaise: amountPaise, BalanceAfter: a.BalancePaise, RecordedOn: "2026-06-25"})
	a.UpdatedAt = now
	return a, nil
}

// applySavingsWithdraw debits the passbook — rejected on a frozen/closed account or an overdraw (no negative balance).
func applySavingsWithdraw(a SavingsAccount, txnID string, amountPaise int64, now string) (SavingsAccount, error) {
	if a.Status != AcctActive {
		return SavingsAccount{}, fmt.Errorf("savings: %s is closed — cannot withdraw", a.ID)
	}
	if a.Frozen {
		return SavingsAccount{}, fmt.Errorf("savings: %s is frozen — cannot withdraw", a.ID)
	}
	if amountPaise <= 0 {
		return SavingsAccount{}, errors.New("savings: withdrawal must be positive")
	}
	if amountPaise > a.BalancePaise {
		return SavingsAccount{}, fmt.Errorf("savings: withdrawal %d exceeds balance %d on %s (no negative balance)", amountPaise, a.BalancePaise, a.ID)
	}
	a.BalancePaise -= amountPaise
	a.Transactions = append(a.Transactions, Txn{ID: txnID, Kind: "withdrawal", AmountPaise: amountPaise, BalanceAfter: a.BalancePaise, RecordedOn: "2026-06-25"})
	a.UpdatedAt = now
	return a, nil
}

// applySetFreeze sets the frozen flag (a guardian/admin hold).
func applySetFreeze(a SavingsAccount, frozen bool, now string) (SavingsAccount, error) {
	if a.Status != AcctActive {
		return SavingsAccount{}, fmt.Errorf("savings: %s is closed", a.ID)
	}
	a.Frozen = frozen
	a.UpdatedAt = now
	return a, nil
}

// applyCloseAccount closes a zero-balance account.
func applyCloseAccount(a SavingsAccount, now string) (SavingsAccount, error) {
	if a.Status != AcctActive {
		return SavingsAccount{}, fmt.Errorf("savings: %s is already closed", a.ID)
	}
	if a.BalancePaise > 0 {
		return SavingsAccount{}, fmt.Errorf("savings: cannot close %s — balance %d must be withdrawn first", a.ID, a.BalancePaise)
	}
	a.Status = AcctClosed
	a.UpdatedAt = now
	return a, nil
}

type savingsFilter struct{ OrgUnit, Status string }

func matchSavings(f savingsFilter, a SavingsAccount) bool {
	if f.OrgUnit != "" && a.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && a.Status != f.Status {
		return false
	}
	return true
}

// savingsStore is the persistence port. *memSavingsStore and *pgSavingsStore satisfy it.
type savingsStore interface {
	Upsert(SavingsAccount) (SavingsAccount, error)
	Get(id string) (SavingsAccount, bool)
	List(savingsFilter) []SavingsAccount
}

type memSavingsStore struct {
	mu sync.Mutex
	m  map[string]SavingsAccount
}

func newMemSavingsStore() *memSavingsStore { return &memSavingsStore{m: map[string]SavingsAccount{}} }

func (s *memSavingsStore) Upsert(a SavingsAccount) (SavingsAccount, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[a.ID] = a
	return a, nil
}

func (s *memSavingsStore) Get(id string) (SavingsAccount, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	a, ok := s.m[id]
	return a, ok
}

func (s *memSavingsStore) List(f savingsFilter) []SavingsAccount {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]SavingsAccount, 0, len(s.m))
	for _, a := range s.m {
		if matchSavings(f, a) {
			out = append(out, a)
		}
	}
	return out
}

var (
	savingsOnce sync.Once
	savingsBack savingsStore
)

func savingsState() savingsStore {
	savingsOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgSavingsStore(dsn); err == nil {
				savingsBack = pg
				log.Printf("savings: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("savings: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				savingsBack = newMemSavingsStore()
			}
		} else {
			savingsBack = newMemSavingsStore()
		}
		seedSavings(savingsBack)
	})
	return savingsBack
}

func savingsNow() string { return "2026-06-25T00:00:00Z" }

// OpenSavingsAccount records a new passbook (status active, zero balance). Audited.
func (p *Platform) OpenSavingsAccount(a SavingsAccount) (SavingsAccount, error) {
	a.Status = AcctActive
	a.Frozen = false
	a.BalancePaise = 0
	a.Transactions = nil
	if a.CreatedOn == "" {
		a.CreatedOn = "2026-06-25"
	}
	a.UpdatedAt = savingsNow()
	if err := a.Validate(); err != nil {
		p.appendAudit("savings-clerk", "savings.open.denied", a.OrgUnit, "deny", err.Error())
		return SavingsAccount{}, err
	}
	out, err := savingsState().Upsert(a)
	if err != nil {
		return SavingsAccount{}, err
	}
	p.appendAudit("savings-clerk", "savings.open", a.ID, "executed", a.StudentID)
	return out, nil
}

// Deposit credits a passbook. Audited.
func (p *Platform) Deposit(id, txnID string, amountPaise int64) (SavingsAccount, error) {
	cur, ok := savingsState().Get(id)
	if !ok {
		return SavingsAccount{}, errors.New("savings: not found")
	}
	out, err := applyDeposit(cur, txnID, amountPaise, savingsNow())
	if err != nil {
		p.appendAudit("savings-clerk", "savings.deposit.denied", id, "deny", err.Error())
		return SavingsAccount{}, err
	}
	if _, err := savingsState().Upsert(out); err != nil {
		return SavingsAccount{}, err
	}
	p.appendAudit("savings-clerk", "savings.deposit", id, "executed", fmt.Sprintf("+%d → %d", amountPaise, out.BalancePaise))
	return out, nil
}

// Withdraw debits a passbook — rejecting an overdraw. Audited.
func (p *Platform) Withdraw(id, txnID string, amountPaise int64) (SavingsAccount, error) {
	cur, ok := savingsState().Get(id)
	if !ok {
		return SavingsAccount{}, errors.New("savings: not found")
	}
	out, err := applySavingsWithdraw(cur, txnID, amountPaise, savingsNow())
	if err != nil {
		p.appendAudit("savings-clerk", "savings.withdraw.denied", id, "deny", err.Error())
		return SavingsAccount{}, err
	}
	if _, err := savingsState().Upsert(out); err != nil {
		return SavingsAccount{}, err
	}
	p.appendAudit("savings-clerk", "savings.withdraw", id, "executed", fmt.Sprintf("-%d → %d", amountPaise, out.BalancePaise))
	return out, nil
}

// SetFreeze places or lifts a hold on a passbook. Audited.
func (p *Platform) SetFreeze(id string, frozen bool) (SavingsAccount, error) {
	cur, ok := savingsState().Get(id)
	if !ok {
		return SavingsAccount{}, errors.New("savings: not found")
	}
	out, err := applySetFreeze(cur, frozen, savingsNow())
	if err != nil {
		p.appendAudit("savings-clerk", "savings.freeze.denied", id, "deny", err.Error())
		return SavingsAccount{}, err
	}
	if _, err := savingsState().Upsert(out); err != nil {
		return SavingsAccount{}, err
	}
	action := "savings.unfreeze"
	if frozen {
		action = "savings.freeze"
	}
	p.appendAudit("savings-clerk", action, id, "executed", "")
	return out, nil
}

// CloseSavingsAccount closes a zero-balance passbook. Audited.
func (p *Platform) CloseSavingsAccount(id string) (SavingsAccount, error) {
	cur, ok := savingsState().Get(id)
	if !ok {
		return SavingsAccount{}, errors.New("savings: not found")
	}
	out, err := applyCloseAccount(cur, savingsNow())
	if err != nil {
		p.appendAudit("savings-clerk", "savings.close.denied", id, "deny", err.Error())
		return SavingsAccount{}, err
	}
	if _, err := savingsState().Upsert(out); err != nil {
		return SavingsAccount{}, err
	}
	p.appendAudit("savings-clerk", "savings.close", id, "executed", "closed")
	return out, nil
}

// SavingsAccountRecord returns a single account by id.
func (p *Platform) SavingsAccountRecord(id string) (SavingsAccount, bool) {
	return savingsState().Get(id)
}

// SavingsDashboard is the jurisdiction-scoped school-bank picture (money in paise): accounts by status, total
// balance, cumulative deposits/withdrawals, frozen count and the frozen worklist. Downward-governance scoped.
type SavingsDashboard struct {
	Scope          string           `json:"scope"`
	Accounts       int              `json:"accounts"`
	ByStatus       map[string]int   `json:"by_status"`
	BalancePaise   int64            `json:"balance_paise"`
	DepositsPaise  int64            `json:"deposits_paise"`
	WithdrawnPaise int64            `json:"withdrawn_paise"`
	Frozen         int              `json:"frozen"`
	FrozenList     []SavingsAccount `json:"frozen_list,omitempty"`
	Synthetic      bool             `json:"synthetic"`
}

// SavingsDashboard rolls up passbooks across the schools a tenant node governs (fail-closed for others).
func (p *Platform) SavingsDashboard(scopeOrg string) SavingsDashboard {
	d := SavingsDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, a := range savingsState().List(savingsFilter{}) {
		if !h.Governs(scopeOrg, a.OrgUnit) {
			continue
		}
		d.Accounts++
		d.ByStatus[a.Status]++
		d.BalancePaise += a.BalancePaise
		for _, t := range a.Transactions {
			if t.Kind == "deposit" {
				d.DepositsPaise += t.AmountPaise
			} else {
				d.WithdrawnPaise += t.AmountPaise
			}
		}
		if a.Frozen {
			d.Frozen++
			d.FrozenList = append(d.FrozenList, a)
		}
	}
	sort.Slice(d.FrozenList, func(i, j int) bool { return d.FrozenList[i].ID < d.FrozenList[j].ID })
	return d
}

// ScopedSavingsAccounts lists passbooks a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedSavingsAccounts(scopeOrg, status string) []SavingsAccount {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []SavingsAccount
	for _, a := range savingsState().List(savingsFilter{Status: status}) {
		if h.Governs(scopeOrg, a.OrgUnit) {
			out = append(out, a)
		}
	}
	return out
}

// seedSavings plants a passbook per school across more than one district: one with a healthy balance and one
// frozen (guardian hold). Money in paise. Synthetic SYN- ids only.
func seedSavings(s savingsStore) {
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

		// Healthy passbook — deposited, partly withdrawn.
		a := SavingsAccount{
			ID: fmt.Sprintf("SAV-%s-01", tag), OrgUnit: school, StudentID: fmt.Sprintf("SYN-S-%s-S1", tag),
			Status: AcctActive, CreatedOn: "2026-06-01", UpdatedAt: savingsNow(),
		}
		a, _ = applyDeposit(a, "T-"+tag+"-1", 500_00, savingsNow())
		a, _ = applySavingsWithdraw(a, "T-"+tag+"-2", 150_00, savingsNow())
		s.Upsert(a)

		// Frozen passbook — guardian hold.
		f := SavingsAccount{
			ID: fmt.Sprintf("SAV-%s-02", tag), OrgUnit: school, StudentID: fmt.Sprintf("SYN-S-%s-S2", tag),
			Status: AcctActive, CreatedOn: "2026-06-01", UpdatedAt: savingsNow(),
		}
		f, _ = applyDeposit(f, "T-"+tag+"-3", 200_00, savingsNow())
		f, _ = applySetFreeze(f, true, savingsNow())
		s.Upsert(f)
	}
}
