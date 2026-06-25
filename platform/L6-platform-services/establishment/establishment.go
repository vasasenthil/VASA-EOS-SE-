// Package establishment is the L6 Staff Establishment & Sanctioned-Post Register service: the durable record of
// the sanctioned posts at a school (by cadre) and the appointments made against them, with the accountability
// invariant an establishment register must hold — the FILLED posts of a cadre can never exceed its SANCTIONED
// strength (the over-appointment gate). A vacated post frees its slot; vacancy (sanctioned − filled) is derived.
// Pure + stdlib-only.
package establishment

import (
	"errors"
	"sort"
	"strconv"
	"time"
)

// Establishment (sanctioned-post line) statuses.
const (
	Active = "active" // posts open for appointment
	Frozen = "frozen" // posts frozen — no new appointments
)

// Appointment statuses.
const (
	Filled  = "filled"
	Vacated = "vacated"
)

const dateLayout = "2006-01-02"

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

// Establishment is a sanctioned-post line: a cadre at a school with a sanctioned strength.
type Establishment struct {
	ID         string `json:"id"`
	OrgUnit    string `json:"org_unit"` // the school (T6 tenancy node)
	Cadre      string `json:"cadre"`    // e.g. "Graduate Teacher (BT)", "Headmaster", "Office Assistant"
	Sanctioned int    `json:"sanctioned"`
	Status     string `json:"status"`
}

func validEstStatus(s string) bool { return s == Active || s == Frozen }

// Validate checks an establishment's required fields, sanctioned count and status.
func (e Establishment) Validate() error {
	if e.ID == "" || e.OrgUnit == "" || e.Cadre == "" {
		return errors.New("establishment: id, org_unit and cadre are required")
	}
	if e.Sanctioned <= 0 || e.Sanctioned > 10000 {
		return errors.New("establishment: sanctioned must be 1..10000")
	}
	if !validEstStatus(e.Status) {
		return errors.New("establishment: invalid status " + e.Status)
	}
	return nil
}

// Open reports whether an establishment can take a new appointment (active, not frozen).
func (e Establishment) Open() bool { return e.Status == Active }

// Appointment is a staff member appointed against a sanctioned post.
type Appointment struct {
	ID              string `json:"id"`
	EstablishmentID string `json:"establishment_id"`
	OrgUnit         string `json:"org_unit"`
	EmployeeID      string `json:"employee_id"`
	Name            string `json:"name"`
	Status          string `json:"status"`
	AppointedOn     string `json:"appointed_on"` // YYYY-MM-DD
}

// Validate checks an appointment's required fields, status and date.
func (a Appointment) Validate() error {
	if a.ID == "" || a.EstablishmentID == "" || a.EmployeeID == "" {
		return errors.New("establishment: appointment id, establishment_id and employee_id are required")
	}
	if a.Status != Filled && a.Status != Vacated {
		return errors.New("establishment: invalid appointment status " + a.Status)
	}
	if _, err := parseDate(a.AppointedOn); err != nil {
		return errors.New("establishment: invalid appointed_on (want YYYY-MM-DD)")
	}
	return nil
}

// FilledCount counts the active (filled) posts of an establishment across a set of appointments.
func FilledCount(appointments []Appointment, establishmentID string) int {
	n := 0
	for _, a := range appointments {
		if a.EstablishmentID == establishmentID && a.Status == Filled {
			n++
		}
	}
	return n
}

// EstablishmentFilter narrows an establishment listing.
type EstablishmentFilter struct {
	OrgUnit string
	Cadre   string
	Status  string
}

// MatchEstablishment reports whether an establishment satisfies a filter (exported for persistence adapters).
func MatchEstablishment(f EstablishmentFilter, e Establishment) bool {
	if f.OrgUnit != "" && e.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Cadre != "" && e.Cadre != f.Cadre {
		return false
	}
	if f.Status != "" && e.Status != f.Status {
		return false
	}
	return true
}

// AppointmentFilter narrows an appointment listing.
type AppointmentFilter struct {
	OrgUnit         string
	EstablishmentID string
	Employee        string
	Status          string
}

// MatchAppointment reports whether an appointment satisfies a filter (exported for persistence adapters).
func MatchAppointment(f AppointmentFilter, a Appointment) bool {
	if f.OrgUnit != "" && a.OrgUnit != f.OrgUnit {
		return false
	}
	if f.EstablishmentID != "" && a.EstablishmentID != f.EstablishmentID {
		return false
	}
	if f.Employee != "" && a.EmployeeID != f.Employee {
		return false
	}
	if f.Status != "" && a.Status != f.Status {
		return false
	}
	return true
}

// Store is the in-memory establishment register holding sanctioned-post lines and their appointments.
type Store struct {
	ests  map[string]Establishment
	appts map[string]Appointment
}

// NewStore returns an empty store.
func NewStore() *Store {
	return &Store{ests: map[string]Establishment{}, appts: map[string]Appointment{}}
}

// UpsertEstablishment validates and stores (or updates) a sanctioned-post line by id.
func (s *Store) UpsertEstablishment(e Establishment) (Establishment, error) {
	if e.Status == "" {
		e.Status = Active
	}
	if err := e.Validate(); err != nil {
		return Establishment{}, err
	}
	s.ests[e.ID] = e
	return e, nil
}

// GetEstablishment returns an establishment by id.
func (s *Store) GetEstablishment(id string) (Establishment, bool) { e, ok := s.ests[id]; return e, ok }

func (s *Store) listAppts() []Appointment {
	out := make([]Appointment, 0, len(s.appts))
	for _, a := range s.appts {
		out = append(out, a)
	}
	return out
}

// employeeFilledIn reports whether an employee already holds a filled post in an establishment (other than excludeID).
func (s *Store) employeeFilledIn(establishmentID, employee, excludeID string) bool {
	for id, a := range s.appts {
		if id == excludeID {
			continue
		}
		if a.EstablishmentID == establishmentID && a.EmployeeID == employee && a.Status == Filled {
			return true
		}
	}
	return false
}

// Appoint fills a sanctioned post, enforcing that the establishment is open, the employee is not already
// appointed there, and the cadre is not already at its sanctioned strength (the over-appointment gate).
func (s *Store) Appoint(a Appointment) (Appointment, error) {
	a.Status = Filled
	if err := a.Validate(); err != nil {
		return Appointment{}, err
	}
	e, ok := s.ests[a.EstablishmentID]
	if !ok {
		return Appointment{}, errors.New("establishment: unknown establishment " + a.EstablishmentID)
	}
	if !e.Open() {
		return Appointment{}, errors.New("establishment: " + e.ID + " is " + e.Status + " and takes no new appointments")
	}
	if s.employeeFilledIn(a.EstablishmentID, a.EmployeeID, a.ID) {
		return Appointment{}, errors.New("establishment: employee " + a.EmployeeID + " already holds a post here")
	}
	if FilledCount(s.listAppts(), a.EstablishmentID) >= e.Sanctioned {
		return Appointment{}, errors.New("establishment: " + e.ID + " is at sanctioned strength (" + strconv.Itoa(e.Sanctioned) + ")")
	}
	if a.OrgUnit == "" {
		a.OrgUnit = e.OrgUnit
	}
	s.appts[a.ID] = a
	return a, nil
}

// Vacate vacates a filled post (freeing it).
func (s *Store) Vacate(id string) (Appointment, error) {
	a, ok := s.appts[id]
	if !ok {
		return Appointment{}, errors.New("establishment: no such appointment " + id)
	}
	if a.Status != Filled {
		return Appointment{}, errors.New("establishment: only a filled post can be vacated")
	}
	a.Status = Vacated
	s.appts[id] = a
	return a, nil
}

// GetAppointment returns an appointment by id.
func (s *Store) GetAppointment(id string) (Appointment, bool) { a, ok := s.appts[id]; return a, ok }

// Vacancies returns the unfilled posts of an establishment (sanctioned − filled).
func (s *Store) Vacancies(id string) int {
	e, ok := s.ests[id]
	if !ok {
		return 0
	}
	v := e.Sanctioned - FilledCount(s.listAppts(), id)
	if v < 0 {
		return 0
	}
	return v
}

// ListEstablishments returns the filtered establishments ordered by cadre then id.
func (s *Store) ListEstablishments(f EstablishmentFilter) []Establishment {
	var out []Establishment
	for _, e := range s.ests {
		if MatchEstablishment(f, e) {
			out = append(out, e)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Cadre != out[j].Cadre {
			return out[i].Cadre < out[j].Cadre
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// ListAppointments returns the filtered appointments ordered by establishment then id.
func (s *Store) ListAppointments(f AppointmentFilter) []Appointment {
	var out []Appointment
	for _, a := range s.appts {
		if MatchAppointment(f, a) {
			out = append(out, a)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].EstablishmentID != out[j].EstablishmentID {
			return out[i].EstablishmentID < out[j].EstablishmentID
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// CountEstablishments returns the number of sanctioned-post lines.
func (s *Store) CountEstablishments() int { return len(s.ests) }
