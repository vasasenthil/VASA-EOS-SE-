package establishment

import "testing"

func est(id string, sanctioned int, status string) Establishment {
	return Establishment{ID: id, OrgUnit: "SCH1", Cadre: "Graduate Teacher (BT)", Sanctioned: sanctioned, Status: status}
}

func appt(id, estID, emp string) Appointment {
	return Appointment{ID: id, EstablishmentID: estID, OrgUnit: "SCH1", EmployeeID: emp, Name: "Emp " + emp, Status: Filled, AppointedOn: "2026-06-01"}
}

func TestEstablishmentValidation(t *testing.T) {
	s := NewStore()
	if _, err := s.UpsertEstablishment(est("E1", 0, Active)); err == nil {
		t.Fatal("zero sanctioned rejected")
	}
	if _, err := s.UpsertEstablishment(Establishment{ID: "E1", OrgUnit: "SCH1", Cadre: "", Sanctioned: 3, Status: Active}); err == nil {
		t.Fatal("missing cadre rejected")
	}
	if _, err := s.UpsertEstablishment(est("E1", 3, "open")); err == nil {
		t.Fatal("invalid status rejected")
	}
	if _, err := s.UpsertEstablishment(est("E1", 3, Active)); err != nil {
		t.Fatalf("valid establishment: %v", err)
	}
}

func TestOverAppointmentInvariant(t *testing.T) {
	s := NewStore()
	s.UpsertEstablishment(est("E1", 2, Active))
	if _, err := s.Appoint(appt("A1", "E1", "EMP-1")); err != nil {
		t.Fatalf("appoint 1: %v", err)
	}
	if _, err := s.Appoint(appt("A2", "E1", "EMP-2")); err != nil {
		t.Fatalf("appoint 2: %v", err)
	}
	if s.Vacancies("E1") != 0 {
		t.Fatalf("no vacancies expected: %d", s.Vacancies("E1"))
	}
	// third appointment exceeds the 2 sanctioned → rejected.
	if _, err := s.Appoint(appt("A3", "E1", "EMP-3")); err == nil {
		t.Fatal("a cadre cannot exceed its sanctioned strength")
	}
	// vacate one → a post frees up.
	if _, err := s.Vacate("A1"); err != nil {
		t.Fatalf("vacate: %v", err)
	}
	if s.Vacancies("E1") != 1 {
		t.Fatalf("one vacancy expected after vacate: %d", s.Vacancies("E1"))
	}
	if _, err := s.Appoint(appt("A3", "E1", "EMP-3")); err != nil {
		t.Fatalf("a freed post must be fillable: %v", err)
	}
	if FilledCount(s.ListAppointments(AppointmentFilter{}), "E1") != 2 {
		t.Fatalf("filled count wrong: %d", FilledCount(s.ListAppointments(AppointmentFilter{}), "E1"))
	}
}

func TestAppointGuards(t *testing.T) {
	s := NewStore()
	// unknown establishment.
	if _, err := s.Appoint(appt("A1", "GHOST", "EMP-1")); err == nil {
		t.Fatal("appoint against unknown establishment must fail")
	}
	s.UpsertEstablishment(est("E1", 5, Active))
	s.Appoint(appt("A1", "E1", "EMP-1"))
	// the same employee can't hold two posts in the same establishment.
	if _, err := s.Appoint(appt("A2", "E1", "EMP-1")); err == nil {
		t.Fatal("an employee cannot hold two posts in the same establishment")
	}
	// a frozen establishment takes no new appointments.
	s.UpsertEstablishment(est("E2", 5, Frozen))
	if _, err := s.Appoint(appt("A3", "E2", "EMP-2")); err == nil {
		t.Fatal("a frozen establishment takes no appointments")
	}
	// vacating a non-filled post / unknown fails.
	s.Vacate("A1")
	if _, err := s.Vacate("A1"); err == nil {
		t.Fatal("vacating an already-vacated post must fail")
	}
	if _, err := s.Vacate("ZZ"); err == nil {
		t.Fatal("vacating an unknown post must fail")
	}
}

func TestListsFiltersAndCounts(t *testing.T) {
	s := NewStore()
	s.UpsertEstablishment(est("E1", 3, Active))
	s.UpsertEstablishment(Establishment{ID: "E2", OrgUnit: "SCH1", Cadre: "Headmaster", Sanctioned: 1, Status: Active})
	s.Appoint(appt("A1", "E1", "EMP-1"))
	s.Appoint(appt("A2", "E1", "EMP-2"))
	if len(s.ListEstablishments(EstablishmentFilter{Cadre: "Headmaster"})) != 1 {
		t.Fatal("cadre filter wrong")
	}
	if len(s.ListAppointments(AppointmentFilter{EstablishmentID: "E1"})) != 2 {
		t.Fatal("establishment appointment filter wrong")
	}
	if len(s.ListAppointments(AppointmentFilter{Employee: "EMP-1"})) != 1 {
		t.Fatal("employee filter wrong")
	}
	if s.CountEstablishments() != 2 {
		t.Fatalf("count wrong: %d", s.CountEstablishments())
	}
	if _, ok := s.GetAppointment("A1"); !ok {
		t.Fatal("get appointment failed")
	}
}
