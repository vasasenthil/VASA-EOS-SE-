package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/cpd"
)

// TestPgCpdDurable proves CPD records persist + upsert across fresh store instances and the NEP compliance
// analytics compute over the durable history. Runs only with DATABASE_URL set.
func TestPgCpdDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL CPD test runs against a live database only")
	}
	s1, err := newPgCpdStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM cpd_records WHERE id LIKE 'PGC-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	// a teacher with 30 + 25 certified hours in 2026 = 55 → compliant.
	s1.Record(cpd.Record{ID: "PGC-1", TeacherID: "PGC-T1", OrgUnit: "33000000001", Provider: cpd.NISHTHA, Hours: 30, Year: 2026, Status: cpd.Certified, CompletedOn: "2026-02-01"})
	s1.Record(cpd.Record{ID: "PGC-2", TeacherID: "PGC-T1", OrgUnit: "33000000001", Provider: cpd.SCERT, Hours: 25, Year: 2026, Status: cpd.Completed, CompletedOn: "2026-04-01"})
	// a deficient teacher: only 18 hours.
	s1.Record(cpd.Record{ID: "PGC-3", TeacherID: "PGC-T2", OrgUnit: "33000000001", Provider: cpd.DIET, Hours: 18, Year: 2026, Status: cpd.Certified, CompletedOn: "2026-03-01"})
	// re-record PGC-2 with corrected hours (upsert).
	s1.Record(cpd.Record{ID: "PGC-2", TeacherID: "PGC-T1", OrgUnit: "33000000001", Provider: cpd.SCERT, Hours: 22, Year: 2026, Status: cpd.Certified, CompletedOn: "2026-04-01"})

	// fresh instance: durable + correction applied.
	s2, _ := newPgCpdStore(dsn)
	if r, ok := s2.Get("PGC-2"); !ok || r.Hours != 22 || r.Status != cpd.Certified {
		t.Fatalf("upsert not durable: %+v", r)
	}
	t1 := s2.List(cpd.Filter{Teacher: "PGC-T1", Year: 2026})
	if cpd.HoursFor(t1) != 52 || !cpd.IsCompliant(t1) {
		t.Fatalf("compliant teacher: hours=%d compliant=%v", cpd.HoursFor(t1), cpd.IsCompliant(t1))
	}
	t2 := s2.List(cpd.Filter{Teacher: "PGC-T2", Year: 2026})
	if cpd.IsCompliant(t2) {
		t.Fatalf("18h teacher must be deficient: %d", cpd.HoursFor(t2))
	}
}

// TestCPDDashboardScoped proves the seeded compliance dashboard (in-memory path) rolls up + flags the deficient.
func TestCPDDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.CPDDashboard("TN-DIST-Chennai", 2026)
	if d.Teachers == 0 || d.TotalHours == 0 {
		t.Fatalf("seeded CPD must roll up: %+v", d)
	}
	if d.ComplianceRate <= 0 || d.ComplianceRate > 100 {
		t.Fatalf("compliance rate out of range: %v", d.ComplianceRate)
	}
	if len(d.Deficient) == 0 {
		t.Fatalf("the engineered deficient teacher must surface: %+v", d)
	}
	// a teacher profile carries hours + compliance.
	prof := p.TeacherCPDProfile("SYN-T-01", 2026)
	if prof.Target != cpd.AnnualTargetHours || prof.Hours == 0 {
		t.Fatalf("teacher CPD profile wrong: %+v", prof)
	}
	// unknown scope → nothing.
	if u := p.CPDDashboard("TN-DIST-Nowhere", 2026); u.Teachers != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
