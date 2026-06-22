package integration

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/immunisation"
)

// School Health Immunisation is an L6 sensitive-data vertical: it records vaccine doses administered to students
// under the school-health schedule, enforcing the schedule, the no-future-date rule and the dose-sequence
// invariant. Health data is sensitive — the dashboard surfaces aggregate coverage; the per-child due worklist is
// returned only to the governing officer. Durable to PostgreSQL.
var (
	immOnce sync.Once
	immBack immStore
)

// immStore is the persistence port.
type immStore interface {
	AdministerDose(immunisation.DoseRecord) (immunisation.DoseRecord, error)
	Get(id string) (immunisation.DoseRecord, bool)
	List(immunisation.Filter) []immunisation.DoseRecord
}

func immState() immStore {
	immOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgImmStore(dsn); err == nil {
				immBack = pg
				log.Printf("immunisation: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("immunisation: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				immBack = immunisation.NewStore()
			}
		} else {
			immBack = immunisation.NewStore()
		}
		seedImmunisation(immBack)
	})
	return immBack
}

// seedImmunisation plants an immunisation drive at a real Chennai school: a synthetic cohort given the
// single-dose school vaccines (Td10, VitA, Albendazole) and a partial MR rollout (some children with only dose
// 1), so the coverage + due-worklist analytics have signal. Synthetic SYN-S ids, never real PII.
func seedImmunisation(s immStore) {
	school := tenancyLeafUnder(pilotDistrict())
	if school == "" {
		return
	}
	for n := 1; n <= 10; n++ {
		student := fmt.Sprintf("SYN-S-%03d", n)
		// every child gets the single-dose school vaccines.
		s.AdministerDose(immunisation.DoseRecord{ID: fmt.Sprintf("IMM-%03d-TD10", n), StudentID: student, OrgUnit: school, Vaccine: "Td10", DoseNumber: 1, AdministeredOn: "2026-05-20", Batch: "TD10-2026"})
		s.AdministerDose(immunisation.DoseRecord{ID: fmt.Sprintf("IMM-%03d-VITA", n), StudentID: student, OrgUnit: school, Vaccine: "VitA", DoseNumber: 1, AdministeredOn: "2026-05-20", Batch: "VITA-2026"})
		s.AdministerDose(immunisation.DoseRecord{ID: fmt.Sprintf("IMM-%03d-ALB", n), StudentID: student, OrgUnit: school, Vaccine: "Albendazole", DoseNumber: 1, AdministeredOn: "2026-05-20", Batch: "ALB-2026"})
		// MR: first 7 children get dose 1; of those, the first 4 also get dose 2 (complete). The rest are due.
		if n <= 7 {
			s.AdministerDose(immunisation.DoseRecord{ID: fmt.Sprintf("IMM-%03d-MR1", n), StudentID: student, OrgUnit: school, Vaccine: "MR", DoseNumber: 1, AdministeredOn: "2026-05-21", Batch: "MR-2026"})
			if n <= 4 {
				s.AdministerDose(immunisation.DoseRecord{ID: fmt.Sprintf("IMM-%03d-MR2", n), StudentID: student, OrgUnit: school, Vaccine: "MR", DoseNumber: 2, AdministeredOn: "2026-06-04", Batch: "MR-2026"})
			}
		}
	}
}

// RecordImmunisation administers a vaccine dose (enforcing the schedule + sequence invariants). Audited.
func (p *Platform) RecordImmunisation(d immunisation.DoseRecord) (immunisation.DoseRecord, error) {
	out, err := immState().AdministerDose(d)
	if err != nil {
		p.appendAudit("school-nurse", "immunisation.dose.denied", d.StudentID, "deny", err.Error())
		return immunisation.DoseRecord{}, err
	}
	p.appendAudit("school-nurse", "immunisation.dose", d.ID, "executed", fmt.Sprintf("%s dose %d", d.Vaccine, d.DoseNumber))
	return out, nil
}

// StudentImmunisation is a student's per-vaccine immunisation status (the per-child record — officer-only).
type StudentImmunisation struct {
	StudentID string            `json:"student_id"`
	Status    map[string]string `json:"status"` // vaccine code → complete|partial|due
	Doses     int               `json:"doses_recorded"`
}

// StudentImmunisationCard assembles a student's status across the full schedule.
func (p *Platform) StudentImmunisationCard(student string) StudentImmunisation {
	recs := immState().List(immunisation.Filter{Student: student})
	card := StudentImmunisation{StudentID: student, Status: map[string]string{}, Doses: len(recs)}
	for _, v := range immunisation.Schedule() {
		card.Status[v.Code] = immunisation.StatusFor(recs, student, v.Code)
	}
	return card
}

// VaccineCoverage is one vaccine's coverage line in the dashboard.
type VaccineCoverage struct {
	Vaccine     string  `json:"vaccine"`
	Name        string  `json:"name"`
	Complete    int     `json:"complete"`
	Partial     int     `json:"partial"`
	Due         int     `json:"due"`
	CoveragePct float64 `json:"coverage_pct"`
}

// ImmunisationGap is one outstanding vaccine for a student (the follow-up worklist — officer-only).
type ImmunisationGap struct {
	StudentID string `json:"student_id"`
	Vaccine   string `json:"vaccine"`
	Status    string `json:"status"`
}

// ImmunisationDashboard is the jurisdiction-scoped school-health coverage picture: per-vaccine completion across
// the cohort and the due/partial follow-up worklist. Health data is sensitive, so the aggregate coverage is the
// headline; the per-child worklist is included for the governing officer. Downward-governance scoped.
type ImmunisationDashboard struct {
	Scope     string            `json:"scope"`
	Students  int               `json:"students"`
	Doses     int               `json:"doses_recorded"`
	Coverage  []VaccineCoverage `json:"coverage"`
	Worklist  []ImmunisationGap `json:"worklist,omitempty"`
	Synthetic bool              `json:"synthetic"`
}

// ImmunisationDashboard rolls up immunisation coverage for the schools a tenant node governs.
func (p *Platform) ImmunisationDashboard(scopeOrg string) ImmunisationDashboard {
	d := ImmunisationDashboard{Scope: scopeOrg, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	var inScope []immunisation.DoseRecord
	students := map[string]bool{}
	for _, rec := range immState().List(immunisation.Filter{}) {
		if !h.Governs(scopeOrg, rec.OrgUnit) {
			continue
		}
		inScope = append(inScope, rec)
		students[rec.StudentID] = true
		d.Doses++
	}
	d.Students = len(students)
	// per-vaccine coverage across every student seen in scope.
	for _, v := range immunisation.Schedule() {
		vc := VaccineCoverage{Vaccine: v.Code, Name: v.Name}
		for student := range students {
			switch immunisation.StatusFor(inScope, student, v.Code) {
			case immunisation.Complete:
				vc.Complete++
			case immunisation.Partial:
				vc.Partial++
				d.Worklist = append(d.Worklist, ImmunisationGap{StudentID: student, Vaccine: v.Code, Status: immunisation.Partial})
			default:
				vc.Due++
				d.Worklist = append(d.Worklist, ImmunisationGap{StudentID: student, Vaccine: v.Code, Status: immunisation.Due})
			}
		}
		if d.Students > 0 {
			vc.CoveragePct = float64(vc.Complete) * 100 / float64(d.Students)
		}
		d.Coverage = append(d.Coverage, vc)
	}
	return d
}
