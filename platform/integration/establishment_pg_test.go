package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/establishment"
)

// TestPgEstablishmentDurable proves sanctioned posts + appointments persist across fresh instances, the
// over-appointment and no-double-post invariants are enforced durably, and a vacate frees a post. Runs only with
// DATABASE_URL set.
func TestPgEstablishmentDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL establishment test runs against a live database only")
	}
	s1, err := newPgEstabStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM establishment_appointments WHERE org_unit='PGS-SCH'`); err != nil {
		t.Fatalf("cleanup appts: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM establishments WHERE org_unit='PGS-SCH'`); err != nil {
		t.Fatalf("cleanup ests: %v", err)
	}
	est := func(id string, sanctioned int, status string) establishment.Establishment {
		return establishment.Establishment{ID: id, OrgUnit: "PGS-SCH", Cadre: "BT", Sanctioned: sanctioned, Status: status}
	}
	appt := func(id, estID, emp string) establishment.Appointment {
		return establishment.Appointment{ID: id, EstablishmentID: estID, OrgUnit: "PGS-SCH", EmployeeID: emp, Name: emp, Status: establishment.Filled, AppointedOn: "2026-06-01"}
	}

	if _, err := s1.UpsertEstablishment(est("PGS-E1", 2, establishment.Active)); err != nil {
		t.Fatalf("sanction: %v", err)
	}
	if _, err := s1.Appoint(appt("PGS-A1", "PGS-E1", "EMP-1")); err != nil {
		t.Fatalf("appoint 1: %v", err)
	}
	if _, err := s1.Appoint(appt("PGS-A2", "PGS-E1", "EMP-2")); err != nil {
		t.Fatalf("appoint 2: %v", err)
	}
	// third appointment exceeds 2 sanctioned → rejected durably.
	if _, err := s1.Appoint(appt("PGS-A3", "PGS-E1", "EMP-3")); err == nil {
		t.Fatal("a durable sanctioned strength must be enforced")
	}
	// the same employee twice → rejected.
	if _, err := s1.Appoint(appt("PGS-A4", "PGS-E1", "EMP-1")); err == nil {
		t.Fatal("a durable double-post must be rejected")
	}

	// fresh instance: appointments durable, strength still enforced.
	s2, _ := newPgEstabStore(dsn)
	if s2.Vacancies("PGS-E1") != 0 {
		t.Fatalf("no vacancies expected: %d", s2.Vacancies("PGS-E1"))
	}
	if _, err := s2.Appoint(appt("PGS-A3", "PGS-E1", "EMP-3")); err == nil {
		t.Fatal("the over-appointment gate must persist across instances")
	}
	// vacate one → a post frees, durable.
	if _, err := s2.Vacate("PGS-A1"); err != nil {
		t.Fatalf("vacate: %v", err)
	}
	s3, _ := newPgEstabStore(dsn)
	if s3.Vacancies("PGS-E1") != 1 {
		t.Fatalf("one vacancy expected after vacate: %d", s3.Vacancies("PGS-E1"))
	}
	if _, err := s3.Appoint(appt("PGS-A3", "PGS-E1", "EMP-3")); err != nil {
		t.Fatalf("a freed post must be fillable durably: %v", err)
	}
	// a frozen establishment refuses appointments, durably.
	s3.UpsertEstablishment(est("PGS-E2", 5, establishment.Frozen))
	s4, _ := newPgEstabStore(dsn)
	if _, err := s4.Appoint(appt("PGS-A9", "PGS-E2", "EMP-9")); err == nil {
		t.Fatal("a durable frozen establishment takes no appointments")
	}
}

// TestEstablishmentDashboardScoped proves the seeded register rolls up sanctioned-vs-filled + the vacancy roster
// (in-memory path).
func TestEstablishmentDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.EstablishmentDashboard("TN-DIST-Chennai")
	if d.Cadres == 0 || d.Sanctioned == 0 || d.Filled == 0 {
		t.Fatalf("seeded register must roll up: %+v", d)
	}
	// the seed leaves vacancies (BT, PET, Office Assistant) → vacancy roster + a positive vacancy rate.
	if d.Vacant == 0 || len(d.Vacancies) == 0 || d.VacancyPct <= 0 {
		t.Fatalf("seeded vacancies must surface: %+v", d)
	}
	// filled never exceeds sanctioned (the invariant holds in aggregate).
	if d.Filled > d.Sanctioned {
		t.Fatalf("filled must never exceed sanctioned: %+v", d)
	}
	// an establishment's roster is non-empty for a filled cadre.
	if len(p.EstablishmentRoster("ESTAB-CHN-02")) == 0 {
		t.Fatal("a seeded establishment must have a roster")
	}
	// unknown scope → nothing (fail-closed).
	if u := p.EstablishmentDashboard("TN-DIST-Nowhere"); u.Cadres != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
