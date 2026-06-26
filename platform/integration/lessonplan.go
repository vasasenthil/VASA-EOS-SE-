package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
)

// Lesson Plans is an L7 academic vertical: a durable, reusable lesson plan — topic + learning objectives +
// FLN/NEP mapping tags + resources, authored by a teacher for a class+subject. Lifecycle: draft → published →
// archived. The quality gate is that a plan CANNOT be PUBLISHED without learning objectives. Published plans are
// the ones a period/lesson-delivery record (built next) references. Durable to PostgreSQL; downward-scoped.
// Synthetic ids only, never real PII.

// Lesson-plan status.
const (
	LPDraft     = "draft"
	LPPublished = "published"
	LPArchived  = "archived"
)

// LessonPlan is a single reusable academic lesson plan.
type LessonPlan struct {
	ID         string `json:"id"`
	OrgUnit    string `json:"org_unit"` // the school (T6 tenancy node)
	Class      string `json:"class"`    // e.g. "Grade 8-A"
	Subject    string `json:"subject"`
	TeacherID  string `json:"teacher_id"` // author
	Topic      string `json:"topic"`
	Objectives string `json:"objectives"` // learning objectives (publish gate: must be non-empty)
	Tags       string `json:"tags"`       // comma-separated FLN/NEP mapping tags
	Resources  string `json:"resources"`  // URL / reference material
	Periods    int    `json:"periods"`    // estimated periods to deliver
	Status     string `json:"status"`
	CreatedOn  string `json:"created_on"`
	UpdatedAt  string `json:"updated_at"`
}

// Validate checks a lesson plan's required fields.
func (l LessonPlan) Validate() error {
	if l.ID == "" || l.OrgUnit == "" || l.TeacherID == "" {
		return errors.New("lessonplan: id, org_unit and teacher_id are required")
	}
	if l.Class == "" || l.Subject == "" {
		return errors.New("lessonplan: class and subject are required")
	}
	if l.Topic == "" {
		return errors.New("lessonplan: a topic is required")
	}
	if l.Periods < 1 {
		return errors.New("lessonplan: periods must be at least 1")
	}
	return nil
}

// applyLPPublish publishes a draft/archived plan — requires learning objectives (the quality gate).
func applyLPPublish(l LessonPlan, now string) (LessonPlan, error) {
	if l.Status == LPPublished {
		return LessonPlan{}, errors.New("lessonplan: already published")
	}
	if strings.TrimSpace(l.Objectives) == "" {
		return LessonPlan{}, errors.New("lessonplan: cannot publish a plan without learning objectives")
	}
	l.Status = LPPublished
	l.UpdatedAt = now
	return l, nil
}

// applyLPArchive archives a published plan.
func applyLPArchive(l LessonPlan, now string) (LessonPlan, error) {
	if l.Status != LPPublished {
		return LessonPlan{}, errors.New("lessonplan: only a published plan can be archived")
	}
	l.Status = LPArchived
	l.UpdatedAt = now
	return l, nil
}

type lpFilter struct{ OrgUnit, Subject, Status string }

func matchLP(f lpFilter, l LessonPlan) bool {
	if f.OrgUnit != "" && l.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Subject != "" && l.Subject != f.Subject {
		return false
	}
	if f.Status != "" && l.Status != f.Status {
		return false
	}
	return true
}

// lpStore is the persistence port. *memLPStore and *pgLPStore satisfy it.
type lpStore interface {
	Upsert(LessonPlan) (LessonPlan, error)
	Get(id string) (LessonPlan, bool)
	List(lpFilter) []LessonPlan
}

type memLPStore struct {
	mu sync.Mutex
	m  map[string]LessonPlan
}

func newMemLPStore() *memLPStore { return &memLPStore{m: map[string]LessonPlan{}} }

func (s *memLPStore) Upsert(l LessonPlan) (LessonPlan, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[l.ID] = l
	return l, nil
}

func (s *memLPStore) Get(id string) (LessonPlan, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	l, ok := s.m[id]
	return l, ok
}

func (s *memLPStore) List(f lpFilter) []LessonPlan {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]LessonPlan, 0, len(s.m))
	for _, l := range s.m {
		if matchLP(f, l) {
			out = append(out, l)
		}
	}
	return out
}

var (
	lpOnce sync.Once
	lpBack lpStore
)

func lpState() lpStore {
	lpOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgLPStore(dsn); err == nil {
				lpBack = pg
				log.Printf("lessonplan: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("lessonplan: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				lpBack = newMemLPStore()
			}
		} else {
			lpBack = newMemLPStore()
		}
		seedLessonPlans(lpBack)
	})
	return lpBack
}

func lpNow() string { return "2026-06-22T00:00:00Z" }

// CreateLessonPlan records a new lesson plan (status draft). Audited.
func (p *Platform) CreateLessonPlan(l LessonPlan) (LessonPlan, error) {
	l.Status = LPDraft
	if l.CreatedOn == "" {
		l.CreatedOn = "2026-06-20"
	}
	l.UpdatedAt = lpNow()
	if err := l.Validate(); err != nil {
		p.appendAudit("teacher:"+l.TeacherID, "lessonplan.create.denied", l.OrgUnit, "deny", err.Error())
		return LessonPlan{}, err
	}
	out, err := lpState().Upsert(l)
	if err != nil {
		return LessonPlan{}, err
	}
	p.appendAudit("teacher:"+l.TeacherID, "lessonplan.create", l.ID, "executed", l.Subject+": "+l.Topic)
	return out, nil
}

// AdvanceLessonPlan walks a plan: publish (→ published, needs objectives) | archive (→ archived). Audited.
func (p *Platform) AdvanceLessonPlan(id, action string) (LessonPlan, error) {
	cur, ok := lpState().Get(id)
	if !ok {
		return LessonPlan{}, errors.New("lessonplan: not found")
	}
	var (
		out LessonPlan
		err error
	)
	switch action {
	case "publish":
		out, err = applyLPPublish(cur, lpNow())
	case "archive":
		out, err = applyLPArchive(cur, lpNow())
	default:
		return LessonPlan{}, errors.New("lessonplan: action must be publish or archive")
	}
	if err != nil {
		p.appendAudit("lessonplan", "lessonplan.advance.denied", id, "deny", err.Error())
		return LessonPlan{}, err
	}
	if _, err := lpState().Upsert(out); err != nil {
		return LessonPlan{}, err
	}
	p.appendAudit("lessonplan", "lessonplan.advance", id, "executed", action+"→"+out.Status)
	return out, nil
}

// LessonPlanRecord returns a single lesson plan by id.
func (p *Platform) LessonPlanRecord(id string) (LessonPlan, bool) { return lpState().Get(id) }

// LessonPlanDashboard is the jurisdiction-scoped academic picture: plan counts by status/subject, the published
// count, and the draft worklist. Downward-governance scoped.
type LessonPlanDashboard struct {
	Scope         string         `json:"scope"`
	Total         int            `json:"total"`
	ByStatus      map[string]int `json:"by_status"`
	BySubject     map[string]int `json:"by_subject"`
	Published     int            `json:"published"`
	DraftWorklist []LessonPlan   `json:"draft_worklist,omitempty"`
	Synthetic     bool           `json:"synthetic"`
}

// LessonPlanDashboard rolls up lesson plans across the schools a tenant node governs (fail-closed for others).
func (p *Platform) LessonPlanDashboard(scopeOrg string) LessonPlanDashboard {
	d := LessonPlanDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, BySubject: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, l := range lpState().List(lpFilter{}) {
		if !h.Governs(scopeOrg, l.OrgUnit) {
			continue
		}
		d.Total++
		d.ByStatus[l.Status]++
		d.BySubject[l.Subject]++
		if l.Status == LPPublished {
			d.Published++
		}
		if l.Status == LPDraft {
			d.DraftWorklist = append(d.DraftWorklist, l)
		}
	}
	return d
}

// ScopedLessonPlans lists lesson plans a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedLessonPlans(scopeOrg, status string) []LessonPlan {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []LessonPlan
	for _, l := range lpState().List(lpFilter{Status: status}) {
		if h.Governs(scopeOrg, l.OrgUnit) {
			out = append(out, l)
		}
	}
	return out
}

// seedLessonPlans plants lesson plans across several schools over more than one district, a mix of published +
// draft, with FLN/NEP tags. Synthetic ids.
func seedLessonPlans(s lpStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	type plan struct {
		subject, topic, objectives, tags string
		publish                          bool
	}
	plans := []plan{
		{"Mathematics", "Fractions — parts of a whole", "Identify numerator/denominator; add like fractions.", "FLN, NEP-2.2, numeracy", true},
		{"Tamil", "Ponniyin Selvan — chapter 1", "Read aloud with fluency; summarise the plot.", "FLN, literacy", true},
		{"Science", "Photosynthesis", "", "NEP-4.6, EVS", false}, // draft, no objectives → cannot publish
	}
	for si, school := range schools {
		tag := schoolTag(si)
		teacher := "SYN-T-03"
		if si > 0 {
			teacher = fmt.Sprintf("SYN-T-03-%s", tag)
		}
		for pi, pl := range plans {
			id := fmt.Sprintf("LP-%s-%02d", tag, pi+1)
			l := LessonPlan{
				ID: id, OrgUnit: school, Class: "Grade 8-A", Subject: pl.subject, TeacherID: teacher,
				Topic: pl.topic, Objectives: pl.objectives, Tags: pl.tags, Resources: "https://diksha.gov.in/",
				Periods: 2, Status: LPDraft, CreatedOn: "2026-06-18", UpdatedAt: lpNow(),
			}
			if _, err := s.Upsert(l); err != nil {
				continue
			}
			if pl.publish {
				if out, err := applyLPPublish(l, lpNow()); err == nil {
					s.Upsert(out)
				}
			}
		}
	}
}
