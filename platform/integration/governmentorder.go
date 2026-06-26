package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Government Order (GO) issuance is the canonical L1 State-Secretariat instrument: every TN scheme, sanction,
// posting and policy is enacted through a numbered Government Order. This vertical models the GO lifecycle as a
// durable, audited, multi-tier approval workflow and enforces hard invariants server-side:
//   - LINEAR PROGRESSION: a GO advances drafted → vetted → approved → issued → published, one step at a time.
//     No stage may be skipped (you cannot approve an un-vetted draft, nor issue an un-approved order).
//   - NUMBER ON ISSUE + UNIQUENESS: a GO cannot be issued without a gazette number, and no two live (issued or
//     published) orders may share the same number — the register cannot mint a duplicate GO number.
//   - WITHDRAWAL IS TERMINAL: a withdrawn (rescinded) order is final; it cannot be re-advanced, and a withdrawn
//     order cannot be withdrawn again. Withdrawal always records a reason.
// Downward-governance scoped (a tenant node sees the GOs of the org units it governs). Synthetic SYN- ids only.

// GO lifecycle status.
const (
	GODrafted   = "drafted"
	GOVetted    = "vetted"
	GOApproved  = "approved"
	GOIssued    = "issued"
	GOPublished = "published"
	GOWithdrawn = "withdrawn"
)

func validGOCategory(c string) bool {
	switch c {
	case "policy", "financial", "establishment", "scheme", "administrative":
		return true
	}
	return false
}

// GovernmentOrder is one GO moving through the secretariat's draft → vet → approve → issue → publish workflow.
type GovernmentOrder struct {
	ID          string `json:"id"`
	OrgUnit     string `json:"org_unit"`
	Number      string `json:"number,omitempty"` // gazette number, assigned at issue
	Department  string `json:"department"`
	Category    string `json:"category"` // policy | financial | establishment | scheme | administrative
	Subject     string `json:"subject"`
	AmountPaise int64  `json:"amount_paise"` // for financial GOs (0 otherwise)
	Status      string `json:"status"`
	DraftedBy   string `json:"drafted_by,omitempty"`
	VettedBy    string `json:"vetted_by,omitempty"`
	ApprovedBy  string `json:"approved_by,omitempty"`
	Reason      string `json:"reason,omitempty"` // withdrawal reason
	CreatedOn   string `json:"created_on"`
	UpdatedAt   string `json:"updated_at"`
}

// Validate checks a GO's required fields and category.
func (o GovernmentOrder) Validate() error {
	if o.ID == "" || o.OrgUnit == "" {
		return errors.New("government-order: id and org_unit are required")
	}
	if o.Department == "" || o.Subject == "" {
		return errors.New("government-order: department and subject are required")
	}
	if !validGOCategory(o.Category) {
		return errors.New("government-order: category must be policy, financial, establishment, scheme or administrative")
	}
	if o.AmountPaise < 0 {
		return errors.New("government-order: amount cannot be negative")
	}
	if o.Category == "financial" && o.AmountPaise <= 0 {
		return errors.New("government-order: a financial GO must carry a positive amount")
	}
	return nil
}

// applyVetGO records legal vetting — only a draft can be vetted.
func applyVetGO(o GovernmentOrder, by, now string) (GovernmentOrder, error) {
	if o.Status != GODrafted {
		return GovernmentOrder{}, fmt.Errorf("government-order: %s is %s — only a draft can be vetted", o.ID, o.Status)
	}
	if by == "" {
		return GovernmentOrder{}, errors.New("government-order: a vetting officer is required")
	}
	o.VettedBy = by
	o.Status = GOVetted
	o.UpdatedAt = now
	return o, nil
}

// applyApproveGO records competent-authority approval — only a vetted GO can be approved.
func applyApproveGO(o GovernmentOrder, by, now string) (GovernmentOrder, error) {
	if o.Status != GOVetted {
		return GovernmentOrder{}, fmt.Errorf("government-order: %s is %s — must be legally vetted before approval", o.ID, o.Status)
	}
	if by == "" {
		return GovernmentOrder{}, errors.New("government-order: an approving authority is required")
	}
	o.ApprovedBy = by
	o.Status = GOApproved
	o.UpdatedAt = now
	return o, nil
}

// applyIssueGO assigns a gazette number and issues — only an approved GO can be issued, and a number is required.
// (Number uniqueness across live orders is enforced by the Platform method against the store.)
func applyIssueGO(o GovernmentOrder, number, now string) (GovernmentOrder, error) {
	if o.Status != GOApproved {
		return GovernmentOrder{}, fmt.Errorf("government-order: %s is %s — must be approved before issue", o.ID, o.Status)
	}
	if number == "" {
		return GovernmentOrder{}, errors.New("government-order: a gazette number is required to issue")
	}
	o.Number = number
	o.Status = GOIssued
	o.UpdatedAt = now
	return o, nil
}

// applyPublishGO publishes an issued GO to the gazette.
func applyPublishGO(o GovernmentOrder, now string) (GovernmentOrder, error) {
	if o.Status != GOIssued {
		return GovernmentOrder{}, fmt.Errorf("government-order: %s is %s — only an issued GO can be published", o.ID, o.Status)
	}
	o.Status = GOPublished
	o.UpdatedAt = now
	return o, nil
}

// applyWithdrawGO rescinds a GO at any stage except an already-withdrawn one; a reason is mandatory.
func applyWithdrawGO(o GovernmentOrder, reason, now string) (GovernmentOrder, error) {
	if o.Status == GOWithdrawn {
		return GovernmentOrder{}, fmt.Errorf("government-order: %s is already withdrawn", o.ID)
	}
	if reason == "" {
		return GovernmentOrder{}, errors.New("government-order: a withdrawal reason is required")
	}
	o.Reason = reason
	o.Status = GOWithdrawn
	o.UpdatedAt = now
	return o, nil
}

type goFilter struct{ OrgUnit, Status, Category string }

func matchGO(f goFilter, o GovernmentOrder) bool {
	if f.OrgUnit != "" && o.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && o.Status != f.Status {
		return false
	}
	if f.Category != "" && o.Category != f.Category {
		return false
	}
	return true
}

// goStore is the persistence port. *memGOStore and *pgGOStore satisfy it.
type goStore interface {
	Upsert(GovernmentOrder) (GovernmentOrder, error)
	Get(id string) (GovernmentOrder, bool)
	List(goFilter) []GovernmentOrder
}

type memGOStore struct {
	mu sync.Mutex
	m  map[string]GovernmentOrder
}

func newMemGOStore() *memGOStore { return &memGOStore{m: map[string]GovernmentOrder{}} }

func (s *memGOStore) Upsert(o GovernmentOrder) (GovernmentOrder, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[o.ID] = o
	return o, nil
}

func (s *memGOStore) Get(id string) (GovernmentOrder, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	o, ok := s.m[id]
	return o, ok
}

func (s *memGOStore) List(f goFilter) []GovernmentOrder {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]GovernmentOrder, 0, len(s.m))
	for _, o := range s.m {
		if matchGO(f, o) {
			out = append(out, o)
		}
	}
	return out
}

var (
	goOnce sync.Once
	goBack goStore
)

func goState() goStore {
	goOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgGOStore(dsn); err == nil {
				goBack = pg
				log.Printf("government-order: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("government-order: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				goBack = newMemGOStore()
			}
		} else {
			goBack = newMemGOStore()
		}
		seedGO(goBack)
	})
	return goBack
}

func goNow() string { return "2026-06-26T00:00:00Z" }

// goNumberTaken reports the order id holding a live (issued/published) gazette number, excluding excludeID.
func goNumberTaken(number, excludeID string) string {
	for _, o := range goState().List(goFilter{}) {
		if o.ID == excludeID || o.Number != number {
			continue
		}
		if o.Status == GOIssued || o.Status == GOPublished {
			return o.ID
		}
	}
	return ""
}

// DraftGO records a new draft Government Order (status drafted). Audited.
func (p *Platform) DraftGO(o GovernmentOrder) (GovernmentOrder, error) {
	o.Status = GODrafted
	o.Number = ""
	o.VettedBy = ""
	o.ApprovedBy = ""
	o.Reason = ""
	if o.CreatedOn == "" {
		o.CreatedOn = "2026-06-26"
	}
	o.UpdatedAt = goNow()
	if err := o.Validate(); err != nil {
		p.appendAudit("secretariat", "government-order.draft.denied", o.OrgUnit, "deny", err.Error())
		return GovernmentOrder{}, err
	}
	out, err := goState().Upsert(o)
	if err != nil {
		return GovernmentOrder{}, err
	}
	p.appendAudit("secretariat", "government-order.draft", o.ID, "executed", fmt.Sprintf("%s · %s", o.Category, o.Subject))
	return out, nil
}

// VetGO records legal vetting of a draft. Audited.
func (p *Platform) VetGO(id, by string) (GovernmentOrder, error) {
	cur, ok := goState().Get(id)
	if !ok {
		return GovernmentOrder{}, errors.New("government-order: not found")
	}
	out, err := applyVetGO(cur, by, goNow())
	if err != nil {
		p.appendAudit("law-department", "government-order.vet.denied", id, "deny", err.Error())
		return GovernmentOrder{}, err
	}
	if _, err := goState().Upsert(out); err != nil {
		return GovernmentOrder{}, err
	}
	p.appendAudit("law-department", "government-order.vet", id, "executed", by)
	return out, nil
}

// ApproveGO records competent-authority approval of a vetted GO. Audited.
func (p *Platform) ApproveGO(id, by string) (GovernmentOrder, error) {
	cur, ok := goState().Get(id)
	if !ok {
		return GovernmentOrder{}, errors.New("government-order: not found")
	}
	out, err := applyApproveGO(cur, by, goNow())
	if err != nil {
		p.appendAudit("secretary", "government-order.approve.denied", id, "deny", err.Error())
		return GovernmentOrder{}, err
	}
	if _, err := goState().Upsert(out); err != nil {
		return GovernmentOrder{}, err
	}
	p.appendAudit("secretary", "government-order.approve", id, "executed", by)
	return out, nil
}

// IssueGO assigns a gazette number and issues an approved GO — rejecting a duplicate live number. Audited.
func (p *Platform) IssueGO(id, number string) (GovernmentOrder, error) {
	cur, ok := goState().Get(id)
	if !ok {
		return GovernmentOrder{}, errors.New("government-order: not found")
	}
	if other := goNumberTaken(number, id); other != "" {
		err := fmt.Errorf("government-order: gazette number %q is already held by %s", number, other)
		p.appendAudit("secretariat", "government-order.issue.denied", id, "deny", err.Error())
		return GovernmentOrder{}, err
	}
	out, err := applyIssueGO(cur, number, goNow())
	if err != nil {
		p.appendAudit("secretariat", "government-order.issue.denied", id, "deny", err.Error())
		return GovernmentOrder{}, err
	}
	if _, err := goState().Upsert(out); err != nil {
		return GovernmentOrder{}, err
	}
	p.appendAudit("secretariat", "government-order.issue", id, "executed", number)
	return out, nil
}

// PublishGO publishes an issued GO to the gazette. Audited.
func (p *Platform) PublishGO(id string) (GovernmentOrder, error) {
	cur, ok := goState().Get(id)
	if !ok {
		return GovernmentOrder{}, errors.New("government-order: not found")
	}
	out, err := applyPublishGO(cur, goNow())
	if err != nil {
		p.appendAudit("secretariat", "government-order.publish.denied", id, "deny", err.Error())
		return GovernmentOrder{}, err
	}
	if _, err := goState().Upsert(out); err != nil {
		return GovernmentOrder{}, err
	}
	p.appendAudit("secretariat", "government-order.publish", id, "executed", out.Number)
	return out, nil
}

// WithdrawGO rescinds a GO with a reason. Audited.
func (p *Platform) WithdrawGO(id, reason string) (GovernmentOrder, error) {
	cur, ok := goState().Get(id)
	if !ok {
		return GovernmentOrder{}, errors.New("government-order: not found")
	}
	out, err := applyWithdrawGO(cur, reason, goNow())
	if err != nil {
		p.appendAudit("secretariat", "government-order.withdraw.denied", id, "deny", err.Error())
		return GovernmentOrder{}, err
	}
	if _, err := goState().Upsert(out); err != nil {
		return GovernmentOrder{}, err
	}
	p.appendAudit("secretariat", "government-order.withdraw", id, "executed", reason)
	return out, nil
}

// GovernmentOrderRecord returns a single GO by id.
func (p *Platform) GovernmentOrderRecord(id string) (GovernmentOrder, bool) { return goState().Get(id) }

// GovernmentOrderDashboard is the jurisdiction-scoped GO register: counts by status and category, the value of
// live financial GOs, and the in-flight worklist (everything not yet published or withdrawn). Downward scoped.
type GovernmentOrderDashboard struct {
	Scope               string            `json:"scope"`
	Orders              int               `json:"orders"`
	ByStatus            map[string]int    `json:"by_status"`
	ByCategory          map[string]int    `json:"by_category"`
	FinancialValuePaise int64             `json:"financial_value_paise"`
	InFlight            []GovernmentOrder `json:"in_flight,omitempty"`
	Synthetic           bool              `json:"synthetic"`
}

// GovernmentOrderDashboard rolls up GOs across the org units a tenant node governs (fail-closed for others).
func (p *Platform) GovernmentOrderDashboard(scopeOrg string) GovernmentOrderDashboard {
	d := GovernmentOrderDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, ByCategory: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, o := range goState().List(goFilter{}) {
		if !h.Governs(scopeOrg, o.OrgUnit) {
			continue
		}
		d.Orders++
		d.ByStatus[o.Status]++
		d.ByCategory[o.Category]++
		if o.Category == "financial" && (o.Status == GOIssued || o.Status == GOPublished) {
			d.FinancialValuePaise += o.AmountPaise
		}
		if o.Status != GOPublished && o.Status != GOWithdrawn {
			d.InFlight = append(d.InFlight, o)
		}
	}
	sort.Slice(d.InFlight, func(i, j int) bool { return d.InFlight[i].ID < d.InFlight[j].ID })
	return d
}

// ScopedGovernmentOrders lists GOs a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedGovernmentOrders(scopeOrg, status string) []GovernmentOrder {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []GovernmentOrder
	for _, o := range goState().List(goFilter{Status: status}) {
		if h.Governs(scopeOrg, o.OrgUnit) {
			out = append(out, o)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// seedGO plants a GO per pilot school across districts in a spread of lifecycle stages so a district/state
// overseer sees a realistic in-flight register: a published scheme GO, an issued establishment GO, an approved
// financial GO awaiting issue, and a fresh draft. Synthetic SYN- ids only.
func seedGO(s goStore) {
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

		// Published scheme GO.
		pub := GovernmentOrder{
			ID: fmt.Sprintf("GO-%s-SCHEME", tag), OrgUnit: school, Department: "School Education (SE1)", Category: "scheme",
			Subject: "Sanction of the breakfast scheme for the academic year", Status: GODrafted, CreatedOn: "2026-04-02", UpdatedAt: goNow(),
		}
		pub, _ = applyVetGO(pub, "SYN-LAW-01", goNow())
		pub, _ = applyApproveGO(pub, "SYN-SEC-01", goNow())
		pub, _ = applyIssueGO(pub, fmt.Sprintf("G.O.(Ms)No.%d/SE/2026", 100+si), goNow())
		pub, _ = applyPublishGO(pub, goNow())
		s.Upsert(pub)

		// Issued establishment GO (posting), not yet published.
		iss := GovernmentOrder{
			ID: fmt.Sprintf("GO-%s-EST", tag), OrgUnit: school, Department: "School Education (SE2)", Category: "establishment",
			Subject: "Posting and transfer of headmasters — periodic counselling", Status: GODrafted, CreatedOn: "2026-05-12", UpdatedAt: goNow(),
		}
		iss, _ = applyVetGO(iss, "SYN-LAW-02", goNow())
		iss, _ = applyApproveGO(iss, "SYN-SEC-01", goNow())
		iss, _ = applyIssueGO(iss, fmt.Sprintf("G.O.(D)No.%d/SE/2026", 200+si), goNow())
		s.Upsert(iss)

		// Approved financial GO awaiting issue.
		fin := GovernmentOrder{
			ID: fmt.Sprintf("GO-%s-FIN", tag), OrgUnit: school, Department: "School Education (Budget)", Category: "financial",
			Subject: "Release of composite school grant — first instalment", AmountPaise: 4_50_00_000, Status: GODrafted, CreatedOn: "2026-06-08", UpdatedAt: goNow(),
		}
		fin, _ = applyVetGO(fin, "SYN-LAW-01", goNow())
		fin, _ = applyApproveGO(fin, "SYN-SEC-02", goNow())
		s.Upsert(fin)

		// Fresh draft policy GO.
		drf := GovernmentOrder{
			ID: fmt.Sprintf("GO-%s-POL", tag), OrgUnit: school, Department: "School Education (Policy)", Category: "policy",
			Subject: "Adoption of the revised continuous assessment framework", Status: GODrafted, CreatedOn: "2026-06-22", UpdatedAt: goNow(),
		}
		s.Upsert(drf)
	}
}
