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

// Vehicle Fitness / Transport-Safety is an L6 transport-compliance vertical: every school vehicle keeps a register
// of statutory documents (fitness certificate, insurance, permit, PUC, driver licence) and is cleared for service
// only when all of them are valid — the gate that keeps unsafe buses off the road. It is durable, audited, and
// enforces two hard invariants server-side:
//   - ROADWORTHINESS (CLEARANCE) GATE: a vehicle cannot be cleared for service while any required document is
//     missing or invalid.
//   - AUTO-GROUND ON LAPSE: recording a required document as lapsed on a cleared vehicle automatically grounds it,
//     so the register can never claim a bus is roadworthy on an expired document.
// Documents are embedded on the vehicle (like wash facility lines). Downward-governance scoped. Synthetic SYN-
// ids only, never real PII.

// Vehicle status.
const (
	FitnessGrounded = "grounded"
	FitnessCleared  = "cleared"
)

// requiredFitnessDocs must each be valid for a vehicle to be cleared for service.
var requiredFitnessDocs = []string{"fitness", "insurance", "permit", "puc", "driver_licence"}

func validFitnessDocKind(k string) bool {
	for _, d := range requiredFitnessDocs {
		if d == k {
			return true
		}
	}
	return false
}

// ComplianceDoc is one statutory document with its validity and expiry.
type ComplianceDoc struct {
	Kind      string `json:"kind"`
	Valid     bool   `json:"valid"`
	Expiry    string `json:"expiry,omitempty"`
	UpdatedOn string `json:"updated_on"`
}

// FitnessVehicle is one school vehicle with its compliance documents and clearance state.
type FitnessVehicle struct {
	ID        string          `json:"id"`
	OrgUnit   string          `json:"org_unit"`
	RegNo     string          `json:"reg_no"`
	Documents []ComplianceDoc `json:"documents,omitempty"`
	Status    string          `json:"status"`
	CreatedOn string          `json:"created_on"`
	UpdatedAt string          `json:"updated_at"`
}

// Validate checks a vehicle's required fields.
func (v FitnessVehicle) Validate() error {
	if v.ID == "" || v.OrgUnit == "" {
		return errors.New("vehiclefitness: id and org_unit are required")
	}
	if v.RegNo == "" {
		return errors.New("vehiclefitness: a reg_no is required")
	}
	return nil
}

func (v FitnessVehicle) docIndex(kind string) int {
	for i := range v.Documents {
		if v.Documents[i].Kind == kind {
			return i
		}
	}
	return -1
}

// blockers lists the required documents that are missing or invalid (empty == clearable).
func (v FitnessVehicle) blockers() []string {
	var out []string
	for _, kind := range requiredFitnessDocs {
		idx := v.docIndex(kind)
		if idx < 0 || !v.Documents[idx].Valid {
			out = append(out, kind)
		}
	}
	return out
}

// applyRecordDoc upserts a document. If the change lapses a required document on a cleared vehicle, the vehicle is
// auto-grounded.
func applyRecordDoc(v FitnessVehicle, kind string, valid bool, expiry, now string) (FitnessVehicle, error) {
	if !validFitnessDocKind(kind) {
		return FitnessVehicle{}, errors.New("vehiclefitness: kind must be fitness, insurance, permit, puc or driver_licence")
	}
	doc := ComplianceDoc{Kind: kind, Valid: valid, Expiry: expiry, UpdatedOn: "2026-06-25"}
	if idx := v.docIndex(kind); idx >= 0 {
		v.Documents[idx] = doc
	} else {
		v.Documents = append(v.Documents, doc)
	}
	if v.Status == FitnessCleared && len(v.blockers()) > 0 {
		v.Status = FitnessGrounded
	}
	v.UpdatedAt = now
	return v, nil
}

// applyClearVehicle clears a vehicle for service — rejected while any required document is missing or invalid.
func applyClearVehicle(v FitnessVehicle, now string) (FitnessVehicle, error) {
	if b := v.blockers(); len(b) > 0 {
		return FitnessVehicle{}, fmt.Errorf("vehiclefitness: cannot clear %s — invalid/missing: %s", v.ID, strings.Join(b, ", "))
	}
	v.Status = FitnessCleared
	v.UpdatedAt = now
	return v, nil
}

type fitnessFilter struct{ OrgUnit, Status string }

func matchFitness(f fitnessFilter, v FitnessVehicle) bool {
	if f.OrgUnit != "" && v.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && v.Status != f.Status {
		return false
	}
	return true
}

// fitnessStore is the persistence port. *memFitnessStore and *pgFitnessStore satisfy it.
type fitnessStore interface {
	Upsert(FitnessVehicle) (FitnessVehicle, error)
	Get(id string) (FitnessVehicle, bool)
	List(fitnessFilter) []FitnessVehicle
}

type memFitnessStore struct {
	mu sync.Mutex
	m  map[string]FitnessVehicle
}

func newMemFitnessStore() *memFitnessStore { return &memFitnessStore{m: map[string]FitnessVehicle{}} }

func (s *memFitnessStore) Upsert(v FitnessVehicle) (FitnessVehicle, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[v.ID] = v
	return v, nil
}

func (s *memFitnessStore) Get(id string) (FitnessVehicle, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, ok := s.m[id]
	return v, ok
}

func (s *memFitnessStore) List(f fitnessFilter) []FitnessVehicle {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]FitnessVehicle, 0, len(s.m))
	for _, v := range s.m {
		if matchFitness(f, v) {
			out = append(out, v)
		}
	}
	return out
}

var (
	fitnessOnce sync.Once
	fitnessBack fitnessStore
)

func fitnessState() fitnessStore {
	fitnessOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgFitnessStore(dsn); err == nil {
				fitnessBack = pg
				log.Printf("vehiclefitness: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("vehiclefitness: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				fitnessBack = newMemFitnessStore()
			}
		} else {
			fitnessBack = newMemFitnessStore()
		}
		seedFitness(fitnessBack)
	})
	return fitnessBack
}

func fitnessNow() string { return "2026-06-25T00:00:00Z" }

// RegisterVehicle records a new vehicle (status grounded). Audited.
func (p *Platform) RegisterVehicle(v FitnessVehicle) (FitnessVehicle, error) {
	v.Status = FitnessGrounded
	if v.CreatedOn == "" {
		v.CreatedOn = "2026-06-25"
	}
	v.UpdatedAt = fitnessNow()
	if err := v.Validate(); err != nil {
		p.appendAudit("rto-officer", "vehiclefitness.register.denied", v.OrgUnit, "deny", err.Error())
		return FitnessVehicle{}, err
	}
	out, err := fitnessState().Upsert(v)
	if err != nil {
		return FitnessVehicle{}, err
	}
	p.appendAudit("rto-officer", "vehiclefitness.register", v.ID, "executed", v.RegNo)
	return out, nil
}

// RecordDoc records a statutory document — auto-grounding on a critical lapse. Audited.
func (p *Platform) RecordDoc(id, kind string, valid bool, expiry string) (FitnessVehicle, error) {
	cur, ok := fitnessState().Get(id)
	if !ok {
		return FitnessVehicle{}, errors.New("vehiclefitness: not found")
	}
	out, err := applyRecordDoc(cur, kind, valid, expiry, fitnessNow())
	if err != nil {
		p.appendAudit("rto-officer", "vehiclefitness.record.denied", id, "deny", err.Error())
		return FitnessVehicle{}, err
	}
	if _, err := fitnessState().Upsert(out); err != nil {
		return FitnessVehicle{}, err
	}
	p.appendAudit("rto-officer", "vehiclefitness.record", id, "executed", fmt.Sprintf("%s valid=%t", kind, valid))
	return out, nil
}

// ClearVehicle clears a vehicle for service — rejecting clearance while any required document is invalid. Audited.
func (p *Platform) ClearVehicle(id string) (FitnessVehicle, error) {
	cur, ok := fitnessState().Get(id)
	if !ok {
		return FitnessVehicle{}, errors.New("vehiclefitness: not found")
	}
	out, err := applyClearVehicle(cur, fitnessNow())
	if err != nil {
		p.appendAudit("rto-officer", "vehiclefitness.clear.denied", id, "deny", err.Error())
		return FitnessVehicle{}, err
	}
	if _, err := fitnessState().Upsert(out); err != nil {
		return FitnessVehicle{}, err
	}
	p.appendAudit("rto-officer", "vehiclefitness.clear", id, "executed", "cleared for service")
	return out, nil
}

// VehicleRecord returns a single vehicle by id.
func (p *Platform) VehicleRecord(id string) (FitnessVehicle, bool) { return fitnessState().Get(id) }

// VehicleFitnessDashboard is the jurisdiction-scoped transport-safety picture: vehicles by status, cleared count,
// and the grounded worklist with blockers. Downward-governance scoped.
type VehicleFitnessDashboard struct {
	Scope     string           `json:"scope"`
	Vehicles  int              `json:"vehicles"`
	Cleared   int              `json:"cleared"`
	Grounded  int              `json:"grounded"`
	Grounds   []FitnessVehicle `json:"grounds,omitempty"`
	Synthetic bool             `json:"synthetic"`
}

// VehicleFitnessDashboard rolls up vehicles across the schools a tenant node governs (fail-closed for others).
func (p *Platform) VehicleFitnessDashboard(scopeOrg string) VehicleFitnessDashboard {
	d := VehicleFitnessDashboard{Scope: scopeOrg, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, v := range fitnessState().List(fitnessFilter{}) {
		if !h.Governs(scopeOrg, v.OrgUnit) {
			continue
		}
		d.Vehicles++
		if v.Status == FitnessCleared {
			d.Cleared++
		} else {
			d.Grounded++
			d.Grounds = append(d.Grounds, v)
		}
	}
	sort.Slice(d.Grounds, func(i, j int) bool { return d.Grounds[i].ID < d.Grounds[j].ID })
	return d
}

// ScopedVehicles lists vehicles a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedVehicles(scopeOrg, status string) []FitnessVehicle {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []FitnessVehicle
	for _, v := range fitnessState().List(fitnessFilter{Status: status}) {
		if h.Governs(scopeOrg, v.OrgUnit) {
			out = append(out, v)
		}
	}
	return out
}

// seedFitness plants a vehicle per school across more than one district: the first fully documented and cleared,
// the others each missing/lapsed on one document (grounded, with blockers). Synthetic SYN- ids only.
func seedFitness(s fitnessStore) {
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
		v := FitnessVehicle{
			ID: fmt.Sprintf("VEH-%s", tag), OrgUnit: school, RegNo: fmt.Sprintf("SYN-TN-%s-0001", tag),
			Status: FitnessGrounded, CreatedOn: "2026-06-01", UpdatedAt: fitnessNow(),
		}
		for _, kind := range requiredFitnessDocs {
			valid := true
			// Ground each non-first vehicle on a different document.
			switch si {
			case 1:
				if kind == "insurance" {
					valid = false
				}
			case 2:
				if kind == "fitness" {
					valid = false
				}
			case 3:
				if kind == "driver_licence" {
					valid = false
				}
			}
			if out, err := applyRecordDoc(v, kind, valid, "2027-03-31", fitnessNow()); err == nil {
				v = out
			}
		}
		if si == 0 {
			if out, err := applyClearVehicle(v, fitnessNow()); err == nil {
				v = out
			}
		}
		s.Upsert(v)
	}
}
