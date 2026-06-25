package integration

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/establishment"
)

// Staff Establishment is an L6 accountability vertical: it holds each school's sanctioned posts (by cadre) and
// the appointments made against them, enforcing that the filled posts of a cadre can never exceed its
// sanctioned strength (the over-appointment gate). Durable to PostgreSQL.
var (
	estabOnce sync.Once
	estabBack estabStore
)

// estabStore is the persistence port (establishments + appointments).
type estabStore interface {
	UpsertEstablishment(establishment.Establishment) (establishment.Establishment, error)
	GetEstablishment(id string) (establishment.Establishment, bool)
	Appoint(establishment.Appointment) (establishment.Appointment, error)
	Vacate(id string) (establishment.Appointment, error)
	Vacancies(id string) int
	ListEstablishments(establishment.EstablishmentFilter) []establishment.Establishment
	ListAppointments(establishment.AppointmentFilter) []establishment.Appointment
}

func estabState() estabStore {
	estabOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgEstabStore(dsn); err == nil {
				estabBack = pg
				log.Printf("establishment: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("establishment: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				estabBack = establishment.NewStore()
			}
		} else {
			estabBack = establishment.NewStore()
		}
		seedEstablishment(estabBack)
	})
	return estabBack
}

// seedEstablishment plants a sanctioned-post register at a real Chennai school across the standard cadres, with
// most posts filled and a couple of vacancies, so the vacancy analytics have signal. Synthetic SYN-T employee
// ids, never real PII.
func seedEstablishment(s estabStore) {
	// Sanction the establishment across several schools over more than one district so the vacancy roll-up spans
	// the estate (bottom-up) while each school scopes to its own posts (top-down).
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	cadres := []struct {
		cadre      string
		sanctioned int
		filled     int
	}{
		{"Headmaster", 1, 1},
		{"Graduate Teacher (BT)", 8, 7},      // 1 vacancy
		{"Secondary Grade Teacher", 6, 6},    // full
		{"Physical Education Teacher", 1, 0}, // vacant
		{"Office Assistant", 2, 1},           // 1 vacancy
	}
	for si, school := range schools {
		tag := schoolTag(si) // "CHN" for school 0 (preserves existing ids), "S<n>" otherwise
		empSeq := 0
		for ci, c := range cadres {
			eid := fmt.Sprintf("ESTAB-%s-%02d", tag, ci+1)
			s.UpsertEstablishment(establishment.Establishment{ID: eid, OrgUnit: school, Cadre: c.cadre, Sanctioned: c.sanctioned, Status: establishment.Active})
			for f := 0; f < c.filled; f++ {
				empSeq++
				emp := fmt.Sprintf("SYN-T-%03d", empSeq)
				if si > 0 {
					emp = fmt.Sprintf("%s-%s", emp, tag)
				}
				s.Appoint(establishment.Appointment{
					ID: fmt.Sprintf("%s-APPT-%02d", eid, f+1), EstablishmentID: eid, OrgUnit: school,
					EmployeeID: emp, Name: "Staff " + emp, Status: establishment.Filled, AppointedOn: "2024-06-01",
				})
			}
		}
	}
}

// SanctionPosts upserts a sanctioned-post line. Audited.
func (p *Platform) SanctionPosts(e establishment.Establishment) (establishment.Establishment, error) {
	out, err := estabState().UpsertEstablishment(e)
	if err != nil {
		p.appendAudit("establishment-officer", "establishment.sanction.denied", e.ID, "deny", err.Error())
		return establishment.Establishment{}, err
	}
	p.appendAudit("establishment-officer", "establishment.sanction", e.ID, out.Status, fmt.Sprintf("%s x%d", e.Cadre, e.Sanctioned))
	return out, nil
}

// AppointStaff fills a sanctioned post (rejecting an over-appointment). Audited.
func (p *Platform) AppointStaff(a establishment.Appointment) (establishment.Appointment, error) {
	out, err := estabState().Appoint(a)
	if err != nil {
		p.appendAudit("establishment-officer", "establishment.appoint.denied", a.EstablishmentID, "deny", err.Error())
		return establishment.Appointment{}, err
	}
	p.appendAudit("establishment-officer", "establishment.appoint", a.ID, "executed", fmt.Sprintf("%s → %s", a.EmployeeID, a.EstablishmentID))
	return out, nil
}

// VacatePost vacates a filled post (freeing it). Audited.
func (p *Platform) VacatePost(id string) (establishment.Appointment, error) {
	out, err := estabState().Vacate(id)
	if err != nil {
		p.appendAudit("establishment-officer", "establishment.vacate.denied", id, "deny", err.Error())
		return establishment.Appointment{}, err
	}
	p.appendAudit("establishment-officer", "establishment.vacate", id, "executed", "post vacated")
	return out, nil
}

// EstablishmentRoster returns the appointments against a sanctioned-post line.
func (p *Platform) EstablishmentRoster(establishmentID string) []establishment.Appointment {
	return estabState().ListAppointments(establishment.AppointmentFilter{EstablishmentID: establishmentID})
}

// CadreStrength is one cadre's sanctioned-vs-filled line in the dashboard.
type CadreStrength struct {
	EstablishmentID string  `json:"establishment_id"`
	Cadre           string  `json:"cadre"`
	Sanctioned      int     `json:"sanctioned"`
	Filled          int     `json:"filled"`
	Vacant          int     `json:"vacant"`
	VacancyPct      float64 `json:"vacancy_pct"`
}

// EstablishmentDashboard is the jurisdiction-scoped staffing picture: sanctioned vs filled strength across the
// cadres a node governs, the vacancy rate, and the vacancy roster. Downward-governance scoped.
type EstablishmentDashboard struct {
	Scope      string          `json:"scope"`
	Cadres     int             `json:"cadres"`
	Sanctioned int             `json:"sanctioned"`
	Filled     int             `json:"filled"`
	Vacant     int             `json:"vacant"`
	VacancyPct float64         `json:"vacancy_pct"`
	Strength   []CadreStrength `json:"strength,omitempty"`
	Vacancies  []CadreStrength `json:"vacancies,omitempty"`
	Synthetic  bool            `json:"synthetic"`
}

// EstablishmentDashboard rolls up staffing strength for the schools a tenant node governs.
func (p *Platform) EstablishmentDashboard(scopeOrg string) EstablishmentDashboard {
	d := EstablishmentDashboard{Scope: scopeOrg, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	appts := estabState().ListAppointments(establishment.AppointmentFilter{})
	for _, e := range estabState().ListEstablishments(establishment.EstablishmentFilter{}) {
		if !h.Governs(scopeOrg, e.OrgUnit) {
			continue
		}
		filled := establishment.FilledCount(appts, e.ID)
		vacant := e.Sanctioned - filled
		if vacant < 0 {
			vacant = 0
		}
		cs := CadreStrength{EstablishmentID: e.ID, Cadre: e.Cadre, Sanctioned: e.Sanctioned, Filled: filled, Vacant: vacant}
		if e.Sanctioned > 0 {
			cs.VacancyPct = float64(vacant) * 100 / float64(e.Sanctioned)
		}
		d.Cadres++
		d.Sanctioned += e.Sanctioned
		d.Filled += filled
		d.Vacant += vacant
		d.Strength = append(d.Strength, cs)
		if vacant > 0 {
			d.Vacancies = append(d.Vacancies, cs)
		}
	}
	if d.Sanctioned > 0 {
		d.VacancyPct = float64(d.Vacant) * 100 / float64(d.Sanctioned)
	}
	return d
}
