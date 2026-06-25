package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/scholarship"
)

// TestPgScholarshipDurable proves the full DBT lifecycle persists to PostgreSQL across fresh store instances:
// amount-driven sanction chain, disbursement with a payment ref, and reconciliation. Runs only with DATABASE_URL.
func TestPgScholarshipDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL scholarship test runs against a live database only")
	}
	s1, err := newPgSchoStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM scholarship_disbursements WHERE id LIKE 'PGS-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	// a ₹60,000 post-matric → school → BEO → DEO sanction chain.
	d, err := s1.File("PGS-1", "STU-9", scholarship.PostMatric, 60_000*100, "33000000001")
	if err != nil || len(d.Chain) != 3 {
		t.Fatalf("file: %+v err=%v", d, err)
	}
	// wrong tier fail-closed.
	if _, err := s1.Decide("PGS-1", true, "DEO", "x", ""); err == nil {
		t.Fatal("the head teacher must sanction first")
	}
	if _, err := s1.Decide("PGS-1", true, "HEAD_TEACHER", "p", "ok"); err != nil {
		t.Fatalf("HM sanction: %v", err)
	}

	// fresh instance: chain progress + amount (paise) durable.
	s2, _ := newPgSchoStore(dsn)
	got, ok := s2.Get("PGS-1")
	if !ok || got.CurrentStep != 1 || got.AmountPaise != 60_000*100 || got.Chain[0].Decision != "approved" {
		t.Fatalf("sanction progress not durable: %+v", got)
	}
	// finish sanction on fresh instances → sanctioned.
	s2.Decide("PGS-1", true, "BEO", "b", "ok")
	s3, _ := newPgSchoStore(dsn)
	s3.Decide("PGS-1", true, "DEO", "d", "ok")
	s4, _ := newPgSchoStore(dsn)
	if san, _ := s4.Get("PGS-1"); san.Status != scholarship.Sanctioned {
		t.Fatalf("must be sanctioned + durable: %+v", san)
	}
	// disburse with a payment ref, durable.
	if _, err := s4.Disburse("PGS-1", "PFMS-TXN-D1"); err != nil {
		t.Fatalf("disburse: %v", err)
	}
	s5, _ := newPgSchoStore(dsn)
	dis, _ := s5.Get("PGS-1")
	if dis.Status != scholarship.Disbursed || dis.PaymentRef != "PFMS-TXN-D1" {
		t.Fatalf("disbursement not durable: %+v", dis)
	}
	// reconcile unmatched → flagged (leakage), durable.
	if _, err := s5.Reconcile("PGS-1", false); err != nil {
		t.Fatalf("reconcile: %v", err)
	}
	s6, _ := newPgSchoStore(dsn)
	if fin, _ := s6.Get("PGS-1"); fin.Status != scholarship.Flagged {
		t.Fatalf("unmatched reconcile must durably flag leakage: %+v", fin)
	}
}

// TestScholarshipDashboardScoped proves the dashboard rolls up the DBT picture (in-memory path).
func TestScholarshipDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	school := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	if _, err := p.FileScholarship("DBT-A", "S-1", scholarship.Merit, 5_000*100, school); err != nil {
		t.Fatal(err)
	}
	d := p.ScholarshipDashboard("TN-DIST-Chennai")
	if d.Total == 0 || d.PendingSanction == 0 || d.ByScheme[scholarship.Merit] == 0 {
		t.Fatalf("the filed disbursement must roll up: %+v", d)
	}
	// an unknown scope sees nothing (fail-closed).
	if u := p.ScholarshipDashboard("TN-DIST-Nowhere"); u.Total != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
