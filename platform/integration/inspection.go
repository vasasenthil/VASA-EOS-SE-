package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"
)

// School Inspection & Monitoring is an L11 governance vertical: a field officer records a monitoring visit to a
// school (academic / administrative / safety / financial), scores its compliance, lists findings, and then walks
// the visit through an action → closure workflow. A school cannot carry two OPEN inspections of the same type at
// once, and an inspection cannot be closed before an action has been recorded against its findings (separation of
// finding from closure). Durable to PostgreSQL; downward-governance scoped. Synthetic ids only, never real PII.

// Inspection status values.
const (
	InspOpen        = "open"         // visit recorded, findings pending action
	InspActionTaken = "action_taken" // an action has been recorded against the findings
	InspClosed      = "closed"       // verified and closed
)

// Inspection visit types.
const (
	InspAcademic       = "academic"
	InspAdministrative = "administrative"
	InspSafety         = "safety"
	InspFinancial      = "financial"
)

// Inspection is a single monitoring/inspection visit to a school.
type Inspection struct {
	ID              string `json:"id"`
	OrgUnit         string `json:"org_unit"` // the school (T6 tenancy node)
	Type            string `json:"type"`
	InspectorID     string `json:"inspector_id"`
	VisitedOn       string `json:"visited_on"` // YYYY-MM-DD
	ComplianceScore int    `json:"compliance_score"`
	Findings        string `json:"findings"`
	Status          string `json:"status"`
	ActionNote      string `json:"action_note,omitempty"`
	ClosedOn        string `json:"closed_on,omitempty"`
	UpdatedAt       string `json:"updated_at"`
}

func validInspType(t string) bool {
	switch t {
	case InspAcademic, InspAdministrative, InspSafety, InspFinancial:
		return true
	}
	return false
}

// Validate checks an inspection's required fields, type, score and date.
func (i Inspection) Validate() error {
	if i.ID == "" || i.OrgUnit == "" || i.InspectorID == "" {
		return errors.New("inspection: id, org_unit and inspector_id are required")
	}
	if !validInspType(i.Type) {
		return errors.New("inspection: invalid type " + i.Type)
	}
	if i.ComplianceScore < 0 || i.ComplianceScore > 100 {
		return errors.New("inspection: compliance_score must be between 0 and 100")
	}
	if _, err := time.Parse("2006-01-02", i.VisitedOn); err != nil {
		return errors.New("inspection: invalid visited_on (want YYYY-MM-DD)")
	}
	return nil
}

// Active reports whether the inspection is still open work (not yet closed).
func (i Inspection) Active() bool { return i.Status != InspClosed }

// applyInspAction records an action against an open inspection's findings.
func applyInspAction(i Inspection, note, now string) (Inspection, error) {
	if i.Status != InspOpen {
		return Inspection{}, errors.New("inspection: only an open inspection can record an action")
	}
	if note == "" {
		return Inspection{}, errors.New("inspection: an action note is required")
	}
	i.Status = InspActionTaken
	i.ActionNote = note
	i.UpdatedAt = now
	return i, nil
}

// applyInspClose closes an inspection that has had an action recorded.
func applyInspClose(i Inspection, on, now string) (Inspection, error) {
	if i.Status != InspActionTaken {
		return Inspection{}, errors.New("inspection: an inspection can be closed only after an action is recorded")
	}
	if _, err := time.Parse("2006-01-02", on); err != nil {
		return Inspection{}, errors.New("inspection: invalid closed_on (want YYYY-MM-DD)")
	}
	i.Status = InspClosed
	i.ClosedOn = on
	i.UpdatedAt = now
	return i, nil
}

type inspFilter struct{ OrgUnit, Type, Status string }

func matchInsp(f inspFilter, i Inspection) bool {
	if f.OrgUnit != "" && i.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Type != "" && i.Type != f.Type {
		return false
	}
	if f.Status != "" && i.Status != f.Status {
		return false
	}
	return true
}

// inspStore is the persistence port. *memInspStore (in-memory) and *pgInspStore (PostgreSQL) satisfy it.
type inspStore interface {
	Upsert(Inspection) (Inspection, error)
	Get(id string) (Inspection, bool)
	List(inspFilter) []Inspection
}

type memInspStore struct {
	mu sync.Mutex
	m  map[string]Inspection
}

func newMemInspStore() *memInspStore { return &memInspStore{m: map[string]Inspection{}} }

func (s *memInspStore) Upsert(i Inspection) (Inspection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[i.ID] = i
	return i, nil
}

func (s *memInspStore) Get(id string) (Inspection, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	i, ok := s.m[id]
	return i, ok
}

func (s *memInspStore) List(f inspFilter) []Inspection {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Inspection, 0, len(s.m))
	for _, i := range s.m {
		if matchInsp(f, i) {
			out = append(out, i)
		}
	}
	return out
}

var (
	inspOnce sync.Once
	inspBack inspStore
)

func inspState() inspStore {
	inspOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgInspStore(dsn); err == nil {
				inspBack = pg
				log.Printf("inspection: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("inspection: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				inspBack = newMemInspStore()
			}
		} else {
			inspBack = newMemInspStore()
		}
		seedInspection(inspBack)
	})
	return inspBack
}

func inspNow() string { return "2026-06-22T00:00:00Z" }

// FileInspection records a new monitoring visit (status open). Rejects a duplicate OPEN inspection of the same
// type at the same school. Audited.
func (p *Platform) FileInspection(in Inspection) (Inspection, error) {
	in.Status = InspOpen
	in.UpdatedAt = inspNow()
	if err := in.Validate(); err != nil {
		p.appendAudit("inspector:"+in.InspectorID, "inspection.file.denied", in.OrgUnit, "deny", err.Error())
		return Inspection{}, err
	}
	for _, ex := range inspState().List(inspFilter{OrgUnit: in.OrgUnit, Type: in.Type, Status: InspOpen}) {
		if ex.ID != in.ID {
			return Inspection{}, fmt.Errorf("inspection: %s already has an open %s inspection (%s)", in.OrgUnit, in.Type, ex.ID)
		}
	}
	out, err := inspState().Upsert(in)
	if err != nil {
		return Inspection{}, err
	}
	p.appendAudit("inspector:"+in.InspectorID, "inspection.file", in.ID, "executed", fmt.Sprintf("%s score=%d", in.Type, in.ComplianceScore))
	return out, nil
}

// AdvanceInspection walks an inspection: action (open → action_taken, with a note) | close (→ closed). Audited.
func (p *Platform) AdvanceInspection(id, action, arg string) (Inspection, error) {
	cur, ok := inspState().Get(id)
	if !ok {
		return Inspection{}, errors.New("inspection: not found")
	}
	var (
		out Inspection
		err error
	)
	switch action {
	case "action":
		out, err = applyInspAction(cur, arg, inspNow())
	case "close":
		if arg == "" {
			arg = "2026-06-22"
		}
		out, err = applyInspClose(cur, arg, inspNow())
	default:
		return Inspection{}, errors.New("inspection: action must be action or close")
	}
	if err != nil {
		p.appendAudit("inspection", "inspection.advance.denied", id, "deny", err.Error())
		return Inspection{}, err
	}
	if _, err := inspState().Upsert(out); err != nil {
		return Inspection{}, err
	}
	p.appendAudit("inspection", "inspection.advance", id, "executed", action+"→"+out.Status)
	return out, nil
}

// InspectionRecord returns a single inspection by id.
func (p *Platform) InspectionRecord(id string) (Inspection, bool) { return inspState().Get(id) }

// InspectionDashboard is the jurisdiction-scoped monitoring picture: visit counts by status/type, average
// compliance, and the open + low-compliance rosters. Downward-governance scoped.
type InspectionDashboard struct {
	Scope         string         `json:"scope"`
	Total         int            `json:"total"`
	ByStatus      map[string]int `json:"by_status"`
	ByType        map[string]int `json:"by_type"`
	Open          int            `json:"open"`
	AvgCompliance float64        `json:"avg_compliance"`
	LowCompliance []Inspection   `json:"low_compliance,omitempty"` // score < 60
	OpenWorklist  []Inspection   `json:"open_worklist,omitempty"`  // not yet closed
	Synthetic     bool           `json:"synthetic"`
}

// InspectionDashboard rolls up inspections across the schools a tenant node governs (fail-closed for others).
func (p *Platform) InspectionDashboard(scopeOrg string) InspectionDashboard {
	d := InspectionDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, ByType: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	var sum int
	for _, i := range inspState().List(inspFilter{}) {
		if !h.Governs(scopeOrg, i.OrgUnit) {
			continue
		}
		d.Total++
		d.ByStatus[i.Status]++
		d.ByType[i.Type]++
		sum += i.ComplianceScore
		if i.Active() {
			d.Open++
			d.OpenWorklist = append(d.OpenWorklist, i)
		}
		if i.ComplianceScore < 60 {
			d.LowCompliance = append(d.LowCompliance, i)
		}
	}
	if d.Total > 0 {
		d.AvgCompliance = float64(sum) / float64(d.Total)
	}
	return d
}

// ScopedInspections lists inspections a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedInspections(scopeOrg, status string) []Inspection {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []Inspection
	for _, i := range inspState().List(inspFilter{Status: status}) {
		if h.Governs(scopeOrg, i.OrgUnit) {
			out = append(out, i)
		}
	}
	return out
}

// seedInspection plants monitoring visits across several schools over more than one district so the oversight
// roll-up spans the estate, including a low-compliance school and a mix of open/actioned/closed visits.
func seedInspection(s inspStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	type visit struct {
		typ     string
		score   int
		mark    string // "" open | "action" | "close"
		finding string
	}
	visits := []visit{
		{InspAcademic, 82, "close", "Lesson plans up to date; FLN tracker maintained."},
		{InspSafety, 48, "action", "Fire extinguisher expired; one staircase rail loose."},
		{InspAdministrative, 71, "", "Attendance register current; two service books pending."},
		{InspFinancial, 55, "", "MDM cash book reconciled; SMG utilisation certificate pending."},
	}
	for si, school := range schools {
		tag := schoolTag(si)
		for vi, v := range visits {
			// school 1 is engineered to score lower across the board (a needs-attention school).
			score := v.score
			if si == 1 {
				score = maxInt(0, score-20)
			}
			in := Inspection{
				ID: fmt.Sprintf("INSP-%s-%02d", tag, vi+1), OrgUnit: school, Type: v.typ,
				InspectorID: fmt.Sprintf("SYN-BEO-%02d", si+1), VisitedOn: "2026-06-12",
				ComplianceScore: score, Findings: v.finding, Status: InspOpen, UpdatedAt: inspNow(),
			}
			if _, err := s.Upsert(in); err != nil {
				continue
			}
			switch v.mark {
			case "action":
				if out, err := applyInspAction(in, "Issued a 15-day rectification notice; follow-up scheduled.", inspNow()); err == nil {
					s.Upsert(out)
				}
			case "close":
				if a, err := applyInspAction(in, "Minor observations communicated to the head teacher.", inspNow()); err == nil {
					if c, err := applyInspClose(a, "2026-06-20", inspNow()); err == nil {
						s.Upsert(c)
					}
				}
			}
		}
	}
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
