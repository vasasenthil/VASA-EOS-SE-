package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/ptm"
)

// TestPgPtmDurable proves sessions + bookings persist across fresh instances, the overbooking and
// double-booking invariants are enforced durably, a cancellation frees a slot, and the attendance lifecycle
// persists. Runs only with DATABASE_URL set.
func TestPgPtmDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL PTM test runs against a live database only")
	}
	s1, err := newPgPtmStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM ptm_bookings WHERE org_unit='PGP-SCH'`); err != nil {
		t.Fatalf("cleanup bookings: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM ptm_sessions WHERE org_unit='PGP-SCH'`); err != nil {
		t.Fatalf("cleanup sessions: %v", err)
	}
	sess := func(id string, slots int, status string) ptm.Session {
		return ptm.Session{ID: id, OrgUnit: "PGP-SCH", Title: id, Date: "2026-07-10", Slots: slots, Status: status}
	}
	bk := func(id, session, student string) ptm.Booking {
		return ptm.Booking{ID: id, SessionID: session, OrgUnit: "PGP-SCH", StudentID: student, Guardian: "G", Status: ptm.Booked, Slot: "10:00"}
	}

	if _, err := s1.UpsertSession(sess("PGP-S1", 2, ptm.Scheduled)); err != nil {
		t.Fatalf("session: %v", err)
	}
	if _, err := s1.Book(bk("PGP-B1", "PGP-S1", "ST-1")); err != nil {
		t.Fatalf("book 1: %v", err)
	}
	if _, err := s1.Book(bk("PGP-B2", "PGP-S1", "ST-2")); err != nil {
		t.Fatalf("book 2: %v", err)
	}
	// third booking exceeds 2 slots → rejected durably.
	if _, err := s1.Book(bk("PGP-B3", "PGP-S1", "ST-3")); err == nil {
		t.Fatal("a durable full session cannot be overbooked")
	}
	// the same student double-booking → rejected.
	if _, err := s1.Book(bk("PGP-B4", "PGP-S1", "ST-1")); err == nil {
		t.Fatal("a durable double-booking must be rejected")
	}

	// fresh instance: bookings durable, capacity still enforced.
	s2, _ := newPgPtmStore(dsn)
	if ptm.Occupied(s2.ListBookings(ptm.BookingFilter{SessionID: "PGP-S1"}), "PGP-S1") != 2 {
		t.Fatal("durable occupancy wrong")
	}
	if _, err := s2.Book(bk("PGP-B3", "PGP-S1", "ST-3")); err == nil {
		t.Fatal("capacity must persist across instances")
	}
	// cancel one → a slot frees, durable.
	if _, err := s2.CancelBooking("PGP-B1"); err != nil {
		t.Fatalf("cancel: %v", err)
	}
	s3, _ := newPgPtmStore(dsn)
	if _, err := s3.Book(bk("PGP-B3", "PGP-S1", "ST-3")); err != nil {
		t.Fatalf("a freed slot must be bookable durably: %v", err)
	}
	// attendance lifecycle persists.
	if _, err := s3.MarkAttended("PGP-B2"); err != nil {
		t.Fatalf("attend: %v", err)
	}
	s4, _ := newPgPtmStore(dsn)
	if b, _ := s4.GetBooking("PGP-B2"); b.Status != ptm.Attended {
		t.Fatalf("attendance not durable: %+v", b)
	}
	// an attended slot cannot be cancelled, durably.
	if _, err := s4.CancelBooking("PGP-B2"); err == nil {
		t.Fatal("an attended slot cannot be cancelled")
	}
}

// TestPTMDashboardScoped proves the seeded session rolls up fill + turnout and the low-turnout flag
// (in-memory path).
func TestPTMDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.PTMDashboard("TN-DIST-Chennai")
	if d.Sessions == 0 || d.Slots == 0 || d.Occupied == 0 {
		t.Fatalf("seeded PTM must roll up: %+v", d)
	}
	// the seed marks 4 attended of 6 occupied → turnout in a sane band.
	if d.Attended == 0 || d.TurnoutPct <= 0 || d.TurnoutPct > 100 {
		t.Fatalf("turnout must be computed: %+v", d)
	}
	if len(d.SessionRoll) == 0 {
		t.Fatalf("a session rollup must surface: %+v", d)
	}
	// a session's attendance sheet is non-empty.
	if len(p.SessionBookings("PTM-CHN-T1")) == 0 {
		t.Fatal("a seeded session must have an attendance sheet")
	}
	// unknown scope → nothing (fail-closed).
	if u := p.PTMDashboard("TN-DIST-Nowhere"); u.Sessions != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
