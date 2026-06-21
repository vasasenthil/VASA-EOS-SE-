package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/leave"
)

// TestPgLeaveDurable proves the leave workflow (the frontend→backend vertical) persists to PostgreSQL: a 20-day
// request routes through principal→BEO→DEO, and every decision survives a fresh store instance. Runs only when
// DATABASE_URL is set.
func TestPgLeaveDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL leave test runs against a live database only")
	}
	s1, err := newPgLeaveStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM leave_requests WHERE id LIKE 'PGLV-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	// file a 20-day earned leave → 3-level dynamic chain.
	r, err := s1.File("PGLV-1", "T-900", "earned", "2026-07-01", "2026-07-20", "family", "33000000001")
	if err != nil || r.Days != 20 || len(r.Chain) != 3 {
		t.Fatalf("file: %+v err=%v", r, err)
	}
	// duplicate id rejected by the PK.
	if _, err := s1.File("PGLV-1", "T-900", "earned", "2026-07-01", "2026-07-20", "x", "33000000001"); err == nil {
		t.Fatal("duplicate id must violate the primary key")
	}
	// principal approves on s1.
	if _, err := s1.Decide("PGLV-1", true, "HEAD_TEACHER", "principal", "ok"); err != nil {
		t.Fatalf("principal decide: %v", err)
	}

	// fresh instance: state persisted (pending at level 1, principal's approval recorded).
	s2, _ := newPgLeaveStore(dsn)
	got, ok := s2.Get("PGLV-1")
	if !ok || got.Status != leave.Pending || got.CurrentStep != 1 || got.Chain[0].Decision != "approved" {
		t.Fatalf("principal decision not durable: %+v", got)
	}
	// wrong role at the BEO level is rejected even across instances.
	if _, err := s2.Decide("PGLV-1", true, "DEO", "x", ""); err == nil {
		t.Fatal("DEO cannot act before the BEO")
	}
	// BEO then DEO on fresh instances → fully approved, durable.
	if _, err := s2.Decide("PGLV-1", true, "BEO", "beo", "cover arranged"); err != nil {
		t.Fatalf("BEO: %v", err)
	}
	s3, _ := newPgLeaveStore(dsn)
	if _, err := s3.Decide("PGLV-1", true, "DEO", "deo", "sanctioned"); err != nil {
		t.Fatalf("DEO: %v", err)
	}
	s4, _ := newPgLeaveStore(dsn)
	final, _ := s4.Get("PGLV-1")
	if !final.Approved() || final.CurrentStep != 3 {
		t.Fatalf("final approval not durable: %+v", final)
	}
	// list + filter survive.
	if got := s4.List(leave.Filter{Status: leave.Approved, Orgs: map[string]bool{"33000000001": true}}); len(got) == 0 {
		t.Fatal("durable list/filter returned nothing")
	}
}
