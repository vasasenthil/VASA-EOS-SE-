package integration

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/vasa-eos-se-tn/platform/transport"
)

// School Transport is an L6 route-safety vertical: it registers school bus routes (vehicle + driver with
// statutory validity dates) and seats students on them, enforcing the two hard safety invariants — a route can
// never exceed its seating capacity, and no student may be allotted to an unserviceable vehicle (expired
// fitness certificate or driver licence). Durable to PostgreSQL.
var (
	transOnce sync.Once
	transBack transStore
)

// transStore is the persistence port (routes + their seat allotments).
type transStore interface {
	UpsertRoute(transport.Route) (transport.Route, error)
	GetRoute(id string) (transport.Route, bool)
	Allot(a transport.Allotment, asOf string) (transport.Allotment, error)
	Withdraw(id string) (transport.Allotment, error)
	ListRoutes(transport.RouteFilter) []transport.Route
	ListAllotments(transport.AllotmentFilter) []transport.Allotment
}

func transState() transStore {
	transOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgTransStore(dsn); err == nil {
				transBack = pg
				log.Printf("transport: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("transport: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				transBack = transport.NewStore()
			}
		} else {
			transBack = transport.NewStore()
		}
		seedTransport(transBack)
	})
	return transBack
}

// todayISO is the as-of day used by seeding and the dashboard (UTC).
func todayISO() string { return time.Now().UTC().Format("2006-01-02") }

// seedTransport plants a small fleet at a real Chennai school: two serviceable routes (one near capacity) and
// one engineered UNSERVICEABLE route (lapsed fitness certificate) so the safety roster has signal. Synthetic
// student ids (SYN-S), never real PII.
func seedTransport(s transStore) {
	// Plant the fleet at several schools over more than one district so the safety/utilisation roll-up spans the
	// estate (bottom-up, incl. one unserviceable route per school) while each school scopes to its own routes.
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	for si, school := range schools {
		tag := schoolTag(si) // "CHN" for school 0 (preserves existing ids), "S<n>" otherwise
		r1 := fmt.Sprintf("RT-%s-01", tag)
		r2 := fmt.Sprintf("RT-%s-02", tag)
		routes := []transport.Route{
			{ID: r1, OrgUnit: school, Name: "Adyar–Besant Nagar", VehicleNo: fmt.Sprintf("TN-09-AB-11%02d1", si), Capacity: 4,
				FitnessValidTill: "2027-03-31", DriverName: "SYN-D-01" + sfxIf(si), LicenceValidTill: "2028-01-31", Status: transport.RouteActive},
			{ID: r2, OrgUnit: school, Name: "T. Nagar–Saidapet", VehicleNo: fmt.Sprintf("TN-09-AB-11%02d2", si), Capacity: 40,
				FitnessValidTill: "2027-06-30", DriverName: "SYN-D-02" + sfxIf(si), LicenceValidTill: "2028-05-31", Status: transport.RouteActive},
			// engineered unserviceable: the fitness certificate lapsed in March 2026.
			{ID: fmt.Sprintf("RT-%s-03", tag), OrgUnit: school, Name: "Velachery–Guindy", VehicleNo: fmt.Sprintf("TN-09-AB-11%02d3", si), Capacity: 40,
				FitnessValidTill: "2026-03-01", DriverName: "SYN-D-03" + sfxIf(si), LicenceValidTill: "2028-02-28", Status: transport.RouteActive},
		}
		for _, r := range routes {
			s.UpsertRoute(r)
		}
		// fill route 1 to its capacity of 4 so the utilisation analytics show a full route.
		for i := 1; i <= 4; i++ {
			s.Allot(transport.Allotment{
				ID: fmt.Sprintf("ALT-%s-01-%02d", tag, i), RouteID: r1, OrgUnit: school,
				StudentID: fmt.Sprintf("SYN-S-%03d%s", i, sfxIf(si)), Stop: "Stop " + fmt.Sprint(i), Status: transport.Allotted,
			}, todayISO())
		}
		// a few seats on route 2.
		for i := 5; i <= 9; i++ {
			s.Allot(transport.Allotment{
				ID: fmt.Sprintf("ALT-%s-02-%02d", tag, i), RouteID: r2, OrgUnit: school,
				StudentID: fmt.Sprintf("SYN-S-%03d%s", i, sfxIf(si)), Stop: "Stop " + fmt.Sprint(i), Status: transport.Allotted,
			}, todayISO())
		}
	}
}

// sfxIf returns a per-school id suffix ("-S<n>") for school index si>0, or "" for school 0 (so school 0 keeps
// the canonical seed ids the existing proofs reference).
func sfxIf(si int) string {
	if si == 0 {
		return ""
	}
	return "-" + schoolTag(si)
}

// RegisterRoute upserts a school bus route. Audited.
func (p *Platform) RegisterRoute(r transport.Route) (transport.Route, error) {
	out, err := transState().UpsertRoute(r)
	if err != nil {
		p.appendAudit("transport-officer", "transport.route.denied", r.ID, "deny", err.Error())
		return transport.Route{}, err
	}
	p.appendAudit("transport-officer", "transport.route", r.ID, "executed", fmt.Sprintf("%s cap %d", r.VehicleNo, r.Capacity))
	return out, nil
}

// AllotSeat seats a student on a route (enforcing capacity + the serviceability safety gate). Audited.
func (p *Platform) AllotSeat(a transport.Allotment) (transport.Allotment, error) {
	out, err := transState().Allot(a, todayISO())
	if err != nil {
		p.appendAudit("transport-officer", "transport.allot.denied", a.RouteID, "deny", err.Error())
		return transport.Allotment{}, err
	}
	p.appendAudit("transport-officer", "transport.allot", a.ID, "executed", fmt.Sprintf("%s → %s", a.StudentID, a.RouteID))
	return out, nil
}

// WithdrawSeat releases a student's seat (frees capacity). Audited.
func (p *Platform) WithdrawSeat(id string) (transport.Allotment, error) {
	out, err := transState().Withdraw(id)
	if err != nil {
		p.appendAudit("transport-officer", "transport.withdraw.denied", id, "deny", err.Error())
		return transport.Allotment{}, err
	}
	p.appendAudit("transport-officer", "transport.withdraw", id, "executed", "seat released")
	return out, nil
}

// RouteRoster returns the active seats on a route (the manifest).
func (p *Platform) RouteRoster(routeID string) []transport.Allotment {
	return transState().ListAllotments(transport.AllotmentFilter{RouteID: routeID, Status: transport.Allotted})
}

// RouteUtilisation is one route's capacity picture in the dashboard.
type RouteUtilisation struct {
	RouteID      string `json:"route_id"`
	Name         string `json:"name"`
	VehicleNo    string `json:"vehicle_no"`
	Capacity     int    `json:"capacity"`
	Seated       int    `json:"seated"`
	Serviceable  bool   `json:"serviceable"`
	SafetyReason string `json:"safety_reason,omitempty"`
}

// TransportDashboard is the jurisdiction-scoped transport-safety picture: fleet size, total capacity vs seated
// (utilisation), and — most important — the UNSERVICEABLE-route roster (vehicles that must not carry children
// until fitness/licence is renewed). Downward-governance scoped.
type TransportDashboard struct {
	Scope         string             `json:"scope"`
	AsOf          string             `json:"as_of"`
	Routes        int                `json:"routes"`
	Capacity      int                `json:"total_capacity"`
	Seated        int                `json:"total_seated"`
	Utilisation   float64            `json:"utilisation_pct"`
	Unserviceable []RouteUtilisation `json:"unserviceable_routes,omitempty"`
	RouteRollup   []RouteUtilisation `json:"routes_rollup,omitempty"`
	Synthetic     bool               `json:"synthetic"`
}

// TransportDashboard rolls up route safety + utilisation for the schools a tenant node governs, as of today.
func (p *Platform) TransportDashboard(scopeOrg string) TransportDashboard {
	asOf := todayISO()
	d := TransportDashboard{Scope: scopeOrg, AsOf: asOf, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	allots := transState().ListAllotments(transport.AllotmentFilter{})
	for _, r := range transState().ListRoutes(transport.RouteFilter{}) {
		if !h.Governs(scopeOrg, r.OrgUnit) {
			continue
		}
		seated := transport.Occupancy(allots, r.ID)
		ru := RouteUtilisation{
			RouteID: r.ID, Name: r.Name, VehicleNo: r.VehicleNo, Capacity: r.Capacity, Seated: seated,
			Serviceable: r.Serviceable(asOf), SafetyReason: r.UnserviceableReason(asOf),
		}
		d.Routes++
		d.Capacity += r.Capacity
		d.Seated += seated
		d.RouteRollup = append(d.RouteRollup, ru)
		if !ru.Serviceable {
			d.Unserviceable = append(d.Unserviceable, ru)
		}
	}
	if d.Capacity > 0 {
		d.Utilisation = float64(d.Seated) * 100 / float64(d.Capacity)
	}
	return d
}
