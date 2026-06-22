// Package transport is the L6 School Transport route-safety service: school bus routes (a vehicle + driver with
// statutory validity dates) and the student seat allotments on them, with the two hard safety invariants school
// transport must hold — a route can never carry more students than the vehicle's seating capacity, and a
// student can never be allotted to an UNSERVICEABLE vehicle (one whose fitness certificate or whose driver's
// licence has expired). Pure + stdlib-only.
package transport

import (
	"errors"
	"sort"
	"time"
)

// Route statuses.
const (
	RouteActive    = "active"
	RouteSuspended = "suspended"
)

// Allotment statuses.
const (
	Allotted  = "allotted"
	Withdrawn = "withdrawn"
)

const dateLayout = "2006-01-02"

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

// Route is a school bus route: a vehicle + driver with the statutory validity dates that govern whether it may
// carry children at all.
type Route struct {
	ID               string `json:"id"`
	OrgUnit          string `json:"org_unit"` // the school (T6 tenancy node)
	Name             string `json:"name"`
	VehicleNo        string `json:"vehicle_no"`
	Capacity         int    `json:"capacity"`           // seating capacity (the hard ceiling)
	FitnessValidTill string `json:"fitness_valid_till"` // vehicle FC expiry (YYYY-MM-DD)
	DriverName       string `json:"driver_name"`
	LicenceValidTill string `json:"licence_valid_till"` // driver licence expiry (YYYY-MM-DD)
	Status           string `json:"status"`
}

func validRouteStatus(s string) bool { return s == RouteActive || s == RouteSuspended }

// Validate checks a route's required fields, capacity, status and validity dates.
func (r Route) Validate() error {
	if r.ID == "" || r.OrgUnit == "" || r.VehicleNo == "" {
		return errors.New("transport: id, org_unit and vehicle_no are required")
	}
	if r.Capacity <= 0 || r.Capacity > 100 {
		return errors.New("transport: capacity must be 1..100")
	}
	if !validRouteStatus(r.Status) {
		return errors.New("transport: invalid status " + r.Status)
	}
	if _, err := parseDate(r.FitnessValidTill); err != nil {
		return errors.New("transport: invalid fitness_valid_till (want YYYY-MM-DD)")
	}
	if _, err := parseDate(r.LicenceValidTill); err != nil {
		return errors.New("transport: invalid licence_valid_till (want YYYY-MM-DD)")
	}
	return nil
}

// FitnessExpired reports whether the vehicle's fitness certificate has lapsed as of the given day.
func (r Route) FitnessExpired(asOf string) bool { return r.FitnessValidTill < asOf }

// LicenceExpired reports whether the driver's licence has lapsed as of the given day.
func (r Route) LicenceExpired(asOf string) bool { return r.LicenceValidTill < asOf }

// Serviceable reports whether a route may carry children as of the given day: it must be active, with a valid
// fitness certificate and a valid driver licence. This is the safety gate.
func (r Route) Serviceable(asOf string) bool {
	return r.Status == RouteActive && !r.FitnessExpired(asOf) && !r.LicenceExpired(asOf)
}

// UnserviceableReason returns a human reason a route cannot run as of the given day (empty if serviceable).
func (r Route) UnserviceableReason(asOf string) string {
	if r.Status != RouteActive {
		return "route suspended"
	}
	if r.FitnessExpired(asOf) {
		return "vehicle fitness certificate expired (" + r.FitnessValidTill + ")"
	}
	if r.LicenceExpired(asOf) {
		return "driver licence expired (" + r.LicenceValidTill + ")"
	}
	return ""
}

// Allotment is a student's seat on a route (at a boarding stop).
type Allotment struct {
	ID        string `json:"id"`
	RouteID   string `json:"route_id"`
	OrgUnit   string `json:"org_unit"`
	StudentID string `json:"student_id"`
	Stop      string `json:"stop"`
	Status    string `json:"status"`
}

// Validate checks an allotment's required fields and status.
func (a Allotment) Validate() error {
	if a.ID == "" || a.RouteID == "" || a.StudentID == "" {
		return errors.New("transport: allotment id, route_id and student_id are required")
	}
	if a.Status != Allotted && a.Status != Withdrawn {
		return errors.New("transport: invalid allotment status " + a.Status)
	}
	return nil
}

// Occupancy counts the active (allotted) seats on a route across a set of allotments.
func Occupancy(allotments []Allotment, routeID string) int {
	n := 0
	for _, a := range allotments {
		if a.RouteID == routeID && a.Status == Allotted {
			n++
		}
	}
	return n
}

// RouteFilter narrows a route listing.
type RouteFilter struct {
	OrgUnit string
	Status  string
}

// MatchRoute reports whether a route satisfies a filter (exported for persistence adapters).
func MatchRoute(f RouteFilter, r Route) bool {
	if f.OrgUnit != "" && r.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && r.Status != f.Status {
		return false
	}
	return true
}

// AllotmentFilter narrows an allotment listing.
type AllotmentFilter struct {
	OrgUnit string
	RouteID string
	Student string
	Status  string
}

// MatchAllotment reports whether an allotment satisfies a filter (exported for persistence adapters).
func MatchAllotment(f AllotmentFilter, a Allotment) bool {
	if f.OrgUnit != "" && a.OrgUnit != f.OrgUnit {
		return false
	}
	if f.RouteID != "" && a.RouteID != f.RouteID {
		return false
	}
	if f.Student != "" && a.StudentID != f.Student {
		return false
	}
	if f.Status != "" && a.Status != f.Status {
		return false
	}
	return true
}

// Store is the in-memory transport store holding routes and their allotments (credential-free demo).
type Store struct {
	routes map[string]Route
	allots map[string]Allotment
}

// NewStore returns an empty store.
func NewStore() *Store {
	return &Store{routes: map[string]Route{}, allots: map[string]Allotment{}}
}

// UpsertRoute validates and stores (or updates) a route by id.
func (s *Store) UpsertRoute(r Route) (Route, error) {
	if err := r.Validate(); err != nil {
		return Route{}, err
	}
	s.routes[r.ID] = r
	return r, nil
}

// GetRoute returns a route by id.
func (s *Store) GetRoute(id string) (Route, bool) { r, ok := s.routes[id]; return r, ok }

// studentActiveOn reports whether a student already holds an active seat on a route (other than excludeID).
func (s *Store) studentActiveOn(routeID, student, excludeID string) bool {
	for id, a := range s.allots {
		if id == excludeID {
			continue
		}
		if a.RouteID == routeID && a.StudentID == student && a.Status == Allotted {
			return true
		}
	}
	return false
}

// Allot seats a student on a route as of the given day, enforcing the two safety invariants: the vehicle must be
// serviceable (fitness + licence valid, route active) and the route must not be at capacity.
func (s *Store) Allot(a Allotment, asOf string) (Allotment, error) {
	if err := a.Validate(); err != nil {
		return Allotment{}, err
	}
	r, ok := s.routes[a.RouteID]
	if !ok {
		return Allotment{}, errors.New("transport: unknown route " + a.RouteID)
	}
	if reason := r.UnserviceableReason(asOf); reason != "" {
		return Allotment{}, errors.New("transport: cannot allot to an unserviceable route — " + reason)
	}
	if s.studentActiveOn(a.RouteID, a.StudentID, a.ID) {
		return Allotment{}, errors.New("transport: student " + a.StudentID + " is already allotted to this route")
	}
	if Occupancy(s.listAllots(), a.RouteID) >= r.Capacity {
		return Allotment{}, errors.New("transport: route " + a.RouteID + " is at capacity (" + itoa(r.Capacity) + ")")
	}
	s.allots[a.ID] = a
	return a, nil
}

// Withdraw releases a seat (frees capacity).
func (s *Store) Withdraw(id string) (Allotment, error) {
	a, ok := s.allots[id]
	if !ok {
		return Allotment{}, errors.New("transport: no such allotment " + id)
	}
	if a.Status != Allotted {
		return Allotment{}, errors.New("transport: only an active seat can be withdrawn")
	}
	a.Status = Withdrawn
	s.allots[id] = a
	return a, nil
}

// GetAllotment returns an allotment by id.
func (s *Store) GetAllotment(id string) (Allotment, bool) { a, ok := s.allots[id]; return a, ok }

func (s *Store) listAllots() []Allotment {
	out := make([]Allotment, 0, len(s.allots))
	for _, a := range s.allots {
		out = append(out, a)
	}
	return out
}

// ListRoutes returns the filtered routes ordered by id.
func (s *Store) ListRoutes(f RouteFilter) []Route {
	var out []Route
	for _, r := range s.routes {
		if MatchRoute(f, r) {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// ListAllotments returns the filtered allotments ordered by route then id.
func (s *Store) ListAllotments(f AllotmentFilter) []Allotment {
	var out []Allotment
	for _, a := range s.allots {
		if MatchAllotment(f, a) {
			out = append(out, a)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].RouteID != out[j].RouteID {
			return out[i].RouteID < out[j].RouteID
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// CountRoutes returns the number of routes.
func (s *Store) CountRoutes() int { return len(s.routes) }

// itoa is a tiny stdlib-free int formatter (avoids importing strconv into the hot path).
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}
