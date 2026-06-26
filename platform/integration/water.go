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

// Water Quality Testing is an L6 WASH-safety vertical: schools draw drinking-water samples (borewell, tap, RO,
// tanker), a lab records parameter readings, and the source is approved potable only when every CRITICAL
// parameter is within its safe range (Jal Jeevan / IS 10500 drinking-water norm). It is durable, audited, and
// enforces two symmetric hard gates server-side:
//   - POTABILITY (APPROVAL) GATE: a sample cannot be approved potable while any critical parameter is out of its
//     safe range.
//   - FAIL GATE: a sample cannot be marked failed unless at least one critical parameter is actually out of range
//     (you cannot condemn a clean source without evidence).
// Parameter readings are embedded on the sample (like wash facility lines). Downward-governance scoped. Synthetic
// SYN- ids only, never real PII.

// Sample status.
const (
	WaterSampled  = "sampled"
	WaterTested   = "tested"
	WaterApproved = "approved"
	WaterFailed   = "failed"
)

func validWaterSource(s string) bool {
	switch s {
	case "borewell", "tap", "ro", "tanker", "open_well":
		return true
	}
	return false
}

// WaterParam is one measured parameter with its safe range and criticality.
type WaterParam struct {
	Name     string  `json:"name"`
	Value    float64 `json:"value"`
	SafeMin  float64 `json:"safe_min"`
	SafeMax  float64 `json:"safe_max"`
	Critical bool    `json:"critical"`
}

// InRange reports whether the reading is within its safe band.
func (pm WaterParam) InRange() bool { return pm.Value >= pm.SafeMin && pm.Value <= pm.SafeMax }

// WaterTest is one drinking-water sample with its parameter readings and approval state.
type WaterTest struct {
	ID         string       `json:"id"`
	OrgUnit    string       `json:"org_unit"` // the school (T6 tenancy node)
	Source     string       `json:"source"`   // borewell | tap | ro | tanker | open_well
	SampleDate string       `json:"sample_date"`
	Parameters []WaterParam `json:"parameters,omitempty"`
	Status     string       `json:"status"`
	TestedOn   string       `json:"tested_on,omitempty"`
	Remarks    string       `json:"remarks,omitempty"`
	CreatedOn  string       `json:"created_on"`
	UpdatedAt  string       `json:"updated_at"`
}

// Validate checks a sample's required fields.
func (t WaterTest) Validate() error {
	if t.ID == "" || t.OrgUnit == "" {
		return errors.New("water: id and org_unit are required")
	}
	if !validWaterSource(t.Source) {
		return errors.New("water: source must be borewell, tap, ro, tanker or open_well")
	}
	return nil
}

func (t WaterTest) paramIndex(name string) int {
	for i := range t.Parameters {
		if t.Parameters[i].Name == name {
			return i
		}
	}
	return -1
}

// criticalFailures lists the critical parameters that are out of their safe range.
func (t WaterTest) criticalFailures() []string {
	var out []string
	for _, pm := range t.Parameters {
		if pm.Critical && !pm.InRange() {
			out = append(out, pm.Name)
		}
	}
	return out
}

// applyRecordParam upserts a parameter reading and moves a fresh sample to "tested". A reading change after
// approval/failure re-opens the sample to "tested" so the verdict cannot go stale against new evidence.
func applyRecordParam(t WaterTest, pm WaterParam, now string) (WaterTest, error) {
	if pm.Name == "" {
		return WaterTest{}, errors.New("water: parameter name is required")
	}
	if pm.SafeMax < pm.SafeMin {
		return WaterTest{}, errors.New("water: safe_max must be ≥ safe_min")
	}
	if idx := t.paramIndex(pm.Name); idx >= 0 {
		t.Parameters[idx] = pm
	} else {
		t.Parameters = append(t.Parameters, pm)
	}
	t.Status = WaterTested
	t.TestedOn = "2026-06-25"
	t.UpdatedAt = now
	return t, nil
}

// applyApproveWater approves a sample potable — rejected while any critical parameter is out of range.
func applyApproveWater(t WaterTest, now string) (WaterTest, error) {
	if len(t.Parameters) == 0 {
		return WaterTest{}, errors.New("water: record parameter readings before approval")
	}
	if fails := t.criticalFailures(); len(fails) > 0 {
		return WaterTest{}, fmt.Errorf("water: cannot approve %s potable — out of range: %s", t.ID, strings.Join(fails, ", "))
	}
	t.Status = WaterApproved
	t.UpdatedAt = now
	return t, nil
}

// applyFailWater marks a sample failed — rejected unless at least one critical parameter is actually out of range.
func applyFailWater(t WaterTest, remarks, now string) (WaterTest, error) {
	if len(t.criticalFailures()) == 0 {
		return WaterTest{}, fmt.Errorf("water: cannot fail %s — no critical parameter is out of range", t.ID)
	}
	t.Status = WaterFailed
	t.Remarks = remarks
	t.UpdatedAt = now
	return t, nil
}

type waterFilter struct{ OrgUnit, Status, Source string }

func matchWater(f waterFilter, t WaterTest) bool {
	if f.OrgUnit != "" && t.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && t.Status != f.Status {
		return false
	}
	if f.Source != "" && t.Source != f.Source {
		return false
	}
	return true
}

// waterStore is the persistence port. *memWaterStore and *pgWaterStore satisfy it.
type waterStore interface {
	Upsert(WaterTest) (WaterTest, error)
	Get(id string) (WaterTest, bool)
	List(waterFilter) []WaterTest
}

type memWaterStore struct {
	mu sync.Mutex
	m  map[string]WaterTest
}

func newMemWaterStore() *memWaterStore { return &memWaterStore{m: map[string]WaterTest{}} }

func (s *memWaterStore) Upsert(t WaterTest) (WaterTest, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[t.ID] = t
	return t, nil
}

func (s *memWaterStore) Get(id string) (WaterTest, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.m[id]
	return t, ok
}

func (s *memWaterStore) List(f waterFilter) []WaterTest {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]WaterTest, 0, len(s.m))
	for _, t := range s.m {
		if matchWater(f, t) {
			out = append(out, t)
		}
	}
	return out
}

var (
	waterOnce sync.Once
	waterBack waterStore
)

func waterState() waterStore {
	waterOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgWaterStore(dsn); err == nil {
				waterBack = pg
				log.Printf("water: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("water: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				waterBack = newMemWaterStore()
			}
		} else {
			waterBack = newMemWaterStore()
		}
		seedWater(waterBack)
	})
	return waterBack
}

func waterNow() string { return "2026-06-25T00:00:00Z" }

// RegisterWaterSample records a new drinking-water sample (status sampled). Audited.
func (p *Platform) RegisterWaterSample(t WaterTest) (WaterTest, error) {
	t.Status = WaterSampled
	if t.SampleDate == "" {
		t.SampleDate = "2026-06-25"
	}
	if t.CreatedOn == "" {
		t.CreatedOn = "2026-06-25"
	}
	t.UpdatedAt = waterNow()
	if err := t.Validate(); err != nil {
		p.appendAudit("water-lab", "water.register.denied", t.OrgUnit, "deny", err.Error())
		return WaterTest{}, err
	}
	out, err := waterState().Upsert(t)
	if err != nil {
		return WaterTest{}, err
	}
	p.appendAudit("water-lab", "water.register", t.ID, "executed", t.Source)
	return out, nil
}

// RecordWaterParam records a parameter reading. Audited.
func (p *Platform) RecordWaterParam(id string, pm WaterParam) (WaterTest, error) {
	cur, ok := waterState().Get(id)
	if !ok {
		return WaterTest{}, errors.New("water: sample not found")
	}
	out, err := applyRecordParam(cur, pm, waterNow())
	if err != nil {
		p.appendAudit("water-lab", "water.record.denied", id, "deny", err.Error())
		return WaterTest{}, err
	}
	if _, err := waterState().Upsert(out); err != nil {
		return WaterTest{}, err
	}
	p.appendAudit("water-lab", "water.record", id, "executed", fmt.Sprintf("%s=%g", pm.Name, pm.Value))
	return out, nil
}

// ApproveWater approves a sample potable — rejected while any critical parameter is out of range. Audited.
func (p *Platform) ApproveWater(id string) (WaterTest, error) {
	cur, ok := waterState().Get(id)
	if !ok {
		return WaterTest{}, errors.New("water: sample not found")
	}
	out, err := applyApproveWater(cur, waterNow())
	if err != nil {
		p.appendAudit("water-lab", "water.approve.denied", id, "deny", err.Error())
		return WaterTest{}, err
	}
	if _, err := waterState().Upsert(out); err != nil {
		return WaterTest{}, err
	}
	p.appendAudit("water-lab", "water.approve", id, "executed", "potable")
	return out, nil
}

// FailWater marks a sample failed — rejected unless a critical parameter is out of range. Audited.
func (p *Platform) FailWater(id, remarks string) (WaterTest, error) {
	cur, ok := waterState().Get(id)
	if !ok {
		return WaterTest{}, errors.New("water: sample not found")
	}
	out, err := applyFailWater(cur, remarks, waterNow())
	if err != nil {
		p.appendAudit("water-lab", "water.fail.denied", id, "deny", err.Error())
		return WaterTest{}, err
	}
	if _, err := waterState().Upsert(out); err != nil {
		return WaterTest{}, err
	}
	p.appendAudit("water-lab", "water.fail", id, "executed", "unsafe")
	return out, nil
}

// WaterTestRecord returns a single sample by id.
func (p *Platform) WaterTestRecord(id string) (WaterTest, bool) { return waterState().Get(id) }

// WaterDashboard is the jurisdiction-scoped drinking-water picture: samples by status/source, potable (approved)
// and unsafe (failed) counts, and the unsafe-source worklist. Downward-governance scoped.
type WaterDashboard struct {
	Scope     string         `json:"scope"`
	Samples   int            `json:"samples"`
	ByStatus  map[string]int `json:"by_status"`
	BySource  map[string]int `json:"by_source"`
	Potable   int            `json:"potable"`
	Unsafe    int            `json:"unsafe"`
	UnsafeList []WaterTest   `json:"unsafe_list,omitempty"`
	Synthetic bool           `json:"synthetic"`
}

// WaterDashboard rolls up samples across the schools a tenant node governs (fail-closed for others).
func (p *Platform) WaterDashboard(scopeOrg string) WaterDashboard {
	d := WaterDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, BySource: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, t := range waterState().List(waterFilter{}) {
		if !h.Governs(scopeOrg, t.OrgUnit) {
			continue
		}
		d.Samples++
		d.ByStatus[t.Status]++
		d.BySource[t.Source]++
		switch t.Status {
		case WaterApproved:
			d.Potable++
		case WaterFailed:
			d.Unsafe++
			d.UnsafeList = append(d.UnsafeList, t)
		}
	}
	sort.Slice(d.UnsafeList, func(i, j int) bool { return d.UnsafeList[i].ID < d.UnsafeList[j].ID })
	return d
}

// ScopedWaterTests lists samples a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedWaterTests(scopeOrg, status string) []WaterTest {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []WaterTest
	for _, t := range waterState().List(waterFilter{Status: status}) {
		if h.Governs(scopeOrg, t.OrgUnit) {
			out = append(out, t)
		}
	}
	return out
}

// stdWaterParams returns the standard IS 10500 parameter set for a fresh sample, all in range by default.
func stdWaterParams() []WaterParam {
	return []WaterParam{
		{Name: "ph", Value: 7.2, SafeMin: 6.5, SafeMax: 8.5, Critical: true},
		{Name: "turbidity_ntu", Value: 1.0, SafeMin: 0, SafeMax: 5, Critical: true},
		{Name: "ecoli_cfu", Value: 0, SafeMin: 0, SafeMax: 0, Critical: true},
		{Name: "tds_mgl", Value: 320, SafeMin: 0, SafeMax: 500, Critical: false},
		{Name: "residual_chlorine", Value: 0.4, SafeMin: 0.2, SafeMax: 1.0, Critical: false},
	}
}

// seedWater plants a water sample per school across more than one district: the first approved potable, one failed
// (E.coli present), and the rest tested-and-clean awaiting approval. Synthetic SYN- ids only.
func seedWater(s waterStore) {
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
		t := WaterTest{
			ID: fmt.Sprintf("WTR-%s", tag), OrgUnit: school, Source: "borewell", SampleDate: "2026-06-20",
			Status: WaterSampled, CreatedOn: "2026-06-20", UpdatedAt: waterNow(),
		}
		params := stdWaterParams()
		if si == 1 {
			params[2].Value = 12 // E.coli present → critical failure
		}
		for _, pm := range params {
			if out, err := applyRecordParam(t, pm, waterNow()); err == nil {
				t = out
			}
		}
		switch si {
		case 0:
			if out, err := applyApproveWater(t, waterNow()); err == nil {
				t = out
			}
		case 1:
			if out, err := applyFailWater(t, "E.coli detected — source chlorinated and resampled", waterNow()); err == nil {
				t = out
			}
		}
		s.Upsert(t)
	}
}
