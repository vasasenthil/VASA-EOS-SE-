package integration

import (
	"fmt"
	"hash/fnv"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/cpd"
)

// Teacher CPD is an L6 data+analytics plane completing the teacher lifecycle: the durable record of in-service
// training (NISHTHA/SCERT/DIET/DIKSHA) with the NEP 2020 compliance picture — who has met the 50-hours/year
// target and who is deficient. Durable to PostgreSQL.
var (
	cpdOnce sync.Once
	cpdBack cpdStore
)

// cpdStore is the persistence port.
type cpdStore interface {
	Record(cpd.Record) (cpd.Record, error)
	Get(id string) (cpd.Record, bool)
	List(cpd.Filter) []cpd.Record
}

func cpdState() cpdStore {
	cpdOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgCpdStore(dsn); err == nil {
				cpdBack = pg
				log.Printf("cpd: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("cpd: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				cpdBack = cpd.NewStore()
			}
		} else {
			cpdBack = cpd.NewStore()
		}
		seedCPD(cpdBack)
	})
	return cpdBack
}

// seedCPD plants 2026 CPD for a small synthetic teacher cohort at a real Chennai school — most compliant, one
// deficient — so the NEP compliance analytics have signal. Synthetic ids (SYN-T), never real PII.
func seedCPD(s cpdStore) {
	school := tenancyLeafUnder("TN-DIST-Chennai")
	if school == "" {
		return
	}
	providers := []string{cpd.NISHTHA, cpd.SCERT, cpd.DIET, cpd.DIKSHA}
	for n := 0; n < 8; n++ {
		teacher := fmt.Sprintf("SYN-T-%02d", n+1)
		// teacher #2 is engineered to be deficient (only ~18 hours).
		courses := 3
		if n == 1 {
			courses = 1
		}
		for c := 0; c < courses; c++ {
			h := fnv.New32a()
			h.Write([]byte(teacher + fmt.Sprint(c)))
			hours := 16 + int(h.Sum32()%8) // 16..23 hours each
			s.Record(cpd.Record{
				ID: teacher + "-CPD-" + fmt.Sprint(c), TeacherID: teacher, OrgUnit: school,
				Course: providers[c%len(providers)] + " module " + fmt.Sprint(c+1), Provider: providers[c%len(providers)],
				Hours: hours, Year: 2026, Status: cpd.Certified, CompletedOn: fmt.Sprintf("2026-0%d-15", c+1),
			})
		}
	}
}

// RecordCPD stores a teacher's CPD completion. Audited.
func (p *Platform) RecordCPD(r cpd.Record) (cpd.Record, error) {
	out, err := cpdState().Record(r)
	if err != nil {
		return cpd.Record{}, err
	}
	p.appendAudit("teacher:"+r.TeacherID, "cpd.record", r.ID, r.Status, fmt.Sprintf("%s %dh", r.Provider, r.Hours))
	return out, nil
}

// TeacherCPD is a teacher's professional-development picture for a year.
type TeacherCPD struct {
	TeacherID string       `json:"teacher_id"`
	OrgUnit   string       `json:"org_unit"`
	Year      int          `json:"year"`
	Hours     int          `json:"hours"`
	Target    int          `json:"target_hours"`
	Compliant bool         `json:"compliant"`
	Courses   []cpd.Record `json:"courses,omitempty"`
}

// TeacherCPDProfile assembles a teacher's CPD hours + NEP compliance for a year.
func (p *Platform) TeacherCPDProfile(teacher string, year int) TeacherCPD {
	recs := cpdState().List(cpd.Filter{Teacher: teacher, Year: year})
	return TeacherCPD{
		TeacherID: teacher, Year: year, Hours: cpd.HoursFor(recs), Target: cpd.AnnualTargetHours,
		Compliant: cpd.IsCompliant(recs), Courses: recs, OrgUnit: cpdOrg(recs),
	}
}

func cpdOrg(recs []cpd.Record) string {
	if len(recs) > 0 {
		return recs[0].OrgUnit
	}
	return ""
}

// CPDDashboard is the jurisdiction-scoped teacher-CPD compliance picture (NEP 2020): how many teachers are
// compliant vs deficient for a year, the compliance rate and the deficient roster. Downward-governance scoped.
type CPDDashboard struct {
	Scope          string   `json:"scope"`
	Year           int      `json:"year"`
	Teachers       int      `json:"teachers"`
	Compliant      int      `json:"compliant"`
	ComplianceRate float64  `json:"compliance_rate"`
	TotalHours     int      `json:"total_hours"`
	Deficient      []string `json:"deficient_teachers"`
	Synthetic      bool     `json:"synthetic"`
}

// CPDDashboard rolls up CPD compliance for a year across the schools a tenant node governs.
func (p *Platform) CPDDashboard(scopeOrg string, year int) CPDDashboard {
	d := CPDDashboard{Scope: scopeOrg, Year: year, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	byTeacher := map[string][]cpd.Record{}
	for _, r := range cpdState().List(cpd.Filter{Year: year}) {
		if h.Governs(scopeOrg, r.OrgUnit) {
			byTeacher[r.TeacherID] = append(byTeacher[r.TeacherID], r)
		}
	}
	d.Teachers = len(byTeacher)
	for teacher, recs := range byTeacher {
		d.TotalHours += cpd.HoursFor(recs)
		if cpd.IsCompliant(recs) {
			d.Compliant++
		} else {
			d.Deficient = append(d.Deficient, teacher)
		}
	}
	if d.Teachers > 0 {
		d.ComplianceRate = float64(d.Compliant) * 100 / float64(d.Teachers)
	}
	return d
}
