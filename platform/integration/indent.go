package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Textbook / Uniform Indent is an L6 free-supply vertical: a school raises an indent for free textbooks/uniforms
// against its sanctioned entitlement (derived from enrolment), a higher office approves a quantity, and the
// supply is delivered against the approval. It is durable, audited, and enforces three hard invariants
// server-side:
//   - NO OVER-INDENT: the indented quantity can never exceed the sanctioned entitlement.
//   - APPROVAL CAP: the approved quantity can never exceed the indented quantity.
//   - NO OVER-SUPPLY: cumulative supply can never exceed the approved quantity.
// Staged raise → approved → supplied (or rejected). Downward-governance scoped. Synthetic SYN- ids only, never
// real PII.

// Indent status.
const (
	IndentRaised   = "raised"
	IndentApproved = "approved"
	IndentSupplied = "supplied"
	IndentRejected = "rejected"
)

func validIndentItem(i string) bool {
	switch i {
	case "textbook_set", "uniform_set", "notebook_pack", "shoes", "atlas":
		return true
	}
	return false
}

// TextbookIndent is one school's indent for a free-supply item with its approval + supply position.
type TextbookIndent struct {
	ID          string `json:"id"`
	OrgUnit     string `json:"org_unit"`
	Item        string `json:"item"`
	EntitledQty int    `json:"entitled_qty"`
	IndentedQty int    `json:"indented_qty"`
	ApprovedQty int    `json:"approved_qty"`
	SuppliedQty int    `json:"supplied_qty"`
	Status      string `json:"status"`
	CreatedOn   string `json:"created_on"`
	UpdatedAt   string `json:"updated_at"`
}

// Validate checks an indent's required fields and the no-over-indent invariant.
func (in TextbookIndent) Validate() error {
	if in.ID == "" || in.OrgUnit == "" {
		return errors.New("indent: id and org_unit are required")
	}
	if !validIndentItem(in.Item) {
		return errors.New("indent: item must be textbook_set, uniform_set, notebook_pack, shoes or atlas")
	}
	if in.EntitledQty < 1 {
		return errors.New("indent: entitled_qty must be at least 1")
	}
	if in.IndentedQty < 1 {
		return errors.New("indent: indented_qty must be at least 1")
	}
	if in.IndentedQty > in.EntitledQty {
		return fmt.Errorf("indent: over-indent — %d indented exceeds entitlement %d", in.IndentedQty, in.EntitledQty)
	}
	return nil
}

// applyApproveIndent approves a quantity — rejecting an approval beyond the indented quantity (approval cap).
func applyApproveIndent(in TextbookIndent, approvedQty int, now string) (TextbookIndent, error) {
	if in.Status != IndentRaised {
		return TextbookIndent{}, fmt.Errorf("indent: %s cannot be approved from %s", in.ID, in.Status)
	}
	if approvedQty < 1 {
		return TextbookIndent{}, errors.New("indent: approved quantity must be at least 1")
	}
	if approvedQty > in.IndentedQty {
		return TextbookIndent{}, fmt.Errorf("indent: approval cap — %d approved exceeds indented %d", approvedQty, in.IndentedQty)
	}
	in.ApprovedQty = approvedQty
	in.Status = IndentApproved
	in.UpdatedAt = now
	return in, nil
}

// applySupplyIndent books a supply — rejecting cumulative supply beyond the approved quantity (no over-supply).
func applySupplyIndent(in TextbookIndent, qty int, now string) (TextbookIndent, error) {
	if in.Status != IndentApproved {
		return TextbookIndent{}, fmt.Errorf("indent: %s is not approved for supply (status %s)", in.ID, in.Status)
	}
	if qty < 1 {
		return TextbookIndent{}, errors.New("indent: supply quantity must be at least 1")
	}
	if in.SuppliedQty+qty > in.ApprovedQty {
		return TextbookIndent{}, fmt.Errorf("indent: over-supply — %d supplied + %d would exceed approved %d", in.SuppliedQty, qty, in.ApprovedQty)
	}
	in.SuppliedQty += qty
	if in.SuppliedQty >= in.ApprovedQty {
		in.Status = IndentSupplied
	}
	in.UpdatedAt = now
	return in, nil
}

// applyRejectIndent rejects a raised indent.
func applyRejectIndent(in TextbookIndent, now string) (TextbookIndent, error) {
	if in.Status != IndentRaised {
		return TextbookIndent{}, fmt.Errorf("indent: %s can only be rejected from raised (status %s)", in.ID, in.Status)
	}
	in.Status = IndentRejected
	in.UpdatedAt = now
	return in, nil
}

type indentFilter struct{ OrgUnit, Status, Item string }

func matchIndent(f indentFilter, in TextbookIndent) bool {
	if f.OrgUnit != "" && in.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && in.Status != f.Status {
		return false
	}
	if f.Item != "" && in.Item != f.Item {
		return false
	}
	return true
}

// indentStore is the persistence port. *memIndentStore and *pgIndentStore satisfy it.
type indentStore interface {
	Upsert(TextbookIndent) (TextbookIndent, error)
	Get(id string) (TextbookIndent, bool)
	List(indentFilter) []TextbookIndent
}

type memIndentStore struct {
	mu sync.Mutex
	m  map[string]TextbookIndent
}

func newMemIndentStore() *memIndentStore { return &memIndentStore{m: map[string]TextbookIndent{}} }

func (s *memIndentStore) Upsert(in TextbookIndent) (TextbookIndent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[in.ID] = in
	return in, nil
}

func (s *memIndentStore) Get(id string) (TextbookIndent, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	in, ok := s.m[id]
	return in, ok
}

func (s *memIndentStore) List(f indentFilter) []TextbookIndent {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]TextbookIndent, 0, len(s.m))
	for _, in := range s.m {
		if matchIndent(f, in) {
			out = append(out, in)
		}
	}
	return out
}

var (
	indentOnce sync.Once
	indentBack indentStore
)

func indentState() indentStore {
	indentOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgIndentStore(dsn); err == nil {
				indentBack = pg
				log.Printf("indent: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("indent: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				indentBack = newMemIndentStore()
			}
		} else {
			indentBack = newMemIndentStore()
		}
		seedIndent(indentBack)
	})
	return indentBack
}

func indentNow() string { return "2026-06-25T00:00:00Z" }

// RaiseIndent records a new indent (status raised) — rejecting an over-indent beyond entitlement. Audited.
func (p *Platform) RaiseIndent(in TextbookIndent) (TextbookIndent, error) {
	in.Status = IndentRaised
	in.ApprovedQty = 0
	in.SuppliedQty = 0
	if in.CreatedOn == "" {
		in.CreatedOn = "2026-06-25"
	}
	in.UpdatedAt = indentNow()
	if err := in.Validate(); err != nil {
		p.appendAudit("supply-officer", "indent.raise.denied", in.OrgUnit, "deny", err.Error())
		return TextbookIndent{}, err
	}
	out, err := indentState().Upsert(in)
	if err != nil {
		return TextbookIndent{}, err
	}
	p.appendAudit("supply-officer", "indent.raise", in.ID, "executed", fmt.Sprintf("%s %d/%d", in.Item, in.IndentedQty, in.EntitledQty))
	return out, nil
}

// ApproveIndent approves a quantity — rejecting an over-approval. Audited.
func (p *Platform) ApproveIndent(id string, approvedQty int) (TextbookIndent, error) {
	cur, ok := indentState().Get(id)
	if !ok {
		return TextbookIndent{}, errors.New("indent: not found")
	}
	out, err := applyApproveIndent(cur, approvedQty, indentNow())
	if err != nil {
		p.appendAudit("supply-officer", "indent.approve.denied", id, "deny", err.Error())
		return TextbookIndent{}, err
	}
	if _, err := indentState().Upsert(out); err != nil {
		return TextbookIndent{}, err
	}
	p.appendAudit("supply-officer", "indent.approve", id, "executed", fmt.Sprintf("approved %d", approvedQty))
	return out, nil
}

// SupplyIndent books a supply — rejecting an over-supply. Audited.
func (p *Platform) SupplyIndent(id string, qty int) (TextbookIndent, error) {
	cur, ok := indentState().Get(id)
	if !ok {
		return TextbookIndent{}, errors.New("indent: not found")
	}
	out, err := applySupplyIndent(cur, qty, indentNow())
	if err != nil {
		p.appendAudit("supply-officer", "indent.supply.denied", id, "deny", err.Error())
		return TextbookIndent{}, err
	}
	if _, err := indentState().Upsert(out); err != nil {
		return TextbookIndent{}, err
	}
	p.appendAudit("supply-officer", "indent.supply", id, "executed", fmt.Sprintf("+%d → %d/%d", qty, out.SuppliedQty, out.ApprovedQty))
	return out, nil
}

// RejectIndent rejects a raised indent. Audited.
func (p *Platform) RejectIndent(id string) (TextbookIndent, error) {
	cur, ok := indentState().Get(id)
	if !ok {
		return TextbookIndent{}, errors.New("indent: not found")
	}
	out, err := applyRejectIndent(cur, indentNow())
	if err != nil {
		p.appendAudit("supply-officer", "indent.reject.denied", id, "deny", err.Error())
		return TextbookIndent{}, err
	}
	if _, err := indentState().Upsert(out); err != nil {
		return TextbookIndent{}, err
	}
	p.appendAudit("supply-officer", "indent.reject", id, "executed", "rejected")
	return out, nil
}

// IndentRecord returns a single indent by id.
func (p *Platform) IndentRecord(id string) (TextbookIndent, bool) { return indentState().Get(id) }

// IndentDashboard is the jurisdiction-scoped free-supply picture: indents by status, the entitled/indented/
// approved/supplied totals, the supply-fill rate and the pending-approval worklist. Downward-governance scoped.
type IndentDashboard struct {
	Scope          string           `json:"scope"`
	Indents        int              `json:"indents"`
	ByStatus       map[string]int   `json:"by_status"`
	EntitledQty    int              `json:"entitled_qty"`
	IndentedQty    int              `json:"indented_qty"`
	ApprovedQty    int              `json:"approved_qty"`
	SuppliedQty    int              `json:"supplied_qty"`
	PendingApprove []TextbookIndent `json:"pending_approve,omitempty"`
	Synthetic      bool             `json:"synthetic"`
}

// IndentDashboard rolls up indents across the schools a tenant node governs (fail-closed for others).
func (p *Platform) IndentDashboard(scopeOrg string) IndentDashboard {
	d := IndentDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, in := range indentState().List(indentFilter{}) {
		if !h.Governs(scopeOrg, in.OrgUnit) {
			continue
		}
		d.Indents++
		d.ByStatus[in.Status]++
		d.EntitledQty += in.EntitledQty
		d.IndentedQty += in.IndentedQty
		d.ApprovedQty += in.ApprovedQty
		d.SuppliedQty += in.SuppliedQty
		if in.Status == IndentRaised {
			d.PendingApprove = append(d.PendingApprove, in)
		}
	}
	sort.Slice(d.PendingApprove, func(i, j int) bool { return d.PendingApprove[i].ID < d.PendingApprove[j].ID })
	return d
}

// ScopedIndents lists indents a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedIndents(scopeOrg, status string) []TextbookIndent {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []TextbookIndent
	for _, in := range indentState().List(indentFilter{Status: status}) {
		if h.Governs(scopeOrg, in.OrgUnit) {
			out = append(out, in)
		}
	}
	return out
}

// seedIndent plants indents per school across more than one district: one raised (pending approval), one approved
// and part-supplied, and one fully supplied. Synthetic SYN- ids only.
func seedIndent(s indentStore) {
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

		// Textbooks — raised, pending approval.
		books := TextbookIndent{
			ID: fmt.Sprintf("IND-%s-BOOK", tag), OrgUnit: school, Item: "textbook_set", EntitledQty: 320, IndentedQty: 300,
			Status: IndentRaised, CreatedOn: "2026-06-15", UpdatedAt: indentNow(),
		}
		if err := books.Validate(); err == nil {
			s.Upsert(books)
		}

		// Uniforms — approved 280, 200 supplied.
		uni := TextbookIndent{
			ID: fmt.Sprintf("IND-%s-UNI", tag), OrgUnit: school, Item: "uniform_set", EntitledQty: 320, IndentedQty: 300,
			Status: IndentRaised, CreatedOn: "2026-06-10", UpdatedAt: indentNow(),
		}
		if uni.Validate() == nil {
			uni, _ = applyApproveIndent(uni, 280, indentNow())
			uni, _ = applySupplyIndent(uni, 200, indentNow())
			s.Upsert(uni)
		}

		// Notebooks — fully supplied.
		nb := TextbookIndent{
			ID: fmt.Sprintf("IND-%s-NB", tag), OrgUnit: school, Item: "notebook_pack", EntitledQty: 320, IndentedQty: 320,
			Status: IndentRaised, CreatedOn: "2026-06-05", UpdatedAt: indentNow(),
		}
		if nb.Validate() == nil {
			nb, _ = applyApproveIndent(nb, 320, indentNow())
			nb, _ = applySupplyIndent(nb, 320, indentNow())
			s.Upsert(nb)
		}
	}
}
