package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/transport"
)

// TestPgTransportDurable proves routes + seat allotments persist across fresh instances, and that the capacity
// and serviceability safety invariants are enforced durably. Runs only with DATABASE_URL set.
func TestPgTransportDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL transport test runs against a live database only")
	}
	s1, err := newPgTransStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM transport_allotments WHERE org_unit='PGX-SCH'`); err != nil {
		t.Fatalf("cleanup allots: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM transport_routes WHERE org_unit='PGX-SCH'`); err != nil {
		t.Fatalf("cleanup routes: %v", err)
	}
	const asOf = "2026-06-22"
	rt := func(id string, cap int, fitness string) transport.Route {
		return transport.Route{ID: id, OrgUnit: "PGX-SCH", Name: id, VehicleNo: "TN-" + id, Capacity: cap,
			FitnessValidTill: fitness, DriverName: "D", LicenceValidTill: "2028-01-01", Status: transport.RouteActive}
	}
	al := func(id, route, student string) transport.Allotment {
		return transport.Allotment{ID: id, RouteID: route, OrgUnit: "PGX-SCH", StudentID: student, Stop: "S", Status: transport.Allotted}
	}

	// a capacity-2 serviceable route.
	if _, err := s1.UpsertRoute(rt("PGX-R1", 2, "2027-01-01")); err != nil {
		t.Fatalf("route: %v", err)
	}
	if _, err := s1.Allot(al("PGX-A1", "PGX-R1", "ST-1"), asOf); err != nil {
		t.Fatalf("seat 1: %v", err)
	}
	if _, err := s1.Allot(al("PGX-A2", "PGX-R1", "ST-2"), asOf); err != nil {
		t.Fatalf("seat 2: %v", err)
	}
	// capacity exceeded → rejected.
	if _, err := s1.Allot(al("PGX-A3", "PGX-R1", "ST-3"), asOf); err == nil {
		t.Fatal("a durable capacity ceiling must be enforced")
	}
	// an unserviceable route (lapsed fitness) refuses seats.
	if _, err := s1.UpsertRoute(rt("PGX-R2", 40, "2026-01-01")); err != nil {
		t.Fatalf("route2: %v", err)
	}
	if _, err := s1.Allot(al("PGX-A4", "PGX-R2", "ST-4"), asOf); err == nil {
		t.Fatal("an unserviceable vehicle must refuse a seat")
	}

	// fresh instance: routes + seats durable, capacity still enforced.
	s2, _ := newPgTransStore(dsn)
	if r, ok := s2.GetRoute("PGX-R1"); !ok || r.Capacity != 2 {
		t.Fatalf("route not durable: %+v", r)
	}
	if transport.Occupancy(s2.ListAllotments(transport.AllotmentFilter{RouteID: "PGX-R1"}), "PGX-R1") != 2 {
		t.Fatal("durable occupancy wrong")
	}
	if _, err := s2.Allot(al("PGX-A3", "PGX-R1", "ST-3"), asOf); err == nil {
		t.Fatal("capacity must persist across instances")
	}
	// withdraw a seat → capacity frees, durable.
	if _, err := s2.Withdraw("PGX-A1"); err != nil {
		t.Fatalf("withdraw: %v", err)
	}
	s3, _ := newPgTransStore(dsn)
	if _, err := s3.Allot(al("PGX-A3", "PGX-R1", "ST-3"), asOf); err != nil {
		t.Fatalf("a freed seat must be allottable durably: %v", err)
	}
}

// TestTransportDashboardScoped proves the seeded fleet rolls up + surfaces the unserviceable-route safety
// roster (in-memory path).
func TestTransportDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.TransportDashboard("TN-DIST-Chennai")
	if d.Routes == 0 || d.Capacity == 0 || d.Seated == 0 {
		t.Fatalf("seeded fleet must roll up: %+v", d)
	}
	// the seeded fleet has exactly one engineered unserviceable route (lapsed fitness).
	if len(d.Unserviceable) == 0 {
		t.Fatalf("the unserviceable-route safety roster must surface: %+v", d)
	}
	// a route's manifest is non-empty for a seeded full route.
	if len(p.RouteRoster("RT-CHN-01")) == 0 {
		t.Fatal("a seeded route must have a manifest")
	}
	// unknown scope → nothing (fail-closed).
	if u := p.TransportDashboard("TN-DIST-Nowhere"); u.Routes != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
