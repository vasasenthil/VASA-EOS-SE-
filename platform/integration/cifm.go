package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
)

// CIFM — Campus Infrastructure & Facilities Management is an L6 operations vertical: each campus facility
// (building/lab/toilet/water/electrical/ground) is tracked with its condition, AMC, and a work-order lifecycle.
// It is durable, audited, and enforces a hard SAFETY invariant server-side:
//   - A facility CANNOT be returned to OPERATIONAL while it has an OPEN CRITICAL work order; and raising a
//     CRITICAL work order auto-flips the facility to under_maintenance (a campus can't run a known-unsafe block).
// Work orders are embedded (raise → in-progress → done). Distinct from the Estate & Asset Register (which is the
// asset inventory + decommission gate) — CIFM is the facilities-operations/maintenance plane. Downward-scoped.
// Synthetic ids only, never real PII.

// Facility status.
const (
	FacilityOperational = "operational"
	FacilityMaintenance = "under_maintenance"
	FacilityClosed      = "closed"
)

// Work-order status.
const (
	WorkOrderOpen       = "open"
	WorkOrderInProgress = "in_progress"
	WorkOrderDone       = "done"
)

func validFacilityCategory(c string) bool {
	switch c {
	case "building", "lab", "toilet", "water", "electrical", "ground":
		return true
	}
	return false
}

func validWorkOrderPriority(p string) bool {
	switch p {
	case "low", "medium", "high", "critical":
		return true
	}
	return false
}

// WorkOrder is a single maintenance task against a facility.
type WorkOrder struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Priority string `json:"priority"` // low | medium | high | critical
	Status   string `json:"status"`   // open | in_progress | done
	RaisedOn string `json:"raised_on"`
	ClosedOn string `json:"closed_on,omitempty"`
}

func (w WorkOrder) openCritical() bool {
	return w.Priority == "critical" && w.Status != WorkOrderDone
}

// Facility is one managed campus facility with its work orders.
type Facility struct {
	ID         string      `json:"id"`
	OrgUnit    string      `json:"org_unit"` // the school (T6 tenancy node)
	Name       string      `json:"name"`
	Category   string      `json:"category"`
	Condition  string      `json:"condition"` // good | fair | poor | critical
	Status     string      `json:"status"`
	AMCVendor  string      `json:"amc_vendor,omitempty"`
	AMCExpiry  string      `json:"amc_expiry,omitempty"`
	WorkOrders []WorkOrder `json:"work_orders,omitempty"`
	CreatedOn  string      `json:"created_on"`
	UpdatedAt  string      `json:"updated_at"`
}

// Validate checks a facility's required fields.
func (f Facility) Validate() error {
	if f.ID == "" || f.OrgUnit == "" {
		return errors.New("cifm: id and org_unit are required")
	}
	if f.Name == "" {
		return errors.New("cifm: a name is required")
	}
	if !validFacilityCategory(f.Category) {
		return errors.New("cifm: category must be building, lab, toilet, water, electrical or ground")
	}
	return nil
}

// hasOpenCritical reports whether the facility has any open/in-progress CRITICAL work order.
func (f Facility) hasOpenCritical() bool {
	for _, w := range f.WorkOrders {
		if w.openCritical() {
			return true
		}
	}
	return false
}

// openWorkOrders counts work orders not yet done.
func (f Facility) openWorkOrders() int {
	n := 0
	for _, w := range f.WorkOrders {
		if w.Status != WorkOrderDone {
			n++
		}
	}
	return n
}

// applyRaiseWorkOrder appends a work order; a CRITICAL one auto-flips the facility to under_maintenance.
func applyRaiseWorkOrder(f Facility, w WorkOrder, now string) (Facility, error) {
	if f.Status == FacilityClosed {
		return Facility{}, errors.New("cifm: cannot raise a work order on a closed facility")
	}
	if w.Title == "" {
		return Facility{}, errors.New("cifm: a work-order title is required")
	}
	if !validWorkOrderPriority(w.Priority) {
		return Facility{}, errors.New("cifm: priority must be low, medium, high or critical")
	}
	if w.ID == "" {
		w.ID = fmt.Sprintf("%s-WO%02d", f.ID, len(f.WorkOrders)+1)
	}
	w.Status = WorkOrderOpen
	w.RaisedOn = "2026-06-25"
	f.WorkOrders = append(f.WorkOrders, w)
	if w.Priority == "critical" {
		f.Status = FacilityMaintenance
	}
	f.UpdatedAt = now
	return f, nil
}

// applyCompleteWorkOrder marks a work order done.
func applyCompleteWorkOrder(f Facility, woID, now string) (Facility, error) {
	for i := range f.WorkOrders {
		if f.WorkOrders[i].ID == woID {
			if f.WorkOrders[i].Status == WorkOrderDone {
				return Facility{}, errors.New("cifm: work order already completed")
			}
			f.WorkOrders[i].Status = WorkOrderDone
			f.WorkOrders[i].ClosedOn = "2026-06-25"
			f.UpdatedAt = now
			return f, nil
		}
	}
	return Facility{}, errors.New("cifm: work order not found")
}

// applySetOperational returns a facility to operational — REJECTED while an open critical work order exists.
func applySetOperational(f Facility, now string) (Facility, error) {
	if f.Status == FacilityClosed {
		return Facility{}, errors.New("cifm: a closed facility cannot be reopened")
	}
	if f.hasOpenCritical() {
		return Facility{}, errors.New("cifm: cannot return to operational — an open CRITICAL work order remains (safety gate)")
	}
	f.Status = FacilityOperational
	f.UpdatedAt = now
	return f, nil
}

// applyCloseFacility closes a facility (decommission) — only when no work orders are open.
func applyCloseFacility(f Facility, now string) (Facility, error) {
	if f.openWorkOrders() > 0 {
		return Facility{}, fmt.Errorf("cifm: cannot close %s — %d work order(s) still open", f.ID, f.openWorkOrders())
	}
	f.Status = FacilityClosed
	f.UpdatedAt = now
	return f, nil
}

type facilityFilter struct{ OrgUnit, Category, Status string }

func matchFacility(ff facilityFilter, f Facility) bool {
	if ff.OrgUnit != "" && f.OrgUnit != ff.OrgUnit {
		return false
	}
	if ff.Category != "" && f.Category != ff.Category {
		return false
	}
	if ff.Status != "" && f.Status != ff.Status {
		return false
	}
	return true
}

// facilityStore is the persistence port. *memFacilityStore and *pgFacilityStore satisfy it.
type facilityStore interface {
	Upsert(Facility) (Facility, error)
	Get(id string) (Facility, bool)
	List(facilityFilter) []Facility
}

type memFacilityStore struct {
	mu sync.Mutex
	m  map[string]Facility
}

func newMemFacilityStore() *memFacilityStore { return &memFacilityStore{m: map[string]Facility{}} }

func (s *memFacilityStore) Upsert(f Facility) (Facility, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[f.ID] = f
	return f, nil
}

func (s *memFacilityStore) Get(id string) (Facility, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	f, ok := s.m[id]
	return f, ok
}

func (s *memFacilityStore) List(ff facilityFilter) []Facility {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Facility, 0, len(s.m))
	for _, f := range s.m {
		if matchFacility(ff, f) {
			out = append(out, f)
		}
	}
	return out
}

var (
	cifmOnce sync.Once
	cifmBack facilityStore
)

func cifmState() facilityStore {
	cifmOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgFacilityStore(dsn); err == nil {
				cifmBack = pg
				log.Printf("cifm: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("cifm: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				cifmBack = newMemFacilityStore()
			}
		} else {
			cifmBack = newMemFacilityStore()
		}
		seedCifm(cifmBack)
	})
	return cifmBack
}

func cifmNow() string { return "2026-06-25T00:00:00Z" }

// RegisterFacility records a new facility (status operational). Audited.
func (p *Platform) RegisterFacility(f Facility) (Facility, error) {
	f.Status = FacilityOperational
	f.WorkOrders = nil
	if f.Condition == "" {
		f.Condition = "good"
	}
	if f.CreatedOn == "" {
		f.CreatedOn = "2026-06-25"
	}
	f.UpdatedAt = cifmNow()
	if err := f.Validate(); err != nil {
		p.appendAudit("estate-officer", "cifm.register.denied", f.OrgUnit, "deny", err.Error())
		return Facility{}, err
	}
	out, err := cifmState().Upsert(f)
	if err != nil {
		return Facility{}, err
	}
	p.appendAudit("estate-officer", "cifm.register", f.ID, "executed", fmt.Sprintf("%s (%s)", f.Name, f.Category))
	return out, nil
}

// RaiseWorkOrder appends a work order; a critical one flips the facility to under_maintenance. Audited.
func (p *Platform) RaiseWorkOrder(facilityID string, w WorkOrder) (Facility, error) {
	cur, ok := cifmState().Get(facilityID)
	if !ok {
		return Facility{}, errors.New("cifm: facility not found")
	}
	out, err := applyRaiseWorkOrder(cur, w, cifmNow())
	if err != nil {
		p.appendAudit("estate-officer", "cifm.workorder.denied", facilityID, "deny", err.Error())
		return Facility{}, err
	}
	if _, err := cifmState().Upsert(out); err != nil {
		return Facility{}, err
	}
	p.appendAudit("estate-officer", "cifm.workorder.raise", facilityID, "executed", fmt.Sprintf("%s (%s)", w.Title, w.Priority))
	return out, nil
}

// CompleteWorkOrder marks a work order done. Audited.
func (p *Platform) CompleteWorkOrder(facilityID, woID string) (Facility, error) {
	cur, ok := cifmState().Get(facilityID)
	if !ok {
		return Facility{}, errors.New("cifm: facility not found")
	}
	out, err := applyCompleteWorkOrder(cur, woID, cifmNow())
	if err != nil {
		p.appendAudit("estate-officer", "cifm.workorder.complete.denied", facilityID, "deny", err.Error())
		return Facility{}, err
	}
	if _, err := cifmState().Upsert(out); err != nil {
		return Facility{}, err
	}
	p.appendAudit("estate-officer", "cifm.workorder.complete", woID, "executed", "done")
	return out, nil
}

// SetFacilityOperational returns a facility to operational — rejected while an open critical work order exists. Audited.
func (p *Platform) SetFacilityOperational(facilityID string) (Facility, error) {
	cur, ok := cifmState().Get(facilityID)
	if !ok {
		return Facility{}, errors.New("cifm: facility not found")
	}
	out, err := applySetOperational(cur, cifmNow())
	if err != nil {
		p.appendAudit("estate-officer", "cifm.operational.denied", facilityID, "deny", err.Error())
		return Facility{}, err
	}
	if _, err := cifmState().Upsert(out); err != nil {
		return Facility{}, err
	}
	p.appendAudit("estate-officer", "cifm.operational", facilityID, "executed", "operational")
	return out, nil
}

// CloseFacility closes a facility (no open work orders). Audited.
func (p *Platform) CloseFacility(facilityID string) (Facility, error) {
	cur, ok := cifmState().Get(facilityID)
	if !ok {
		return Facility{}, errors.New("cifm: facility not found")
	}
	out, err := applyCloseFacility(cur, cifmNow())
	if err != nil {
		p.appendAudit("estate-officer", "cifm.close.denied", facilityID, "deny", err.Error())
		return Facility{}, err
	}
	if _, err := cifmState().Upsert(out); err != nil {
		return Facility{}, err
	}
	p.appendAudit("estate-officer", "cifm.close", facilityID, "executed", "closed")
	return out, nil
}

// FacilityRecord returns a single facility by id.
func (p *Platform) FacilityRecord(id string) (Facility, bool) { return cifmState().Get(id) }

// CifmDashboard is the jurisdiction-scoped facilities picture: facility counts by category/condition/status, open
// work orders, the critical-open count, and the needs-attention worklist (open critical). Downward-scoped.
type CifmDashboard struct {
	Scope            string         `json:"scope"`
	Facilities       int            `json:"facilities"`
	ByCategory       map[string]int `json:"by_category"`
	ByStatus         map[string]int `json:"by_status"`
	ByCondition      map[string]int `json:"by_condition"`
	OpenWorkOrders   int            `json:"open_work_orders"`
	CriticalOpen     int            `json:"critical_open"`
	UnderMaintenance int            `json:"under_maintenance"`
	NeedsAttention   []Facility     `json:"needs_attention,omitempty"`
	Synthetic        bool           `json:"synthetic"`
}

// CifmDashboard rolls up facilities across the schools a tenant node governs (fail-closed for others).
func (p *Platform) CifmDashboard(scopeOrg string) CifmDashboard {
	d := CifmDashboard{Scope: scopeOrg, ByCategory: map[string]int{}, ByStatus: map[string]int{}, ByCondition: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, f := range cifmState().List(facilityFilter{}) {
		if !h.Governs(scopeOrg, f.OrgUnit) {
			continue
		}
		d.Facilities++
		d.ByCategory[f.Category]++
		d.ByStatus[f.Status]++
		d.ByCondition[f.Condition]++
		d.OpenWorkOrders += f.openWorkOrders()
		if f.Status == FacilityMaintenance {
			d.UnderMaintenance++
		}
		if f.hasOpenCritical() {
			d.CriticalOpen++
			d.NeedsAttention = append(d.NeedsAttention, f)
		}
	}
	return d
}

// ScopedFacilities lists facilities a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedFacilities(scopeOrg, status string) []Facility {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []Facility
	for _, f := range cifmState().List(facilityFilter{Status: status}) {
		if h.Governs(scopeOrg, f.OrgUnit) {
			out = append(out, f)
		}
	}
	return out
}

// seedCifm plants a handful of facilities per school across more than one district, one carrying an open CRITICAL
// work order (so the facility sits under_maintenance and the safety gate is exercisable). Synthetic ids only.
func seedCifm(s facilityStore) {
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
		specs := []struct {
			cat, cond, name string
			critical        bool
		}{
			{"building", "fair", "Main Block", false},
			{"toilet", "poor", "Girls' Toilet Block", true}, // open critical → under_maintenance
			{"water", "good", "RO Drinking-Water Unit", false},
			{"electrical", "good", "Main Distribution Board", false},
		}
		for ci, sp := range specs {
			f := Facility{
				ID: fmt.Sprintf("FAC-%s-%02d", tag, ci+1), OrgUnit: school, Name: sp.name, Category: sp.cat,
				Condition: sp.cond, Status: FacilityOperational, AMCVendor: "SYN-AMC-" + tag, AMCExpiry: "2027-03-31",
				CreatedOn: "2026-06-01", UpdatedAt: cifmNow(),
			}
			s.Upsert(f)
			if sp.critical {
				if out, err := applyRaiseWorkOrder(f, WorkOrder{Title: "Sewage overflow — health hazard", Priority: "critical"}, cifmNow()); err == nil {
					s.Upsert(out)
				}
			} else if ci == 0 {
				if out, err := applyRaiseWorkOrder(f, WorkOrder{Title: "Repaint corridor", Priority: "low"}, cifmNow()); err == nil {
					s.Upsert(out)
				}
			}
		}
	}
}
