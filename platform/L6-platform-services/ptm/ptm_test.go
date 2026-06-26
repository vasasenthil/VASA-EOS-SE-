package ptm

import "testing"

func session(id string, slots int, status string) Session {
	return Session{ID: id, OrgUnit: "SCH1", Title: "Term 1 PTM", Date: "2026-07-10", Slots: slots, Status: status}
}

func booking(id, sessionID, student string) Booking {
	return Booking{ID: id, SessionID: sessionID, OrgUnit: "SCH1", StudentID: student, Guardian: "Parent of " + student, Status: Booked, Slot: "10:00"}
}

func TestSessionValidation(t *testing.T) {
	s := NewStore()
	if _, err := s.UpsertSession(session("S1", 0, Scheduled)); err == nil {
		t.Fatal("zero slots rejected")
	}
	if _, err := s.UpsertSession(Session{ID: "S1", OrgUnit: "SCH1", Title: "x", Date: "bad", Slots: 10, Status: Scheduled}); err == nil {
		t.Fatal("bad date rejected")
	}
	if _, err := s.UpsertSession(session("S1", 10, "open")); err == nil {
		t.Fatal("invalid status rejected")
	}
	if _, err := s.UpsertSession(session("S1", 10, Scheduled)); err != nil {
		t.Fatalf("valid session: %v", err)
	}
}

func TestCapacityInvariant(t *testing.T) {
	s := NewStore()
	s.UpsertSession(session("S1", 2, Scheduled))
	if _, err := s.Book(booking("B1", "S1", "ST-1")); err != nil {
		t.Fatalf("book 1: %v", err)
	}
	if _, err := s.Book(booking("B2", "S1", "ST-2")); err != nil {
		t.Fatalf("book 2: %v", err)
	}
	// third booking exceeds the 2 slots → rejected.
	if _, err := s.Book(booking("B3", "S1", "ST-3")); err == nil {
		t.Fatal("a full session cannot be overbooked")
	}
	// cancel one → a slot frees.
	if _, err := s.CancelBooking("B1"); err != nil {
		t.Fatalf("cancel: %v", err)
	}
	if _, err := s.Book(booking("B3", "S1", "ST-3")); err != nil {
		t.Fatalf("a freed slot must be bookable: %v", err)
	}
	if Occupied(s.ListBookings(BookingFilter{}), "S1") != 2 {
		t.Fatalf("occupied wrong: %d", Occupied(s.ListBookings(BookingFilter{}), "S1"))
	}
}

func TestBookingGuards(t *testing.T) {
	s := NewStore()
	// unknown session.
	if _, err := s.Book(booking("B1", "GHOST", "ST-1")); err == nil {
		t.Fatal("booking an unknown session must fail")
	}
	s.UpsertSession(session("S1", 10, Scheduled))
	s.Book(booking("B1", "S1", "ST-1"))
	// double-booking the same student in the same session.
	if _, err := s.Book(booking("B2", "S1", "ST-1")); err == nil {
		t.Fatal("a student cannot double-book a session")
	}
	// a cancelled session takes no bookings.
	s.UpsertSession(session("S2", 10, Cancelled))
	if _, err := s.Book(booking("B3", "S2", "ST-2")); err == nil {
		t.Fatal("a cancelled session takes no bookings")
	}
}

func TestAttendanceLifecycle(t *testing.T) {
	s := NewStore()
	s.UpsertSession(session("S1", 10, Scheduled))
	s.Book(booking("B1", "S1", "ST-1"))
	s.Book(booking("B2", "S1", "ST-2"))
	if b, err := s.MarkAttended("B1"); err != nil || b.Status != Attended {
		t.Fatalf("attend: %+v err=%v", b, err)
	}
	if b, err := s.MarkNoShow("B2"); err != nil || b.Status != NoShow {
		t.Fatalf("no-show: %+v err=%v", b, err)
	}
	// an attended slot cannot be cancelled or re-marked.
	if _, err := s.CancelBooking("B1"); err == nil {
		t.Fatal("an attended slot cannot be cancelled")
	}
	if _, err := s.MarkAttended("B2"); err == nil {
		t.Fatal("a no-show slot cannot be re-marked attended")
	}
	// unknown booking fails.
	if _, err := s.MarkAttended("ZZ"); err == nil {
		t.Fatal("unknown booking must fail")
	}
	// an attended/no-show booking still occupies a slot (history retained).
	if Occupied(s.ListBookings(BookingFilter{}), "S1") != 2 {
		t.Fatalf("attended+no_show still occupy slots: %d", Occupied(s.ListBookings(BookingFilter{}), "S1"))
	}
}

func TestListsFiltersAndCounts(t *testing.T) {
	s := NewStore()
	s.UpsertSession(session("S1", 10, Scheduled))
	s.UpsertSession(session("S2", 10, Cancelled))
	s.Book(booking("B1", "S1", "ST-1"))
	s.Book(booking("B2", "S1", "ST-2"))
	if len(s.ListSessions(SessionFilter{Status: Scheduled})) != 1 {
		t.Fatal("session status filter wrong")
	}
	if len(s.ListBookings(BookingFilter{SessionID: "S1"})) != 2 {
		t.Fatal("booking session filter wrong")
	}
	if len(s.ListBookings(BookingFilter{Student: "ST-1"})) != 1 {
		t.Fatal("booking student filter wrong")
	}
	if s.CountSessions() != 2 {
		t.Fatalf("count wrong: %d", s.CountSessions())
	}
	if _, ok := s.GetBooking("B1"); !ok {
		t.Fatal("get booking failed")
	}
}
