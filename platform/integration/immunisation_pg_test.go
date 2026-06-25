package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/immunisation"
)

// TestPgImmunisationDurable proves dose records persist across fresh instances, the sequence and
// no-duplicate-slot invariants are enforced durably, and a re-record corrects in place. Runs only with
// DATABASE_URL set.
func TestPgImmunisationDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL immunisation test runs against a live database only")
	}
	s1, err := newPgImmStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM immunisation_doses WHERE org_unit='PGH-SCH'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}
	rec := func(id, student, vaccine string, n int, on string) immunisation.DoseRecord {
		return immunisation.DoseRecord{ID: id, StudentID: student, OrgUnit: "PGH-SCH", Vaccine: vaccine, DoseNumber: n, AdministeredOn: on, Batch: "B"}
	}

	// MR dose 2 before dose 1 → rejected (durable sequence invariant).
	if _, err := s1.AdministerDose(rec("PGH-1", "ST-1", "MR", 2, "2026-06-05")); err == nil {
		t.Fatal("a durable out-of-sequence dose must be rejected")
	}
	if _, err := s1.AdministerDose(rec("PGH-1", "ST-1", "MR", 1, "2026-06-01")); err != nil {
		t.Fatalf("dose 1: %v", err)
	}
	if _, err := s1.AdministerDose(rec("PGH-2", "ST-1", "MR", 2, "2026-06-05")); err != nil {
		t.Fatalf("dose 2 after 1: %v", err)
	}

	// fresh instance: doses durable, status complete, sequence + duplicate still enforced.
	s2, _ := newPgImmStore(dsn)
	if immunisation.StatusFor(s2.List(immunisation.Filter{Student: "ST-1"}), "ST-1", "MR") != immunisation.Complete {
		t.Fatal("two durable doses → complete")
	}
	// a different record filling MR dose-1 again → rejected (duplicate slot, persisted).
	if _, err := s2.AdministerDose(rec("PGH-3", "ST-1", "MR", 1, "2026-06-02")); err == nil {
		t.Fatal("a duplicate dose slot must be rejected across instances")
	}
	// re-record PGH-1 (correction) — same id, allowed.
	if _, err := s2.AdministerDose(rec("PGH-1", "ST-1", "MR", 1, "2026-06-03")); err != nil {
		t.Fatalf("idempotent correction: %v", err)
	}
	s3, _ := newPgImmStore(dsn)
	if g, ok := s3.Get("PGH-1"); !ok || g.AdministeredOn != "2026-06-03" {
		t.Fatalf("correction not durable: %+v", g)
	}
	// a second student's independent sequence holds.
	if _, err := s3.AdministerDose(rec("PGH-4", "ST-2", "MR", 2, "2026-06-05")); err == nil {
		t.Fatal("a second student's out-of-sequence dose must also be rejected")
	}
}

// TestImmunisationDashboardScoped proves the seeded register rolls up per-vaccine coverage + the due worklist
// (in-memory path).
func TestImmunisationDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.ImmunisationDashboard("TN-DIST-Chennai")
	if d.Students == 0 || d.Doses == 0 || len(d.Coverage) == 0 {
		t.Fatalf("seeded register must roll up: %+v", d)
	}
	// the single-dose vaccines should be fully covered across the cohort; MR is partial → a worklist exists.
	var mr VaccineCoverage
	for _, c := range d.Coverage {
		if c.Vaccine == "MR" {
			mr = c
		}
	}
	if mr.Complete == 0 || mr.Due == 0 {
		t.Fatalf("MR coverage must show both complete and due children: %+v", mr)
	}
	if len(d.Worklist) == 0 {
		t.Fatalf("a due/partial worklist must surface for the governing officer: %+v", d)
	}
	// a student's immunisation card is populated across the schedule.
	card := p.StudentImmunisationCard("SYN-S-001")
	if len(card.Status) != len(immunisation.Schedule()) || card.Doses == 0 {
		t.Fatalf("a seeded student's card must cover the schedule: %+v", card)
	}
	// unknown scope → nothing (fail-closed).
	if u := p.ImmunisationDashboard("TN-DIST-Nowhere"); u.Students != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
