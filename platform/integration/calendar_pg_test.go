package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/calendar"
)

// TestPgCalendarDurable exercises the REAL PostgreSQL adapter end-to-end. It runs only when DATABASE_URL is
// set (so CI without a database skips it cleanly); when set, it proves durable CRUD + the multi-level approval
// chain survive a fresh store instance — i.e. the data is in Postgres, not in process memory.
func TestPgCalendarDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL test runs against a live database only")
	}
	s1, err := newPgCalendarStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	// clean slate for this test id space.
	if _, err := s1.db.Exec(`DELETE FROM calendar_entries WHERE id LIKE 'PGTEST-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	// CREATE (durable).
	e, err := s1.Create(calendar.Entry{ID: "PGTEST-EXAM", Title: "HSC public exam", Type: calendar.Exam,
		StartDate: "2027-03-01", EndDate: "2027-03-20", OrgUnit: "TN", AcademicYear: "2026-2027", Synthetic: true})
	if err != nil || e.Status != calendar.Draft {
		t.Fatalf("create: %+v err=%v", e, err)
	}
	// duplicate id must be rejected by the PK constraint.
	if _, err := s1.Create(e); err == nil {
		t.Fatal("duplicate id must violate the primary key")
	}
	// SUBMIT into a 4-level chain, then approve the first level.
	chain := []calendar.ApprovalStep{
		{Tier: "G4", ApproverRole: "DEO", RequiredScope: "scheme.recommend"},
		{Tier: "G3", ApproverRole: "DIRECTOR", RequiredScope: "scheme.approve"},
		{Tier: "G2", ApproverRole: "SECRETARY", RequiredScope: "fund.release"},
		{Tier: "G1", ApproverRole: "MINISTER", RequiredScope: "policy.sanction"},
	}
	if _, err := s1.Submit("PGTEST-EXAM", chain); err != nil {
		t.Fatalf("submit: %v", err)
	}
	if _, err := s1.Act("PGTEST-EXAM", true, "u", "DEO", []string{"scheme.recommend"}, "ok"); err != nil {
		t.Fatalf("act: %v", err)
	}

	// ── DURABILITY: open a brand-new store instance (new connection pool, no shared memory) ──
	s2, err := newPgCalendarStore(dsn)
	if err != nil {
		t.Fatalf("reconnect: %v", err)
	}
	got, ok := s2.Get("PGTEST-EXAM")
	if !ok {
		t.Fatal("entry vanished — NOT durable")
	}
	if got.Status != calendar.Pending || got.CurrentStep != 1 {
		t.Fatalf("approval state did not persist: status=%s step=%d", got.Status, got.CurrentStep)
	}
	if len(got.Chain) != 4 || got.Chain[0].Decision != "approved" || got.Chain[0].DecidedBy != "u" {
		t.Fatalf("approval chain did not persist: %+v", got.Chain)
	}

	// LIST + filter survive too.
	exams := s2.List(calendar.Filter{Type: calendar.Exam})
	found := false
	for _, x := range exams {
		if x.ID == "PGTEST-EXAM" {
			found = true
		}
	}
	if !found {
		t.Fatal("durable list/filter did not return the entry")
	}

	// finish the chain on s2 and confirm publication persists to a third instance.
	for _, st := range []struct{ role, scope string }{{"DIRECTOR", "scheme.approve"}, {"SECRETARY", "fund.release"}, {"MINISTER", "policy.sanction"}} {
		if _, err := s2.Act("PGTEST-EXAM", true, "u", st.role, []string{st.scope}, "ok"); err != nil {
			t.Fatalf("act %s: %v", st.role, err)
		}
	}
	s3, _ := newPgCalendarStore(dsn)
	if final, _ := s3.Get("PGTEST-EXAM"); !final.Published() {
		t.Fatalf("published state not durable: %+v", final)
	}

	// UPDATE guard + DELETE.
	if _, err := s3.Update("PGTEST-EXAM", "x", calendar.Exam, "2027-03-01", "2027-03-02", ""); err == nil {
		t.Fatal("a published entry must not be editable (durable guard)")
	}
	if !s3.Delete("PGTEST-EXAM") {
		t.Fatal("delete should remove the row")
	}
	if _, ok := s3.Get("PGTEST-EXAM"); ok {
		t.Fatal("row still present after delete")
	}
}
