package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"
	"sync"
)

// School Sanitation / WASH Register is an L6 welfare-compliance vertical: every school keeps a register of its
// WASH (Water, Sanitation & Hygiene) facilities — separate toilets for girls/boys/CWSN, a drinking-water source
// and handwash stations — and the State certifies a school "Swachh / ODF" only when the critical facilities are
// genuinely functional. It is durable, audited, and enforces two hard invariants server-side:
//   - NO OVER-REPORT: a facility's functional units can never exceed its sanctioned units (you cannot claim more
//     working toilets than exist).
//   - SWACHH CERTIFICATION GATE: a school cannot be certified Swachh while ANY critical category (girls' toilet,
//     drinking water, handwash station) is missing or not fully functional — and recording a regression in a
//     critical line auto-revokes an existing certificate so the register can never lie about ODF status.
// Facility lines are embedded on the per-school register (like hostel residents). Downward-governance scoped.
// Synthetic SYN- ids only, never real PII.

// Register status.
const (
	WashRegistered = "registered"
	WashCertified  = "certified"
)

// washCriticalCategories must each be fully functional for a Swachh certificate (Swachh Vidyalaya / ODF norm).
var washCriticalCategories = []string{"girls_toilet", "drinking_water", "handwash_station"}

func validWashCategory(c string) bool {
	switch c {
	case "girls_toilet", "boys_toilet", "cwsn_toilet", "drinking_water", "handwash_station":
		return true
	}
	return false
}

// WashFacility is one WASH facility line (a category with its sanctioned vs functional unit counts).
type WashFacility struct {
	Category        string `json:"category"`
	SanctionedUnits int    `json:"sanctioned_units"`
	FunctionalUnits int    `json:"functional_units"`
	LastInspected   string `json:"last_inspected,omitempty"`
}

// FacilityStatus derives a line's condition from its unit counts (never free-set).
func (f WashFacility) FacilityStatus() string {
	switch {
	case f.SanctionedUnits == 0:
		return "none"
	case f.FunctionalUnits <= 0:
		return "non_functional"
	case f.FunctionalUnits >= f.SanctionedUnits:
		return "functional"
	default:
		return "partial"
	}
}

func (f WashFacility) fullyFunctional() bool {
	return f.SanctionedUnits >= 1 && f.FunctionalUnits >= f.SanctionedUnits
}

// WashRegister is one school's WASH register with its facility lines and Swachh-certification state.
type WashRegister struct {
	ID          string         `json:"id"`
	OrgUnit     string         `json:"org_unit"` // the school (T6 tenancy node)
	SchoolName  string         `json:"school_name"`
	Facilities  []WashFacility `json:"facilities,omitempty"`
	Certified   bool           `json:"certified"`
	CertifiedOn string         `json:"certified_on,omitempty"`
	Status      string         `json:"status"`
	CreatedOn   string         `json:"created_on"`
	UpdatedAt   string         `json:"updated_at"`
}

// Validate checks a register's required fields.
func (w WashRegister) Validate() error {
	if w.ID == "" || w.OrgUnit == "" {
		return errors.New("wash: id and org_unit are required")
	}
	if w.SchoolName == "" {
		return errors.New("wash: a school_name is required")
	}
	return nil
}

func (w WashRegister) facilityIndex(category string) int {
	for i := range w.Facilities {
		if w.Facilities[i].Category == category {
			return i
		}
	}
	return -1
}

// criticalBlockers lists the critical categories that are missing or not fully functional (empty == Swachh-eligible).
func (w WashRegister) criticalBlockers() []string {
	var out []string
	for _, cat := range washCriticalCategories {
		idx := w.facilityIndex(cat)
		if idx < 0 || !w.Facilities[idx].fullyFunctional() {
			out = append(out, cat)
		}
	}
	return out
}

// applyRecordFacility upserts a facility line, rejecting an over-report. If the change regresses a critical line,
// an existing Swachh certificate is auto-revoked so the register cannot claim ODF status it no longer meets.
func applyRecordFacility(w WashRegister, f WashFacility, now string) (WashRegister, error) {
	if !validWashCategory(f.Category) {
		return WashRegister{}, errors.New("wash: category must be one of girls_toilet, boys_toilet, cwsn_toilet, drinking_water, handwash_station")
	}
	if f.SanctionedUnits < 1 {
		return WashRegister{}, errors.New("wash: sanctioned_units must be at least 1")
	}
	if f.FunctionalUnits < 0 {
		return WashRegister{}, errors.New("wash: functional_units must be non-negative")
	}
	if f.FunctionalUnits > f.SanctionedUnits {
		return WashRegister{}, fmt.Errorf("wash: over-report — %d functional cannot exceed %d sanctioned for %s", f.FunctionalUnits, f.SanctionedUnits, f.Category)
	}
	f.LastInspected = "2026-06-25"
	if idx := w.facilityIndex(f.Category); idx >= 0 {
		w.Facilities[idx] = f
	} else {
		w.Facilities = append(w.Facilities, f)
	}
	if w.Certified && len(w.criticalBlockers()) > 0 {
		w.Certified = false
		w.CertifiedOn = ""
		w.Status = WashRegistered
	}
	w.UpdatedAt = now
	return w, nil
}

// applyCertifySwachh certifies the school Swachh — rejected while any critical category is not fully functional.
func applyCertifySwachh(w WashRegister, now string) (WashRegister, error) {
	if blockers := w.criticalBlockers(); len(blockers) > 0 {
		return WashRegister{}, fmt.Errorf("wash: cannot certify %s Swachh — not functional: %s", w.OrgUnit, strings.Join(blockers, ", "))
	}
	w.Certified = true
	w.CertifiedOn = "2026-06-25"
	w.Status = WashCertified
	w.UpdatedAt = now
	return w, nil
}

type washFilter struct{ OrgUnit, Status string }

func matchWash(f washFilter, w WashRegister) bool {
	if f.OrgUnit != "" && w.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && w.Status != f.Status {
		return false
	}
	return true
}

// washStore is the persistence port. *memWashStore and *pgWashStore satisfy it.
type washStore interface {
	Upsert(WashRegister) (WashRegister, error)
	Get(id string) (WashRegister, bool)
	List(washFilter) []WashRegister
}

type memWashStore struct {
	mu sync.Mutex
	m  map[string]WashRegister
}

func newMemWashStore() *memWashStore { return &memWashStore{m: map[string]WashRegister{}} }

func (s *memWashStore) Upsert(w WashRegister) (WashRegister, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[w.ID] = w
	return w, nil
}

func (s *memWashStore) Get(id string) (WashRegister, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	w, ok := s.m[id]
	return w, ok
}

func (s *memWashStore) List(f washFilter) []WashRegister {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]WashRegister, 0, len(s.m))
	for _, w := range s.m {
		if matchWash(f, w) {
			out = append(out, w)
		}
	}
	return out
}

var (
	washOnce sync.Once
	washBack washStore
)

func washState() washStore {
	washOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgWashStore(dsn); err == nil {
				washBack = pg
				log.Printf("wash: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("wash: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				washBack = newMemWashStore()
			}
		} else {
			washBack = newMemWashStore()
		}
		seedWash(washBack)
	})
	return washBack
}

func washNow() string { return "2026-06-25T00:00:00Z" }

// RegisterSchoolWash opens a school's WASH register (status registered). Audited.
func (p *Platform) RegisterSchoolWash(w WashRegister) (WashRegister, error) {
	w.Status = WashRegistered
	w.Certified = false
	w.CertifiedOn = ""
	if w.CreatedOn == "" {
		w.CreatedOn = "2026-06-25"
	}
	w.UpdatedAt = washNow()
	if err := w.Validate(); err != nil {
		p.appendAudit("wash-officer", "wash.register.denied", w.OrgUnit, "deny", err.Error())
		return WashRegister{}, err
	}
	out, err := washState().Upsert(w)
	if err != nil {
		return WashRegister{}, err
	}
	p.appendAudit("wash-officer", "wash.register", w.ID, "executed", w.SchoolName)
	return out, nil
}

// RecordWashFacility records an inspected facility line — rejecting an over-report. Audited.
func (p *Platform) RecordWashFacility(id string, f WashFacility) (WashRegister, error) {
	cur, ok := washState().Get(id)
	if !ok {
		return WashRegister{}, errors.New("wash: register not found")
	}
	out, err := applyRecordFacility(cur, f, washNow())
	if err != nil {
		p.appendAudit("wash-officer", "wash.record.denied", id, "deny", err.Error())
		return WashRegister{}, err
	}
	if _, err := washState().Upsert(out); err != nil {
		return WashRegister{}, err
	}
	p.appendAudit("wash-officer", "wash.record", id, "executed", fmt.Sprintf("%s %d/%d", f.Category, f.FunctionalUnits, f.SanctionedUnits))
	return out, nil
}

// CertifySwachh certifies a school Swachh — rejected while any critical category is not fully functional. Audited.
func (p *Platform) CertifySwachh(id string) (WashRegister, error) {
	cur, ok := washState().Get(id)
	if !ok {
		return WashRegister{}, errors.New("wash: register not found")
	}
	out, err := applyCertifySwachh(cur, washNow())
	if err != nil {
		p.appendAudit("wash-officer", "wash.certify.denied", id, "deny", err.Error())
		return WashRegister{}, err
	}
	if _, err := washState().Upsert(out); err != nil {
		return WashRegister{}, err
	}
	p.appendAudit("wash-officer", "wash.certify", id, "executed", "Swachh certified")
	return out, nil
}

// WashRecord returns a single register by id.
func (p *Platform) WashRecord(id string) (WashRegister, bool) { return washState().Get(id) }

// WashDashboard is the jurisdiction-scoped sanitation picture: schools, certified count, facility/unit totals,
// the functional-unit rate, functional units by category, and the not-yet-certified worklist with blockers.
// Downward-governance scoped.
type WashDashboard struct {
	Scope                string         `json:"scope"`
	Schools              int            `json:"schools"`
	Certified            int            `json:"certified"`
	Facilities           int            `json:"facilities"`
	SanctionedUnits      int            `json:"sanctioned_units"`
	FunctionalUnits      int            `json:"functional_units"`
	FunctionalPct        float64        `json:"functional_pct"`
	ByCategoryFunctional map[string]int `json:"by_category_functional"`
	Pending              []WashRegister `json:"pending,omitempty"`
	Synthetic            bool           `json:"synthetic"`
}

// WashDashboard rolls up registers across the schools a tenant node governs (fail-closed for others).
func (p *Platform) WashDashboard(scopeOrg string) WashDashboard {
	d := WashDashboard{Scope: scopeOrg, ByCategoryFunctional: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, w := range washState().List(washFilter{}) {
		if !h.Governs(scopeOrg, w.OrgUnit) {
			continue
		}
		d.Schools++
		if w.Certified {
			d.Certified++
		}
		for _, f := range w.Facilities {
			d.Facilities++
			d.SanctionedUnits += f.SanctionedUnits
			d.FunctionalUnits += f.FunctionalUnits
			d.ByCategoryFunctional[f.Category] += f.FunctionalUnits
		}
		if !w.Certified {
			d.Pending = append(d.Pending, w)
		}
	}
	if d.SanctionedUnits > 0 {
		d.FunctionalPct = float64(d.FunctionalUnits) / float64(d.SanctionedUnits) * 100
	}
	sort.Slice(d.Pending, func(i, j int) bool { return d.Pending[i].ID < d.Pending[j].ID })
	return d
}

// ScopedWashRegisters lists registers a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedWashRegisters(scopeOrg, status string) []WashRegister {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []WashRegister
	for _, w := range washState().List(washFilter{Status: status}) {
		if h.Governs(scopeOrg, w.OrgUnit) {
			out = append(out, w)
		}
	}
	return out
}

// seedWash plants a WASH register per school across more than one district: the first is fully functional and
// certified Swachh; the others each carry a critical-category gap so the blockers worklist has signal. Synthetic.
func seedWash(s washStore) {
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
		w := WashRegister{
			ID: fmt.Sprintf("WASH-%s", tag), OrgUnit: school, SchoolName: fmt.Sprintf("Govt School %s", tag),
			Status: WashRegistered, CreatedOn: "2026-06-01", UpdatedAt: washNow(),
		}
		// Baseline lines: all schools have sanctioned toilets/water/handwash; functional counts vary by school.
		lines := []WashFacility{
			{Category: "girls_toilet", SanctionedUnits: 6, FunctionalUnits: 6},
			{Category: "boys_toilet", SanctionedUnits: 6, FunctionalUnits: 5},
			{Category: "cwsn_toilet", SanctionedUnits: 2, FunctionalUnits: 2},
			{Category: "drinking_water", SanctionedUnits: 3, FunctionalUnits: 3},
			{Category: "handwash_station", SanctionedUnits: 8, FunctionalUnits: 8},
		}
		switch si {
		case 1:
			lines[3].FunctionalUnits = 1 // drinking water partly broken → blocks Swachh
		case 2:
			lines[0].FunctionalUnits = 4 // girls' toilet partial → blocks Swachh
		case 3:
			lines[4].FunctionalUnits = 0 // handwash non-functional → blocks Swachh
		}
		for _, ln := range lines {
			if out, err := applyRecordFacility(w, ln, washNow()); err == nil {
				w = out
			}
		}
		if si == 0 {
			if out, err := applyCertifySwachh(w, washNow()); err == nil {
				w = out
			}
		}
		s.Upsert(w)
	}
}
