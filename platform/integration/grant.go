package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
)

// School Grant Utilisation is an L11 money-grade vertical: a school receives a grant allocation under a head
// (composite / library / sports / maintenance), and expenditures are booked against it. The cardinal invariant
// is NO OVER-SPEND — cumulative expenditure can never exceed the allocation. Money is in paise. Durable to
// PostgreSQL; downward-governance scoped. Synthetic ids only, never real PII.

// Grant heads.
const (
	GrantComposite   = "composite"
	GrantLibrary     = "library"
	GrantSports      = "sports"
	GrantMaintenance = "maintenance"
)

// Grant status.
const (
	GrantOpen   = "open"
	GrantClosed = "closed"
)

func validGrantHead(h string) bool {
	switch h {
	case GrantComposite, GrantLibrary, GrantSports, GrantMaintenance:
		return true
	}
	return false
}

// Grant is a single grant allocation to a school, with a running spent total.
type Grant struct {
	ID             string `json:"id"`
	OrgUnit        string `json:"org_unit"` // the school (T6 tenancy node)
	Head           string `json:"head"`
	AllocatedPaise int64  `json:"allocated_paise"`
	SpentPaise     int64  `json:"spent_paise"`
	Year           int    `json:"year"`
	Status         string `json:"status"`
	UpdatedAt      string `json:"updated_at"`
}

// BalancePaise is the unspent balance.
func (g Grant) BalancePaise() int64 { return g.AllocatedPaise - g.SpentPaise }

// Validate checks a grant allocation's required fields, head and amount.
func (g Grant) Validate() error {
	if g.ID == "" || g.OrgUnit == "" {
		return errors.New("grant: id and org_unit are required")
	}
	if !validGrantHead(g.Head) {
		return errors.New("grant: invalid head " + g.Head)
	}
	if g.AllocatedPaise <= 0 {
		return errors.New("grant: allocated_paise must be positive")
	}
	return nil
}

type grantFilter struct{ OrgUnit, Head, Status string }

func matchGrant(f grantFilter, g Grant) bool {
	if f.OrgUnit != "" && g.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Head != "" && g.Head != f.Head {
		return false
	}
	if f.Status != "" && g.Status != f.Status {
		return false
	}
	return true
}

// grantStore is the persistence port. *memGrantStore and *pgGrantStore satisfy it.
type grantStore interface {
	Upsert(Grant) (Grant, error)
	Get(id string) (Grant, bool)
	List(grantFilter) []Grant
}

type memGrantStore struct {
	mu sync.Mutex
	m  map[string]Grant
}

func newMemGrantStore() *memGrantStore { return &memGrantStore{m: map[string]Grant{}} }

func (s *memGrantStore) Upsert(g Grant) (Grant, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[g.ID] = g
	return g, nil
}

func (s *memGrantStore) Get(id string) (Grant, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	g, ok := s.m[id]
	return g, ok
}

func (s *memGrantStore) List(f grantFilter) []Grant {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Grant, 0, len(s.m))
	for _, g := range s.m {
		if matchGrant(f, g) {
			out = append(out, g)
		}
	}
	return out
}

var (
	grantOnce sync.Once
	grantBack grantStore
)

func grantState() grantStore {
	grantOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgGrantStore(dsn); err == nil {
				grantBack = pg
				log.Printf("grant: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("grant: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				grantBack = newMemGrantStore()
			}
		} else {
			grantBack = newMemGrantStore()
		}
		seedGrant(grantBack)
	})
	return grantBack
}

func grantNow() string { return "2026-06-22T00:00:00Z" }

// AllocateGrant records a grant allocation to a school. Audited.
func (p *Platform) AllocateGrant(g Grant) (Grant, error) {
	g.SpentPaise = 0
	g.Status = GrantOpen
	g.UpdatedAt = grantNow()
	if err := g.Validate(); err != nil {
		p.appendAudit("finance", "grant.allocate.denied", g.OrgUnit, "deny", err.Error())
		return Grant{}, err
	}
	out, err := grantState().Upsert(g)
	if err != nil {
		return Grant{}, err
	}
	p.appendAudit("finance", "grant.allocate", g.ID, "executed", fmt.Sprintf("%s %dp", g.Head, g.AllocatedPaise))
	return out, nil
}

// BookExpenditure books spending against a grant, rejecting any amount that would over-spend the allocation.
// Audited (with the purpose).
func (p *Platform) BookExpenditure(id string, amountPaise int64, purpose string) (Grant, error) {
	g, ok := grantState().Get(id)
	if !ok {
		return Grant{}, errors.New("grant: not found")
	}
	if g.Status != GrantOpen {
		return Grant{}, errors.New("grant: only an open grant can be spent against")
	}
	if amountPaise <= 0 {
		return Grant{}, errors.New("grant: expenditure must be a positive amount")
	}
	if g.SpentPaise+amountPaise > g.AllocatedPaise {
		err := fmt.Errorf("grant: expenditure of %dp would over-spend %s — remaining %dp", amountPaise, g.ID, g.BalancePaise())
		p.appendAudit("finance", "grant.spend.denied", g.ID, "deny", err.Error())
		return Grant{}, err
	}
	g.SpentPaise += amountPaise
	g.UpdatedAt = grantNow()
	out, err := grantState().Upsert(g)
	if err != nil {
		return Grant{}, err
	}
	p.appendAudit("finance", "grant.spend", g.ID, "executed", fmt.Sprintf("%dp — %s", amountPaise, purpose))
	return out, nil
}

// CloseGrant closes an open grant (no further expenditure). Audited.
func (p *Platform) CloseGrant(id string) (Grant, error) {
	g, ok := grantState().Get(id)
	if !ok {
		return Grant{}, errors.New("grant: not found")
	}
	if g.Status != GrantOpen {
		return Grant{}, errors.New("grant: only an open grant can be closed")
	}
	g.Status = GrantClosed
	g.UpdatedAt = grantNow()
	out, err := grantState().Upsert(g)
	if err != nil {
		return Grant{}, err
	}
	p.appendAudit("finance", "grant.close", g.ID, "executed", fmt.Sprintf("utilised %dp of %dp", g.SpentPaise, g.AllocatedPaise))
	return out, nil
}

// GrantRecord returns a single grant by id.
func (p *Platform) GrantRecord(id string) (Grant, bool) { return grantState().Get(id) }

// GrantDashboard is the jurisdiction-scoped utilisation picture: allocated vs spent vs balance (paise), by-head,
// average utilisation, and the low-utilisation roster. Downward-governance scoped.
type GrantDashboard struct {
	Scope          string           `json:"scope"`
	Grants         int              `json:"grants"`
	AllocatedPaise int64            `json:"allocated_paise"`
	SpentPaise     int64            `json:"spent_paise"`
	BalancePaise   int64            `json:"balance_paise"`
	UtilisationPct float64          `json:"utilisation_pct"`
	ByHead         map[string]int64 `json:"by_head_allocated"`
	LowUtilisation []Grant          `json:"low_utilisation,omitempty"` // < 50% utilised
	Synthetic      bool             `json:"synthetic"`
}

// GrantDashboard rolls up grant utilisation across the schools a tenant node governs (fail-closed for others).
func (p *Platform) GrantDashboard(scopeOrg string) GrantDashboard {
	d := GrantDashboard{Scope: scopeOrg, ByHead: map[string]int64{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, g := range grantState().List(grantFilter{}) {
		if !h.Governs(scopeOrg, g.OrgUnit) {
			continue
		}
		d.Grants++
		d.AllocatedPaise += g.AllocatedPaise
		d.SpentPaise += g.SpentPaise
		d.ByHead[g.Head] += g.AllocatedPaise
		if g.AllocatedPaise > 0 && float64(g.SpentPaise)/float64(g.AllocatedPaise) < 0.5 {
			d.LowUtilisation = append(d.LowUtilisation, g)
		}
	}
	d.BalancePaise = d.AllocatedPaise - d.SpentPaise
	if d.AllocatedPaise > 0 {
		d.UtilisationPct = float64(d.SpentPaise) * 100 / float64(d.AllocatedPaise)
	}
	return d
}

// ScopedGrants lists grants a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedGrants(scopeOrg, status string) []Grant {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []Grant
	for _, g := range grantState().List(grantFilter{Status: status}) {
		if h.Governs(scopeOrg, g.OrgUnit) {
			out = append(out, g)
		}
	}
	return out
}

// seedGrant plants grant allocations across several schools over more than one district, partly spent, with one
// low-utilisation school per district. Amounts in paise (Rs 1 = 100 paise).
func seedGrant(s grantStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	type alloc struct {
		head      string
		allocated int64
		spent     int64
	}
	allocs := []alloc{
		{GrantComposite, 5000000, 3500000},   // Rs 50,000 — 70% utilised
		{GrantLibrary, 2000000, 400000},      // Rs 20,000 — 20% utilised (low)
		{GrantMaintenance, 3000000, 2700000}, // Rs 30,000 — 90% utilised
	}
	for si, school := range schools {
		tag := schoolTag(si)
		for ai, a := range allocs {
			id := fmt.Sprintf("GR-%s-%02d", tag, ai+1)
			g := Grant{
				ID: id, OrgUnit: school, Head: a.head, AllocatedPaise: a.allocated,
				SpentPaise: 0, Year: 2026, Status: GrantOpen, UpdatedAt: grantNow(),
			}
			if _, err := s.Upsert(g); err != nil {
				continue
			}
			if a.spent > 0 {
				g.SpentPaise = a.spent
				s.Upsert(g)
			}
		}
	}
}
