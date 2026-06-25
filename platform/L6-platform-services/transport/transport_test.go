package transport

import "testing"

func route(id string, cap int, fitness, licence, status string) Route {
	return Route{
		ID: id, OrgUnit: "SCH1", Name: "Route " + id, VehicleNo: "TN-01-" + id, Capacity: cap,
		FitnessValidTill: fitness, DriverName: "Driver " + id, LicenceValidTill: licence, Status: status,
	}
}

func allot(id, routeID, student string) Allotment {
	return Allotment{ID: id, RouteID: routeID, OrgUnit: "SCH1", StudentID: student, Stop: "Stop 1", Status: Allotted}
}

func TestRouteValidationAndServiceability(t *testing.T) {
	s := NewStore()
	if _, err := s.UpsertRoute(route("R1", 0, "2027-01-01", "2027-01-01", RouteActive)); err == nil {
		t.Fatal("zero capacity rejected")
	}
	if _, err := s.UpsertRoute(route("R1", 40, "nope", "2027-01-01", RouteActive)); err == nil {
		t.Fatal("bad fitness date rejected")
	}
	r, err := s.UpsertRoute(route("R1", 40, "2027-01-01", "2027-01-01", RouteActive))
	if err != nil {
		t.Fatalf("valid route: %v", err)
	}
	if !r.Serviceable("2026-06-22") {
		t.Fatal("a valid active route must be serviceable")
	}
	// fitness expired.
	exp := route("R2", 40, "2026-01-01", "2027-01-01", RouteActive)
	if exp.Serviceable("2026-06-22") {
		t.Fatal("a route with expired fitness must be unserviceable")
	}
	if exp.UnserviceableReason("2026-06-22") == "" {
		t.Fatal("an unserviceable route must give a reason")
	}
	// licence expired.
	if !route("R3", 40, "2027-01-01", "2026-01-01", RouteActive).LicenceExpired("2026-06-22") {
		t.Fatal("expired licence must be detected")
	}
	// suspended.
	if route("R4", 40, "2027-01-01", "2027-01-01", RouteSuspended).Serviceable("2026-06-22") {
		t.Fatal("a suspended route is unserviceable")
	}
}

func TestCapacityInvariant(t *testing.T) {
	s := NewStore()
	s.UpsertRoute(route("R1", 2, "2027-01-01", "2027-01-01", RouteActive))
	if _, err := s.Allot(allot("A1", "R1", "S1"), "2026-06-22"); err != nil {
		t.Fatalf("first seat: %v", err)
	}
	if _, err := s.Allot(allot("A2", "R1", "S2"), "2026-06-22"); err != nil {
		t.Fatalf("second seat: %v", err)
	}
	// third seat exceeds capacity → rejected.
	if _, err := s.Allot(allot("A3", "R1", "S3"), "2026-06-22"); err == nil {
		t.Fatal("a route cannot exceed its seating capacity")
	}
	// withdraw one → a seat frees up.
	if _, err := s.Withdraw("A1"); err != nil {
		t.Fatalf("withdraw: %v", err)
	}
	if _, err := s.Allot(allot("A3", "R1", "S3"), "2026-06-22"); err != nil {
		t.Fatalf("a freed seat must be allottable: %v", err)
	}
	if Occupancy(s.ListAllotments(AllotmentFilter{}), "R1") != 2 {
		t.Fatalf("occupancy wrong: %d", Occupancy(s.ListAllotments(AllotmentFilter{}), "R1"))
	}
}

func TestSafetyGateAndDuplicates(t *testing.T) {
	s := NewStore()
	s.UpsertRoute(route("R1", 40, "2026-01-01", "2027-01-01", RouteActive)) // fitness expired
	// cannot allot to an unserviceable (expired-fitness) vehicle.
	if _, err := s.Allot(allot("A1", "R1", "S1"), "2026-06-22"); err == nil {
		t.Fatal("a student cannot be allotted to an unserviceable vehicle")
	}
	// unknown route.
	if _, err := s.Allot(allot("A9", "RX", "S1"), "2026-06-22"); err == nil {
		t.Fatal("allotting to an unknown route must fail")
	}
	// a serviceable route allows it; a duplicate active seat for the same student is rejected.
	s.UpsertRoute(route("R2", 40, "2027-01-01", "2027-01-01", RouteActive))
	if _, err := s.Allot(allot("A2", "R2", "S1"), "2026-06-22"); err != nil {
		t.Fatalf("serviceable allot: %v", err)
	}
	if _, err := s.Allot(allot("A3", "R2", "S1"), "2026-06-22"); err == nil {
		t.Fatal("a student cannot hold two active seats on the same route")
	}
	// withdrawing a non-active seat fails.
	s.Withdraw("A2")
	if _, err := s.Withdraw("A2"); err == nil {
		t.Fatal("withdrawing an already-withdrawn seat must fail")
	}
	if _, err := s.Withdraw("ZZ"); err == nil {
		t.Fatal("withdrawing an unknown seat must fail")
	}
}

func TestListsAndFilters(t *testing.T) {
	s := NewStore()
	s.UpsertRoute(route("R1", 40, "2027-01-01", "2027-01-01", RouteActive))
	s.UpsertRoute(route("R2", 40, "2027-01-01", "2027-01-01", RouteSuspended))
	s.Allot(allot("A1", "R1", "S1"), "2026-06-22")
	s.Allot(allot("A2", "R1", "S2"), "2026-06-22")
	if len(s.ListRoutes(RouteFilter{Status: RouteActive})) != 1 {
		t.Fatal("route status filter wrong")
	}
	if len(s.ListAllotments(AllotmentFilter{RouteID: "R1"})) != 2 {
		t.Fatal("route allotment filter wrong")
	}
	if len(s.ListAllotments(AllotmentFilter{Student: "S1"})) != 1 {
		t.Fatal("student allotment filter wrong")
	}
	if s.CountRoutes() != 2 {
		t.Fatalf("count routes wrong: %d", s.CountRoutes())
	}
	if _, ok := s.GetAllotment("A1"); !ok {
		t.Fatal("get allotment failed")
	}
}

func TestItoa(t *testing.T) {
	cases := map[int]string{0: "0", 7: "7", 42: "42", -5: "-5", 100: "100"}
	for in, want := range cases {
		if got := itoa(in); got != want {
			t.Fatalf("itoa(%d)=%s want %s", in, got, want)
		}
	}
}
